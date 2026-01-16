import { useState, useEffect, useCallback } from 'react';
import {
    generatePuzzle,
    checkSolution,
    findConflicts,
    createEmptyNotes,
    type SudokuBoard,
    type SudokuNotes,
    type SudokuPuzzle,
} from '../../lib/sudokuGenerator';
import { launchConfetti, showAchievement } from '../../lib/useEasterEggs';
import { hapticFeedback } from '../../lib/useTouchControls';

interface SudokuProps {
    difficulty?: 'easy' | 'medium' | 'hard';
    onComplete?: (time: number) => void;
    onNewGame?: () => void;
}

// Get responsive cell size based on screen width
function getCellSize(): number {
    if (typeof window === 'undefined') return 40;
    const screenWidth = window.innerWidth;
    // Leave room for padding (32px total) and ensure minimum touch target
    const maxGridWidth = screenWidth - 32;
    const maxCellSize = Math.floor((maxGridWidth - 8) / 9); // -8 for grid borders
    // Clamp between 36px (minimum touch target) and 48px (comfortable size)
    return Math.min(48, Math.max(36, maxCellSize));
}

interface MoveHistory {
    row: number;
    col: number;
    prevValue: number;
    newValue: number;
}

export function Sudoku({ difficulty = 'medium', onComplete, onNewGame }: SudokuProps) {
    const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
    const [board, setBoard] = useState<SudokuBoard>([]);
    const [notes, setNotes] = useState<SudokuNotes>(createEmptyNotes());
    const [givenCells, setGivenCells] = useState<boolean[][]>([]);
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [notesMode, setNotesMode] = useState(false);
    const [conflicts, setConflicts] = useState<Set<string>>(new Set());
    const [isComplete, setIsComplete] = useState(false);
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [moveHistory, setMoveHistory] = useState<MoveHistory[]>([]);
    const [cellSize, setCellSize] = useState(getCellSize());

    // Update cell size on window resize
    useEffect(() => {
        const handleResize = () => setCellSize(getCellSize());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Generate new puzzle
    const newGame = useCallback((diff: 'easy' | 'medium' | 'hard') => {
        const newPuzzle = generatePuzzle(diff);
        setPuzzle(newPuzzle);
        setBoard(newPuzzle.puzzle.map(row => [...row]));
        setNotes(createEmptyNotes());
        setGivenCells(newPuzzle.puzzle.map(row => row.map(cell => cell !== 0)));
        setSelectedCell(null);
        setConflicts(new Set());
        setIsComplete(false);
        setStartTime(Date.now());
        setElapsedTime(0);
        onNewGame?.();
    }, [onNewGame]);

    // Initialize game
    useEffect(() => {
        newGame(difficulty);
    }, [difficulty, newGame]);

    // Timer
    useEffect(() => {
        if (isComplete || !startTime) return;

        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, isComplete]);

    // Update conflicts when board changes
    useEffect(() => {
        if (!puzzle) return;

        const newConflicts = new Set<string>();

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) {
                    const cellConflicts = findConflicts(board, row, col);
                    if (cellConflicts.length > 0) {
                        newConflicts.add(`${row},${col}`);
                        cellConflicts.forEach(([r, c]) => newConflicts.add(`${r},${c}`));
                    }
                }
            }
        }

        setConflicts(newConflicts);

        // Check for completion
        const result = checkSolution(board, puzzle.solution);
        if (result.isComplete && result.isCorrect) {
            setIsComplete(true);

            // 🎉 Celebration!
            hapticFeedback('heavy');
            launchConfetti({ particleCount: 150, spread: 90 });

            // Time-based achievements
            const mins = Math.floor(elapsedTime / 60);
            if (mins < 3) {
                showAchievement('Speed Demon!', `Solved in ${mins}:${String(elapsedTime % 60).padStart(2, '0')}!`, '⚡');
            } else if (mins < 10) {
                showAchievement('Great Job!', 'Puzzle complete!', '✨');
            } else {
                showAchievement('Persistence!', 'Never gave up!', '💪');
            }

            onComplete?.(elapsedTime);
        }
    }, [board, puzzle, elapsedTime, onComplete]);

    // Handle number input
    const inputNumber = useCallback((num: number) => {
        if (!selectedCell || !puzzle) return;
        const [row, col] = selectedCell;
        if (givenCells[row][col]) return;

        if (notesMode) {
            setNotes(prev => {
                const newNotes = prev.map(r => r.map(s => new Set(s)));
                if (num === 0) {
                    newNotes[row][col].clear();
                } else if (newNotes[row][col].has(num)) {
                    newNotes[row][col].delete(num);
                } else {
                    newNotes[row][col].add(num);
                }
                return newNotes;
            });
        } else {
            // Record move for undo
            const prevValue = board[row][col];
            if (prevValue !== num) {
                setMoveHistory(prev => [...prev, { row, col, prevValue, newValue: num }]);
            }

            setBoard(prev => {
                const newBoard = prev.map(r => [...r]);
                newBoard[row][col] = num;
                return newBoard;
            });
            // Clear notes for this cell when entering a number
            if (num !== 0) {
                setNotes(prev => {
                    const newNotes = prev.map(r => r.map(s => new Set(s)));
                    newNotes[row][col].clear();
                    return newNotes;
                });
            }
        }
    }, [selectedCell, givenCells, notesMode, puzzle, board]);

    // Undo last move
    const undo = useCallback(() => {
        const lastMove = moveHistory[moveHistory.length - 1];
        if (!lastMove) return;

        hapticFeedback('light');
        setBoard(prev => {
            const newBoard = prev.map(r => [...r]);
            newBoard[lastMove.row][lastMove.col] = lastMove.prevValue;
            return newBoard;
        });
        setMoveHistory(prev => prev.slice(0, -1));
    }, [moveHistory]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isComplete) return;

            // Undo with Ctrl+Z or just Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
                return;
            }
            if (e.key === 'z' || e.key === 'Z') {
                undo();
                return;
            }

            if (e.key >= '1' && e.key <= '9') {
                inputNumber(parseInt(e.key));
            } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
                inputNumber(0);
            } else if (e.key === 'n' || e.key === 'N') {
                setNotesMode(prev => !prev);
            } else if (selectedCell) {
                const [row, col] = selectedCell;
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        setSelectedCell([Math.max(0, row - 1), col]);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        setSelectedCell([Math.min(8, row + 1), col]);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        setSelectedCell([row, Math.max(0, col - 1)]);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        setSelectedCell([row, Math.min(8, col + 1)]);
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, inputNumber, isComplete, undo]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get cell highlight state
    const getCellState = useCallback((row: number, col: number) => {
        const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
        const isHighlighted = selectedCell && (
            selectedCell[0] === row ||
            selectedCell[1] === col ||
            (Math.floor(selectedCell[0] / 3) === Math.floor(row / 3) &&
                Math.floor(selectedCell[1] / 3) === Math.floor(col / 3))
        );
        const isGiven = givenCells[row]?.[col] ?? false;
        const hasConflict = conflicts.has(`${row},${col}`);
        const isSameNumber = selectedCell &&
            board[selectedCell[0]][selectedCell[1]] !== 0 &&
            board[row][col] === board[selectedCell[0]][selectedCell[1]];

        return { isSelected, isHighlighted, isGiven, hasConflict, isSameNumber };
    }, [selectedCell, givenCells, conflicts, board]);

    if (!puzzle) {
        return <div className="text-subtle">Generating puzzle...</div>;
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Timer and stats */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono text-text">{formatTime(elapsedTime)}</span>
                </div>
                <div className="text-subtle">
                    {puzzle.clueCount} clues • {difficulty}
                </div>
            </div>

            {/* Game board */}
            <div
                className="relative bg-elevated rounded-lg overflow-hidden"
                style={{
                    width: cellSize * 9 + 8,
                    height: cellSize * 9 + 8,
                }}
            >
                {/* Grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array(9).fill(null).map((_, i) => (
                        <div key={i} className="border-2 border-muted" />
                    ))}
                </div>

                {/* Cells */}
                <div
                    className="relative grid"
                    style={{
                        gridTemplateColumns: `repeat(9, ${cellSize}px)`,
                        gridTemplateRows: `repeat(9, ${cellSize}px)`,
                        padding: 4,
                    }}
                >
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const { isSelected, isHighlighted, isGiven, hasConflict, isSameNumber } =
                                getCellState(rowIndex, colIndex);
                            const cellNotes = notes[rowIndex][colIndex];

                            return (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    onClick={() => setSelectedCell([rowIndex, colIndex])}
                                    className={`
                    relative flex items-center justify-center
                    border border-muted/50 transition-colors
                    ${isSelected ? 'bg-accent/30 z-10' : ''}
                    ${!isSelected && isHighlighted ? 'bg-muted/50' : ''}
                    ${!isSelected && !isHighlighted ? 'bg-surface' : ''}
                    ${hasConflict ? 'bg-red-500/20' : ''}
                    ${isSameNumber && !isSelected ? 'bg-accent/20' : ''}
                    ${colIndex % 3 === 2 && colIndex < 8 ? 'border-r-2 border-r-muted' : ''}
                    ${rowIndex % 3 === 2 && rowIndex < 8 ? 'border-b-2 border-b-muted' : ''}
                  `}
                                    style={{
                                        width: cellSize,
                                        height: cellSize,
                                    }}
                                >
                                    {cell !== 0 ? (
                                        <span
                                            className={`
                        text-xl font-bold
                        ${isGiven ? 'text-text' : 'text-accent'}
                        ${hasConflict ? 'text-red-500' : ''}
                      `}
                                        >
                                            {cell}
                                        </span>
                                    ) : cellNotes.size > 0 ? (
                                        <div className="grid grid-cols-3 gap-0 p-0.5 w-full h-full">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                <span
                                                    key={n}
                                                    className="text-[9px] text-subtle flex items-center justify-center"
                                                >
                                                    {cellNotes.has(n) ? n : ''}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Completion overlay */}
                {isComplete && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
                        <div className="text-4xl">🎉</div>
                        <div className="text-xl font-bold text-white">Puzzle Complete!</div>
                        <div className="text-subtle">Time: {formatTime(elapsedTime)}</div>
                        <button
                            onClick={() => newGame(difficulty)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg text-white font-bold hover:scale-105 transition-transform"
                        >
                            New Game
                        </button>
                    </div>
                )}
            </div>

            {/* Number buttons - 48px for touch accessibility */}
            <div className="flex gap-2 flex-wrap justify-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => inputNumber(num)}
                        className={`
              w-12 h-12 rounded-lg font-bold text-lg
              transition-all hover:scale-105 active:scale-95
              ${notesMode
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : 'bg-elevated text-text hover:bg-muted'
                            }
            `}
                    >
                        {num}
                    </button>
                ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
                {/* Undo button */}
                <button
                    onClick={undo}
                    disabled={moveHistory.length === 0}
                    className={`
            px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2
            ${moveHistory.length > 0
                            ? 'bg-elevated hover:bg-muted text-text'
                            : 'bg-elevated/50 text-subtle cursor-not-allowed'
                        }
          `}
                    title="Undo (Z or Ctrl+Z)"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Undo
                </button>
                <button
                    onClick={() => inputNumber(0)}
                    className="px-4 py-2 rounded-lg bg-elevated hover:bg-muted text-text transition-colors text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                </button>
                <button
                    onClick={() => setNotesMode(prev => !prev)}
                    className={`
            px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2
            ${notesMode
                            ? 'bg-purple-500 text-white'
                            : 'bg-elevated text-text hover:bg-muted'
                        }
          `}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Notes {notesMode ? 'ON' : 'OFF'}
                </button>
                <button
                    onClick={() => newGame(difficulty)}
                    className="px-4 py-2 rounded-lg bg-elevated hover:bg-muted text-text transition-colors text-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New
                </button>
            </div>
        </div>
    );
}
