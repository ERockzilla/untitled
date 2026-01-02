import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    WORD_CATEGORIES,
    getRandomWords,
    type WordCategory
} from '../../lib/wordLists';

interface WordSearchProps {
    category?: WordCategory;
    gridSize?: number;
    wordCount?: number;
    onComplete?: () => void;
}

interface WordPosition {
    word: string;
    startRow: number;
    startCol: number;
    direction: [number, number];
}

interface Selection {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

const DIRECTIONS: [number, number][] = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
    [0, -1],  // left
    [-1, 0],  // up
    [-1, -1], // diagonal up-left
    [1, -1],  // diagonal down-left
];

const CELL_SIZE = 36;

// Generate empty grid
function createEmptyGrid(size: number): string[][] {
    return Array(size).fill(null).map(() => Array(size).fill(''));
}

// Check if word fits at position in direction
function canPlaceWord(
    grid: string[][],
    word: string,
    row: number,
    col: number,
    direction: [number, number]
): boolean {
    const size = grid.length;

    for (let i = 0; i < word.length; i++) {
        const newRow = row + direction[0] * i;
        const newCol = col + direction[1] * i;

        if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
            return false;
        }

        const existing = grid[newRow][newCol];
        if (existing !== '' && existing !== word[i]) {
            return false;
        }
    }

    return true;
}

// Place word on grid
function placeWord(
    grid: string[][],
    word: string,
    row: number,
    col: number,
    direction: [number, number]
): void {
    for (let i = 0; i < word.length; i++) {
        grid[row + direction[0] * i][col + direction[1] * i] = word[i];
    }
}

// Generate word search puzzle
function generatePuzzle(
    words: string[],
    size: number
): { grid: string[][]; positions: WordPosition[] } {
    const grid = createEmptyGrid(size);
    const positions: WordPosition[] = [];
    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
        let placed = false;
        const shuffledDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);

        // Try random positions
        for (let attempt = 0; attempt < 100 && !placed; attempt++) {
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);

            for (const dir of shuffledDirs) {
                if (canPlaceWord(grid, word, row, col, dir)) {
                    placeWord(grid, word, row, col, dir);
                    positions.push({
                        word,
                        startRow: row,
                        startCol: col,
                        direction: dir,
                    });
                    placed = true;
                    break;
                }
            }
        }
    }

    // Fill empty cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (grid[row][col] === '') {
                grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }

    return { grid, positions };
}

// Check if selection matches a word
function checkSelection(
    selection: Selection,
    positions: WordPosition[],
    foundWords: Set<string>
): string | null {
    for (const pos of positions) {
        if (foundWords.has(pos.word)) continue;

        const wordLength = pos.word.length;
        const endRow = pos.startRow + pos.direction[0] * (wordLength - 1);
        const endCol = pos.startCol + pos.direction[1] * (wordLength - 1);

        // Check forward
        if (
            selection.startRow === pos.startRow &&
            selection.startCol === pos.startCol &&
            selection.endRow === endRow &&
            selection.endCol === endCol
        ) {
            return pos.word;
        }

        // Check backward
        if (
            selection.endRow === pos.startRow &&
            selection.endCol === pos.startCol &&
            selection.startRow === endRow &&
            selection.startCol === endCol
        ) {
            return pos.word;
        }
    }

    return null;
}

