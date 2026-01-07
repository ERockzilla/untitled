import { useState, useEffect, useCallback, useRef } from 'react';
import { TouchControls } from './TouchControls';
import { launchConfetti, screenShake, showAchievement } from '../../lib/useEasterEggs';
import { hapticFeedback, useTouchControls } from '../../lib/useTouchControls';
import { useAutoPause } from '../../lib/useAutoPause';

// Tetromino definitions
const TETROMINOES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f5ff',
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: '#ffd700',
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
        ],
        color: '#a855f7',
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
        ],
        color: '#22c55e',
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
        ],
        color: '#ef4444',
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
        ],
        color: '#3b82f6',
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
        ],
        color: '#f97316',
    },
};

type TetrominoType = keyof typeof TETROMINOES;

interface Piece {
    type: TetrominoType;
    shape: number[][];
    x: number;
    y: number;
    color: string;
}

interface TetrisProps {
    onGameOver?: (score: number, lines: number, level: number) => void;
    onScoreChange?: (score: number) => void;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const DESKTOP_CELL_SIZE = 28;
const MOBILE_CELL_SIZE = 18;

// Create empty board
function createBoard(): (string | null)[][] {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
}

// Get random tetromino
function randomTetromino(): Piece {
    const types = Object.keys(TETROMINOES) as TetrominoType[];
    const type = types[Math.floor(Math.random() * types.length)];
    const tetromino = TETROMINOES[type];
    return {
        type,
        shape: tetromino.shape.map(row => [...row]),
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
        y: 0,
        color: tetromino.color,
    };
}

// Rotate matrix 90 degrees clockwise
function rotateMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated: number[][] = [];

    for (let col = 0; col < cols; col++) {
        rotated.push([]);
        for (let row = rows - 1; row >= 0; row--) {
            rotated[col].push(matrix[row][col]);
        }
    }

    return rotated;
}

// Check collision
function checkCollision(
    board: (string | null)[][],
    piece: Piece,
    offsetX: number = 0,
    offsetY: number = 0
): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;

                if (
                    newX < 0 ||
                    newX >= BOARD_WIDTH ||
                    newY >= BOARD_HEIGHT ||
                    (newY >= 0 && board[newY][newX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece into board
function mergePiece(board: (string | null)[][], piece: Piece): (string | null)[][] {
    const newBoard = board.map(row => [...row]);

    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardY = piece.y + y;
                const boardX = piece.x + x;
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    newBoard[boardY][boardX] = piece.color;
                }
            }
        }
    }

    return newBoard;
}

// Clear completed lines
function clearLines(board: (string | null)[][]): { newBoard: (string | null)[][]; clearedLines: number } {
    let clearedLines = 0;
    const newBoard = board.filter(row => {
        const isFull = row.every(cell => cell !== null);
        if (isFull) clearedLines++;
        return !isFull;
    });

    // Add empty rows at top
    while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    return { newBoard, clearedLines };
}

// Calculate ghost piece position
function getGhostY(board: (string | null)[][], piece: Piece): number {
    let ghostY = piece.y;
    while (!checkCollision(board, { ...piece, y: ghostY + 1 })) {
        ghostY++;
    }
    return ghostY;
}

