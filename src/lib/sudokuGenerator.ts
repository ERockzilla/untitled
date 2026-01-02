// Sudoku puzzle generator using backtracking algorithm

export type SudokuBoard = number[][]; // 0 = empty, 1-9 = filled
export type SudokuNotes = Set<number>[][]; // Pencil marks

export interface SudokuPuzzle {
    puzzle: SudokuBoard;
    solution: SudokuBoard;
    difficulty: 'easy' | 'medium' | 'hard';
    clueCount: number;
}

// Check if placing num at (row, col) is valid
function isValid(board: SudokuBoard, row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Check column
    for (let y = 0; y < 9; y++) {
        if (board[y][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            if (board[boxRow + y][boxCol + x] === num) return false;
        }
    }

    return true;
}

// Solve the puzzle using backtracking
function solveSudoku(board: SudokuBoard): boolean {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                // Try each number 1-9
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                // Shuffle for variety
                for (let i = nums.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [nums[i], nums[j]] = [nums[j], nums[i]];
                }

                for (const num of nums) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) {
                            return true;
                        }
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Count solutions (stop at 2 to check for uniqueness)
function countSolutions(board: SudokuBoard, limit: number = 2): number {
    let count = 0;

    function solve(): boolean {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (solve()) {
                                if (count >= limit) return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        count++;
        return count >= limit;
    }

    solve();
    return count;
}

// Generate a complete valid Sudoku grid
function generateComplete(): SudokuBoard {
    const board: SudokuBoard = Array(9).fill(null).map(() => Array(9).fill(0));
    solveSudoku(board);
    return board;
}

// Create a puzzle by removing numbers from a complete grid
export function generatePuzzle(difficulty: 'easy' | 'medium' | 'hard'): SudokuPuzzle {
    // Number of clues to leave based on difficulty
    const clueTargets = {
        easy: { min: 40, max: 45 },
        medium: { min: 30, max: 35 },
        hard: { min: 22, max: 27 },
    };

    const target = clueTargets[difficulty];
    const targetClues = target.min + Math.floor(Math.random() * (target.max - target.min + 1));

    // Generate complete grid
    const solution = generateComplete();
    const puzzle = solution.map(row => [...row]);

    // List of all positions
    const positions: [number, number][] = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            positions.push([row, col]);
        }
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let clueCount = 81;

    // Remove numbers while maintaining unique solution
    for (const [row, col] of positions) {
        if (clueCount <= targetClues) break;

        const backup = puzzle[row][col];
        puzzle[row][col] = 0;

        // Check if puzzle still has unique solution
        const testBoard = puzzle.map(r => [...r]);
        if (countSolutions(testBoard) !== 1) {
            // Multiple solutions, restore the number
            puzzle[row][col] = backup;
        } else {
            clueCount--;
        }
    }

    return {
        puzzle,
        solution,
        difficulty,
        clueCount,
    };
}

// Check if user's current board is complete and correct
export function checkSolution(board: SudokuBoard, solution: SudokuBoard): {
    isComplete: boolean;
    isCorrect: boolean;
    errors: [number, number][];
} {
    const errors: [number, number][] = [];
    let isComplete = true;

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                isComplete = false;
            } else if (board[row][col] !== solution[row][col]) {
                errors.push([row, col]);
            }
        }
    }

    return {
        isComplete,
        isCorrect: errors.length === 0,
        errors,
    };
}

// Find conflicts with current number placement (not checking against solution)
export function findConflicts(board: SudokuBoard, row: number, col: number): [number, number][] {
    const num = board[row][col];
    if (num === 0) return [];

    const conflicts: [number, number][] = [];

    // Check row
    for (let x = 0; x < 9; x++) {
        if (x !== col && board[row][x] === num) {
            conflicts.push([row, x]);
        }
    }

    // Check column
    for (let y = 0; y < 9; y++) {
        if (y !== row && board[y][col] === num) {
            conflicts.push([y, col]);
        }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const r = boxRow + y;
            const c = boxCol + x;
            if ((r !== row || c !== col) && board[r][c] === num) {
                conflicts.push([r, c]);
            }
        }
    }

    return conflicts;
}

// Create empty notes grid
export function createEmptyNotes(): SudokuNotes {
    return Array(9).fill(null).map(() =>
        Array(9).fill(null).map(() => new Set<number>())
    );
}
