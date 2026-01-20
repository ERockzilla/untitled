
import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {

    TETRACUBES,
    BOARD_SIZE,
    createEmptyBoard,
    getRandomPieceType,
    checkCollision,
    mergePieceToBoard,
    checkLayers,
    getGhostPosition,
    type GameState,
    VOXEL_PALETTE
} from '../../lib/voxelTetrisLogic';
import { useAutoPause } from '../../lib/useAutoPause';
import { useAuth } from '../../lib/AuthContext';
import { recordGameResultWithSync } from '../../lib/gamesUtils';
import { GameIntro } from './GameIntro';

// --- Sub-components for 3D Rendering ---

function VoxelBlock({ position, color, isGhost = false }: { position: [number, number, number], color: string, isGhost?: boolean }) {
    return (
        <mesh position={position}>
            <boxGeometry args={[0.95, 0.95, 0.95]} />
            <meshStandardMaterial
                color={color}
                transparent={isGhost}
                opacity={isGhost ? 0.3 : 1}
                emissive={color}
                emissiveIntensity={isGhost ? 0.2 : 0.5}
            />
            {/* Wireframe edge for better visibility */}
            {!isGhost && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(0.95, 0.95, 0.95)]} />
                    <lineBasicMaterial color="white" transparent opacity={0.3} />
                </lineSegments>
            )}
        </mesh>
    );
}

function GameWell({ size }: { size: typeof BOARD_SIZE }) {
    // Draw the bounds of the well
    // We want a wireframe box of size x, y, z
    // Centered at size.x/2 - 0.5, size.y/2 - 0.5, size.z/2 - 0.5 effectively

    // Floor
    return (
        <group>
            {/* Floor Grid */}
            <gridHelper
                args={[size.x, size.x, 0x444444, 0x222222]}
                position={[size.x / 2 - 0.5, -0.5, size.z / 2 - 0.5]}
            />

            {/* Vertical corners */}
            <group position={[size.x / 2 - 0.5, size.y / 2 - 0.5, size.z / 2 - 0.5]}>
                <mesh>
                    <boxGeometry args={[size.x, size.y, size.z]} />
                    <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
                </mesh>
            </group>
        </group>
    );
}

function CurrentPiece({ piece, ghostY }: { piece: NonNullable<GameState['activePiece']>, ghostY: number }) {
    if (!piece) return null;

    const shape = piece.shape;
    const color = TETRACUBES[piece.type].color;

    return (
        <group>
            {/* Actual Piece */}
            {shape.map((p, i) => (
                <VoxelBlock
                    key={`p-${i}`}
                    position={[piece.position.x + p.x, piece.position.y + p.y, piece.position.z + p.z]}
                    color={color || '#fff'}
                />
            ))}

            {/* Ghost Piece */}
            {shape.map((p, i) => (
                <VoxelBlock
                    key={`g-${i}`}
                    position={[piece.position.x + p.x, ghostY + p.y, piece.position.z + p.z]}
                    color={color || '#fff'}
                    isGhost
                />
            ))}
        </group>
    );
}

function StaticBlocks({ board }: { board: number[][][] }) {
    const blocks = [];
    for (let x = 0; x < BOARD_SIZE.x; x++) {
        for (let y = 0; y < BOARD_SIZE.y; y++) {
            for (let z = 0; z < BOARD_SIZE.z; z++) {
                const colorIdx = board[x][y][z];
                if (colorIdx > 0) {
                    blocks.push(
                        <VoxelBlock
                            key={`${x}-${y}-${z}`}
                            position={[x, y, z]}
                            color={VOXEL_PALETTE[colorIdx]}
                        />
                    );
                }
            }
        }
    }
    return <group>{blocks}</group>;
}

// --- Main Component ---