export function Tetris({ onGameOver, onScoreChange }: TetrisProps) {
    const [board, setBoard] = useState<(string | null)[][]>(createBoard);
    const [currentPiece, setCurrentPiece] = useState<Piece>(randomTetromino);
    const [nextPiece, setNextPiece] = useState<Piece>(randomTetromino);
    const [heldPiece, setHeldPiece] = useState<Piece | null>(null);
    const [canHold, setCanHold] = useState(true);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    const gameLoopRef = useRef<number | undefined>(undefined);
    const lastDropRef = useRef<number>(0);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(hasTouchScreen && isSmallScreen);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Dynamic cell size based on device
    const CELL_SIZE = isMobile ? MOBILE_CELL_SIZE : DESKTOP_CELL_SIZE;

    // Calculate drop speed based on level
    const dropSpeed = Math.max(100, 1000 - (level - 1) * 100);

    // Score calculation
    const calculateScore = useCallback((clearedLines: number) => {
        const lineScores = [0, 100, 300, 500, 800];
        return lineScores[clearedLines] * level;
    }, [level]);

    // Move piece
    const movePiece = useCallback((dx: number, dy: number) => {
        if (gameOver || isPaused || !isPlaying) return;

        setCurrentPiece(prev => {
            if (!checkCollision(board, prev, dx, dy)) {
                return { ...prev, x: prev.x + dx, y: prev.y + dy };
            }
            return prev;
        });
    }, [board, gameOver, isPaused, isPlaying]);

    // Rotate piece
    const rotatePiece = useCallback(() => {
        if (gameOver || isPaused || !isPlaying) return;

        setCurrentPiece(prev => {
            const rotated = rotateMatrix(prev.shape);
            const newPiece = { ...prev, shape: rotated };

            // Wall kick - try moving left/right if rotation causes collision
            if (!checkCollision(board, newPiece)) {
                return newPiece;
            }
            if (!checkCollision(board, newPiece, -1, 0)) {
                return { ...newPiece, x: newPiece.x - 1 };
            }
            if (!checkCollision(board, newPiece, 1, 0)) {
                return { ...newPiece, x: newPiece.x + 1 };
            }
            if (!checkCollision(board, newPiece, -2, 0)) {
                return { ...newPiece, x: newPiece.x - 2 };
            }
            if (!checkCollision(board, newPiece, 2, 0)) {
                return { ...newPiece, x: newPiece.x + 2 };
            }

            return prev; // Can't rotate
        });
    }, [board, gameOver, isPaused, isPlaying]);

    // Hard drop
    const hardDrop = useCallback(() => {
        if (gameOver || isPaused || !isPlaying) return;

        setCurrentPiece(prev => {
            const ghostY = getGhostY(board, prev);
            const dropDistance = ghostY - prev.y;
            setScore(s => s + dropDistance * 2); // Bonus points for hard drop
            return { ...prev, y: ghostY };
        });
    }, [board, gameOver, isPaused, isPlaying]);

    // Hold piece
    const holdPiece = useCallback(() => {
        if (gameOver || isPaused || !isPlaying || !canHold) return;

        if (heldPiece) {
            const temp = heldPiece;
            setHeldPiece({
                ...currentPiece,
                x: Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2),
                y: 0,
                shape: TETROMINOES[currentPiece.type].shape.map(row => [...row]),
            });
            setCurrentPiece({
                ...temp,
                x: Math.floor(BOARD_WIDTH / 2) - Math.floor(temp.shape[0].length / 2),
                y: 0,
            });
        } else {
            setHeldPiece({
                ...currentPiece,
                x: Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2),
                y: 0,
                shape: TETROMINOES[currentPiece.type].shape.map(row => [...row]),
            });
            setCurrentPiece(nextPiece);
            setNextPiece(randomTetromino());
        }
        setCanHold(false);
    }, [currentPiece, heldPiece, nextPiece, canHold, gameOver, isPaused, isPlaying]);

    // Auto-pause when tab loses focus (UX best practice)
    useAutoPause(isPlaying, isPaused, setIsPaused);

    // Swipe gesture controls for mobile (more intuitive than D-pad)
    useTouchControls(gameAreaRef, {
        onSwipeLeft: () => movePiece(-1, 0),
        onSwipeRight: () => movePiece(1, 0),
        onSwipeDown: () => hardDrop(),
        onSwipeUp: () => holdPiece(),
        onTap: () => rotatePiece(),
        threshold: 30, // Sensitive enough for quick swipes
    });

    // Lock piece and spawn new one
    const lockPiece = useCallback(() => {
        const newBoard = mergePiece(board, currentPiece);
        const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);

        setBoard(clearedBoard);

        if (clearedLines > 0) {
            const newScore = score + calculateScore(clearedLines);
            setScore(newScore);
            onScoreChange?.(newScore);

            const newLines = lines + clearedLines;
            setLines(newLines);

            // 🎮 Easter eggs for line clears!
            hapticFeedback(clearedLines >= 4 ? 'heavy' : clearedLines >= 2 ? 'medium' : 'light');

            if (clearedLines >= 4) {
                // TETRIS! Big celebration
                launchConfetti({ particleCount: 100, spread: 80 });
                screenShake('heavy');
                showAchievement('TETRIS!', '4 lines cleared at once!', '🔥');
            } else if (clearedLines >= 2) {
                screenShake('medium');
            } else {
                screenShake('light');
            }

            // Achievement milestones
            if (newLines >= 100 && lines < 100) {
                showAchievement('Century!', '100 lines cleared!', '💯');
                launchConfetti({ particleCount: 150, spread: 100 });
            } else if (newLines >= 50 && lines < 50) {
                showAchievement('Halfway There!', '50 lines cleared!', '🌟');
            } else if (newLines >= 10 && lines < 10) {
                showAchievement('Warm Up Complete', '10 lines cleared!', '✨');
            }

            // Level up every 10 lines
            const newLevel = Math.floor(newLines / 10) + 1;
            if (newLevel > level) {
                showAchievement(`Level ${newLevel}!`, 'Speed increased!', '⚡');
            }
            setLevel(newLevel);
        }

        // Spawn new piece
        const newPiece = nextPiece;
        setNextPiece(randomTetromino());
        setCanHold(true);

        // Check game over
        if (checkCollision(clearedBoard, newPiece)) {
            setGameOver(true);
            setIsPlaying(false);
            onGameOver?.(score + calculateScore(clearedLines), lines + clearedLines, level);
        } else {
            setCurrentPiece(newPiece);
        }
    }, [board, currentPiece, nextPiece, score, lines, level, calculateScore, onGameOver, onScoreChange]);

    // Game loop
    useEffect(() => {
        if (gameOver || isPaused || !isPlaying) return;

        const gameLoop = (timestamp: number) => {
            if (timestamp - lastDropRef.current >= dropSpeed) {
                lastDropRef.current = timestamp;

                setCurrentPiece(prev => {
                    if (checkCollision(board, prev, 0, 1)) {
                        // Schedule lock
                        setTimeout(lockPiece, 0);
                        return prev;
                    }
                    return { ...prev, y: prev.y + 1 };
                });
            }

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [board, dropSpeed, gameOver, isPaused, isPlaying, lockPiece]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    movePiece(0, 1);
                    setScore(s => s + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    hardDrop();
                    break;
                case 'c':
                case 'C':
                    e.preventDefault();
                    holdPiece();
                    break;
                case 'p':
                case 'P':
                case 'Escape':
                    e.preventDefault();
                    if (isPlaying) setIsPaused(p => !p);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePiece, rotatePiece, hardDrop, holdPiece, gameOver, isPlaying]);

    // Start new game
    const startGame = useCallback(() => {
        setBoard(createBoard());
        setCurrentPiece(randomTetromino());
        setNextPiece(randomTetromino());
        setHeldPiece(null);
        setCanHold(true);
        setScore(0);
        setLines(0);
        setLevel(1);
        setGameOver(false);
        setIsPaused(false);
        setIsPlaying(true);
        lastDropRef.current = performance.now();
    }, []);

    // Get ghost piece Y
    const ghostY = isPlaying ? getGhostY(board, currentPiece) : currentPiece.y;

    // Render mini piece preview
    const renderMiniPiece = (piece: Piece | null, size: number = 16) => {
        if (!piece) return null;
        const shape = TETROMINOES[piece.type].shape;
        return (
            <div className="flex flex-col items-center justify-center">
                {shape.map((row, y) => (
                    <div key={y} className="flex">
                        {row.map((cell, x) => (
                            <div
                                key={x}
                                style={{
                                    width: size,
                                    height: size,
                                    backgroundColor: cell ? piece.color : 'transparent',
                                    borderRadius: 2,
                                    margin: 1,
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex gap-4 sm:gap-6 items-start justify-center">
            {/* Hold piece */}
            <div className="hidden sm:block">
                <div className="text-xs text-subtle mb-2 text-center">HOLD</div>
                <div className="w-20 h-20 bg-elevated rounded-lg flex items-center justify-center border border-muted">
                    {renderMiniPiece(heldPiece)}
                </div>
                <div className="text-xs text-subtle mt-1 text-center opacity-50">Press C</div>
            </div>

            {/* Main game board */}
            <div className="relative">
                <div
                    ref={gameAreaRef}
                    className="relative bg-void rounded-lg overflow-hidden border-2 border-elevated touch-none"
                    style={{
                        width: BOARD_WIDTH * CELL_SIZE,
                        height: BOARD_HEIGHT * CELL_SIZE,
                    }}
                >
                    {/* Grid background */}
                    <div className="absolute inset-0 grid"
                        style={{
                            gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
                            gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
                        }}
                    >
                        {Array(BOARD_WIDTH * BOARD_HEIGHT).fill(null).map((_, i) => (
                            <div
                                key={i}
                                className="border border-white/5"
                            />
                        ))}
                    </div>

                    {/* Placed pieces */}
                    {board.map((row, y) =>
                        row.map((cell, x) =>
                            cell && (
                                <div
                                    key={`${x}-${y}`}
                                    className="absolute rounded-sm"
                                    style={{
                                        left: x * CELL_SIZE + 2,
                                        top: y * CELL_SIZE + 2,
                                        width: CELL_SIZE - 4,
                                        height: CELL_SIZE - 4,
                                        backgroundColor: cell,
                                        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.3), 0 0 10px ${cell}40`,
                                    }}
                                />
                            )
                        )
                    )}

                    {/* Ghost piece - enhanced visibility */}
                    {isPlaying && !gameOver && currentPiece.shape.map((row, y) =>
                        row.map((cell, x) =>
                            cell ? (
                                <div
                                    key={`ghost-${x}-${y}`}
                                    className="absolute rounded-sm border-2 border-dashed animate-ghost-pulse"
                                    style={{
                                        left: (currentPiece.x + x) * CELL_SIZE + 2,
                                        top: (ghostY + y) * CELL_SIZE + 2,
                                        width: CELL_SIZE - 4,
                                        height: CELL_SIZE - 4,
                                        borderColor: currentPiece.color,
                                        backgroundColor: `${currentPiece.color}15`,
                                    }}
                                />
                            ) : null
                        )
                    )}

                    {/* Current piece */}
                    {isPlaying && !gameOver && currentPiece.shape.map((row, y) =>
                        row.map((cell, x) =>
                            cell ? (
                                <div
                                    key={`current-${x}-${y}`}
                                    className="absolute rounded-sm transition-all duration-50"
                                    style={{
                                        left: (currentPiece.x + x) * CELL_SIZE + 2,
                                        top: (currentPiece.y + y) * CELL_SIZE + 2,
                                        width: CELL_SIZE - 4,
                                        height: CELL_SIZE - 4,
                                        backgroundColor: currentPiece.color,
                                        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.3), 0 0 15px ${currentPiece.color}60`,
                                    }}
                                />
                            ) : null
                        )
                    )}

                    {/* Start overlay */}
                    {!isPlaying && !gameOver && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                            <div className="text-2xl font-bold text-white">TETRIS</div>
                            <button
                                onClick={startGame}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-bold hover:scale-105 transition-transform"
                            >
                                Start Game
                            </button>
                        </div>
                    )}

                    {/* Paused overlay */}
                    {isPaused && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                            <div className="text-2xl font-bold text-white">PAUSED</div>
                            <button
                                onClick={() => setIsPaused(false)}
                                className="px-6 py-3 bg-cyan-500 rounded-lg text-white font-bold hover:bg-cyan-400 transition-colors"
                            >
                                Resume
                            </button>
                        </div>
                    )}

                    {/* Game over overlay */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                            <div className="text-2xl font-bold text-red-500">GAME OVER</div>
                            <div className="text-white text-center">
                                <div>Score: {score.toLocaleString()}</div>
                                <div>Lines: {lines}</div>
                                <div>Level: {level}</div>
                            </div>
                            <button
                                onClick={startGame}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-bold hover:scale-105 transition-transform"
                            >
                                Play Again
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-4">
                {/* Next piece */}
                <div>
                    <div className="text-xs text-subtle mb-2 text-center">NEXT</div>
                    <div className="w-20 h-20 bg-elevated rounded-lg flex items-center justify-center border border-muted">
                        {renderMiniPiece(nextPiece)}
                    </div>
                </div>

                {/* Score */}
                <div className="bg-elevated rounded-lg p-3 border border-muted">
                    <div className="text-xs text-subtle">SCORE</div>
                    <div className="text-xl font-bold text-accent tabular-nums">
                        {score.toLocaleString()}
                    </div>
                </div>

                {/* Lines */}
                <div className="bg-elevated rounded-lg p-3 border border-muted">
                    <div className="text-xs text-subtle">LINES</div>
                    <div className="text-lg font-bold text-secondary tabular-nums">{lines}</div>
                </div>

                {/* Level */}
                <div className="bg-elevated rounded-lg p-3 border border-muted">
                    <div className="text-xs text-subtle">LEVEL</div>
                    <div className="text-lg font-bold text-tertiary tabular-nums">{level}</div>
                </div>

                {/* Pause button */}
                {isPlaying && !gameOver && (
                    <button
                        onClick={() => setIsPaused(p => !p)}
                        className="px-4 py-2 bg-elevated hover:bg-muted rounded-lg text-sm text-text transition-colors"
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                )}

                {/* Mobile hold button */}
                {isMobile && isPlaying && !gameOver && !isPaused && (
                    <button
                        onClick={holdPiece}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors border border-purple-500/30"
                    >
                        Hold
                    </button>
                )}
            </div>

            {/* Mobile Touch Controls */}
            {isMobile && isPlaying && !gameOver && !isPaused && (
                <div className="mt-4 w-full" ref={boardContainerRef}>
                    <TouchControls
                        onMove={(direction) => {
                            switch (direction) {
                                case 'left':
                                    movePiece(-1, 0);
                                    break;
                                case 'right':
                                    movePiece(1, 0);
                                    break;
                                case 'down':
                                    movePiece(0, 1);
                                    setScore(s => s + 1);
                                    break;
                                case 'up':
                                    rotatePiece();
                                    break;
                            }
                        }}
                        onAction1={rotatePiece}
                        action1Label="↻"
                        onAction2={hardDrop}
                        action2Label="⬇"
                        size="medium"
                    />
                </div>
            )}
        </div>
    );
}