export function WordSearch({
    category: initialCategory,
    gridSize = 12,
    wordCount = 8,
    onComplete,
}: WordSearchProps) {
    const [category, setCategory] = useState<WordCategory>(
        initialCategory || WORD_CATEGORIES[0]
    );
    const [words, setWords] = useState<string[]>([]);
    const [grid, setGrid] = useState<string[][]>([]);
    const [positions, setPositions] = useState<WordPosition[]>([]);
    const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Generate new puzzle
    const newGame = useCallback((cat: WordCategory) => {
        setCategory(cat);
        const newWords = getRandomWords(cat, wordCount, 3, Math.min(gridSize - 2, 8));
        setWords(newWords);

        const { grid: newGrid, positions: newPositions } = generatePuzzle(newWords, gridSize);
        setGrid(newGrid);
        setPositions(newPositions);
        setFoundWords(new Set());
        setSelection(null);
        setIsComplete(false);
    }, [gridSize, wordCount]);

    // Initialize
    useEffect(() => {
        newGame(initialCategory || WORD_CATEGORIES[0]);
    }, [initialCategory, newGame]);

    // Check for completion
    useEffect(() => {
        if (foundWords.size === words.length && words.length > 0) {
            setIsComplete(true);
            onComplete?.();
        }
    }, [foundWords, words.length, onComplete]);

    // Handle cell interactions
    const handleCellMouseDown = (row: number, col: number) => {
        setIsDragging(true);
        setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
    };

    const handleCellMouseEnter = (row: number, col: number) => {
        if (!isDragging || !selection) return;
        setSelection(prev => prev ? { ...prev, endRow: row, endCol: col } : null);
    };

    const handleMouseUp = () => {
        if (selection) {
            const foundWord = checkSelection(selection, positions, foundWords);
            if (foundWord) {
                setFoundWords(prev => new Set([...prev, foundWord]));
            }
        }
        setIsDragging(false);
        setSelection(null);
    };

    // Check if cell is in current selection
    const isInSelection = useCallback((row: number, col: number): boolean => {
        if (!selection) return false;

        const { startRow, startCol, endRow, endCol } = selection;
        const dRow = endRow - startRow;
        const dCol = endCol - startCol;
        const length = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;

        const stepRow = dRow === 0 ? 0 : dRow / Math.abs(dRow);
        const stepCol = dCol === 0 ? 0 : dCol / Math.abs(dCol);

        for (let i = 0; i < length; i++) {
            if (startRow + stepRow * i === row && startCol + stepCol * i === col) {
                return true;
            }
        }

        return false;
    }, [selection]);

    // Check if cell is part of a found word
    const isFoundCell = useCallback((row: number, col: number): boolean => {
        for (const pos of positions) {
            if (!foundWords.has(pos.word)) continue;

            for (let i = 0; i < pos.word.length; i++) {
                if (
                    pos.startRow + pos.direction[0] * i === row &&
                    pos.startCol + pos.direction[1] * i === col
                ) {
                    return true;
                }
            }
        }
        return false;
    }, [positions, foundWords]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Word list */}
            <div className="order-2 lg:order-1 w-full lg:w-48">
                <div className="text-sm font-medium text-text mb-2 flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                    {words.map(word => (
                        <div
                            key={word}
                            className={`
                px-3 py-1.5 rounded-lg text-sm font-mono transition-all
                ${foundWords.has(word)
                                    ? 'bg-green-500/20 text-green-400 line-through'
                                    : 'bg-elevated text-subtle'
                                }
              `}
                        >
                            {word}
                        </div>
                    ))}
                </div>

                <div className="mt-4 text-xs text-subtle">
                    {foundWords.size} / {words.length} found
                </div>
            </div>

            {/* Grid */}
            <div className="order-1 lg:order-2">
                <div
                    className="grid gap-0.5 p-2 bg-elevated rounded-lg select-none"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`,
                    }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const isSelected = isInSelection(rowIndex, colIndex);
                            const isFound = isFoundCell(rowIndex, colIndex);

                            return (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                                    className={`
                    flex items-center justify-center font-bold text-sm
                    transition-colors rounded
                    ${isSelected ? 'bg-accent text-void' : ''}
                    ${isFound && !isSelected ? 'bg-green-500/30 text-green-400' : ''}
                    ${!isSelected && !isFound ? 'bg-surface text-text hover:bg-muted' : ''}
                  `}
                                    style={{
                                        width: CELL_SIZE,
                                        height: CELL_SIZE,
                                    }}
                                >
                                    {cell}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Completion overlay */}
                {isComplete && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20 rounded-lg">
                        <div className="text-4xl">🎉</div>
                        <div className="text-xl font-bold text-white">All Words Found!</div>
                        <button
                            onClick={() => newGame(category)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg text-white font-bold hover:scale-105 transition-transform"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* Category selector */}
            <div className="order-3 w-full lg:w-48">
                <div className="text-xs text-subtle mb-2">Categories</div>
                <div className="grid grid-cols-4 lg:grid-cols-2 gap-1">
                    {WORD_CATEGORIES.map(cat => (
                        <button
                            key={cat.name}
                            onClick={() => newGame(cat)}
                            className={`
                px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                ${category.name === cat.name
                                    ? 'text-white'
                                    : 'bg-elevated text-subtle hover:text-text'
                                }
              `}
                            style={{
                                backgroundColor: category.name === cat.name ? cat.color : undefined,
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => newGame(category)}
                    className="mt-4 w-full px-4 py-2 rounded-lg bg-elevated hover:bg-muted text-text transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Puzzle
                </button>
            </div>
        </div>
    );
}