export function VoxelTetris() {
    const { user } = useAuth();
    const [gameState, setGameState] = useState<GameState>({
        board: createEmptyBoard(),
        activePiece: null,
        score: 0,
        level: 1,
        lines: 0,
        gameOver: false,
        isPaused: true, // Start paused
        nextPiece: getRandomPieceType()
    });
    const [showIntro, setShowIntro] = useState(true);

    const stateRef = useRef(gameState); // Ref for accessing state in event listeners/intervals
    const startTimeRef = useRef<number>(Date.now());

    // Sync ref
    useEffect(() => { stateRef.current = gameState; }, [gameState]);

    // Resume logic
    // Resume logic
    useAutoPause(
        !gameState.gameOver,
        gameState.isPaused,
        (paused) => setGameState(prev => ({ ...prev, isPaused: paused }))
    );

    // Spawning a new piece
    const spawnPiece = useCallback(() => {
        const type = stateRef.current.nextPiece;
        const next = getRandomPieceType();
        const startPos = {
            x: Math.floor(BOARD_SIZE.x / 2),
            y: BOARD_SIZE.y - 1,
            z: Math.floor(BOARD_SIZE.z / 2)
        };
        const startRot = { x: 0, y: 0, z: 0 };
        const baseShape = TETRACUBES[type].shape;

        // Check spawn collision
        if (checkCollision(baseShape, startPos, stateRef.current.board)) {
            // GAME OVER - Save stats
            const timeSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const finalScore = stateRef.current.score;
            if (finalScore > 0) { // Only save if they actually played/scored
                recordGameResultWithSync('voxel-tetris', true, user ? user.id : null, {
                    score: finalScore,
                    timeSeconds
                });
            }

            setGameState(prev => ({ ...prev, gameOver: true, isPaused: true }));
            return;
        }

        setGameState(prev => ({
            ...prev,
            activePiece: {
                type,
                position: startPos,
                rotation: startRot,
                shape: baseShape
            },
            nextPiece: next
        }));
    }, []);

    // Locking the piece
    const lockPiece = useCallback(() => {
        const { activePiece, board, level } = stateRef.current;
        if (!activePiece) return;

        // Merge
        const newBoard = mergePieceToBoard(activePiece.shape, activePiece.position, activePiece.type, board);

        // Clear lines
        const { board: clearedBoard, cleared } = checkLayers(newBoard);

        // Scoring
        const points = cleared === 0 ? 0 : [0, 100, 300, 500, 800][Math.min(cleared, 4)] * level;

        setGameState(prev => ({
            ...prev,
            board: clearedBoard,
            activePiece: null, // Ready for next spawn
            score: prev.score + points,
            lines: prev.lines + cleared,
            level: Math.floor((prev.lines + cleared) / 10) + 1
        }));

        // Spawn next (in next tick)
        // We use setTimeout to allow render to clear piece first
        setTimeout(spawnPiece, 0);

    }, [spawnPiece]);

    // Movement Logic
    const move = useCallback((dx: number, dy: number, dz: number) => {
        const { activePiece, board } = stateRef.current;
        if (!activePiece) return;

        const newPos = {
            x: activePiece.position.x + dx,
            y: activePiece.position.y + dy,
            z: activePiece.position.z + dz
        };

        if (!checkCollision(activePiece.shape, newPos, board)) {
            setGameState(prev => ({
                ...prev,
                activePiece: { ...prev.activePiece!, position: newPos }
            }));
            return true;
        } else {
            // Collision
            if (dy < 0 && dx === 0 && dz === 0) {
                // Hit bottom
                lockPiece();
            }
            return false;
        }
    }, [lockPiece]);

    // Rotation Logic
    const rotate = useCallback((axis: 'x' | 'y' | 'z') => {
        const { activePiece, board } = stateRef.current;
        if (!activePiece) return;

        // Calculate new rotation vector (simplified, just to keep track)
        // Real rotation happens on shape
        // In this simple version, we don't accumulate rotation vector, we just transform current shape
        // Wait, accumulation is better for wall kicks. For now, let's just transform the shape array.

        const newShape = activePiece.shape.map(p => {
            // Rotate p around 0,0,0
            switch (axis) {
                case 'x': return { x: p.x, y: -p.z, z: p.y };
                case 'y': return { x: p.z, y: p.y, z: -p.x };
                case 'z': return { x: -p.y, y: p.x, z: p.z };
            }
        });

        if (!checkCollision(newShape, activePiece.position, board)) {
            setGameState(prev => ({
                ...prev,
                activePiece: { ...prev.activePiece!, shape: newShape }
            }));
        }
    }, []);

    // Loop
    useEffect(() => {
        if (!gameState.isPaused && !gameState.gameOver) {
            const speed = Math.max(100, 1000 - (gameState.level - 1) * 100);
            const interval = setInterval(() => {
                if (!stateRef.current.activePiece) {
                    if (stateRef.current.board) spawnPiece();
                } else {
                    move(0, -1, 0); // Gravity
                }
            }, speed);
            return () => clearInterval(interval);
        }
    }, [gameState.isPaused, gameState.gameOver, gameState.level, move, spawnPiece]);

    // Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (stateRef.current.isPaused || stateRef.current.gameOver) return;

            switch (e.key) {
                case 'ArrowLeft': move(-1, 0, 0); break;
                case 'ArrowRight': move(1, 0, 0); break;
                case 'ArrowUp': move(0, 0, -1); break;
                case 'ArrowDown': move(0, 0, 1); break;
                case ' ': // Hard drop
                    let dropped = 0;
                    while (move(0, -1, 0)) { dropped++ }
                    break;
                case 'Shift': // Soft drop
                    move(0, -1, 0);
                    break;
                case 'w': rotate('x'); break;
                case 's': rotate('x'); break; // Inverse? simplified for now
                case 'a': rotate('y'); break;
                case 'd': rotate('y'); break;
                case 'q': rotate('z'); break;
                case 'e': rotate('z'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move, rotate]);

    // Start Game
    const startGame = () => {
        setGameState(prev => ({
            ...prev,
            board: createEmptyBoard(),
            activePiece: null,
            score: 0,
            lines: 0,
            level: 1,
            gameOver: false,
            isPaused: false
        }));
        startTimeRef.current = Date.now();
        spawnPiece();
    };


    // Calculate Camera Position
    // We want an isometric-ish view
    // Center is 2.5, 7, 2.5
    // Camera should be up and back

    return (
        <div className="w-full h-screen bg-void relative overflow-hidden">

            {/* 3D Scene */}
            <Canvas shadows camera={{ position: [14, 20, 14], fov: 45 }}>
                <color attach="background" args={['#050510']} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <OrbitControls target={[3, 7, 3]} /> {/* Look at center of well */}

                <group>
                    <GameWell size={BOARD_SIZE} />
                    <StaticBlocks board={gameState.board} />
                    {gameState.activePiece && (
                        <CurrentPiece
                            piece={gameState.activePiece}
                            ghostY={getGhostPosition(
                                gameState.activePiece.shape,
                                gameState.activePiece.position,
                                gameState.board
                            ).y}
                        />
                    )}
                </group>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 p-6 pointer-events-none">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
                    VOXTRIS
                </div>
                <div className="space-y-2 text-text font-mono">
                    <div>SCORE: <span className="text-accent">{gameState.score}</span></div>
                    <div>LINES: <span className="text-secondary">{gameState.lines}</span></div>
                    <div>LEVEL: <span className="text-tertiary">{gameState.level}</span></div>
                </div>
            </div>

            {/* Controls Helper */}
            <div className="absolute bottom-6 left-6 text-xs text-subtle pointer-events-none">
                <div>ARROWS: Move X/Z</div>
                <div>SPACE: Hard Drop</div>
                <div>W/S: Rotate X</div>
                <div>A/D: Rotate Y</div>
                <div>Q/E: Rotate Z</div>
            </div>

            {/* Game Over / Pause Menu */}
            {(gameState.isPaused || gameState.gameOver || showIntro) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-elevated border border-muted p-8 rounded-2xl max-w-md text-center shadow-2xl">
                        {showIntro ? (
                            <GameIntro
                                title="Welcome to VoxTris"
                                description="Tetris in 3 Dimensions. Spin blocks on 3 axes. Fill entire 6x6 layers to clear them!"
                                onStart={() => { setShowIntro(false); startGame(); }}
                            />
                        ) : gameState.gameOver ? (
                            <>
                                <h2 className="text-3xl font-bold mb-2 text-red-500">GAME OVER</h2>
                                <div className="text-xl mb-6">Score: {gameState.score}</div>
                                <button
                                    onClick={startGame}
                                    className="px-8 py-3 bg-accent text-void font-bold rounded-lg hover:bg-accent-muted transition-colors"
                                >
                                    Try Again
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold mb-6">PAUSED</h2>
                                <button
                                    onClick={() => setGameState(p => ({ ...p, isPaused: false }))}
                                    className="px-8 py-3 bg-secondary text-void font-bold rounded-lg hover:opacity-80 transition-colors"
                                >
                                    Resume
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
