// Maze generation utilities using Recursive Backtracker algorithm

export interface MazeCell {
    row: number;
    col: number;
    walls: {
        top: boolean;
        right: boolean;
        bottom: boolean;
        left: boolean;
    };
    visited: boolean;
}

export interface MazeGrid {
    cells: MazeCell[][];
    rows: number;
    cols: number;
    start: { row: number; col: number };
    finish: { row: number; col: number };
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export const MAZE_CONFIGS = {
    easy: { size: 10, label: 'Easy', description: '10×10', loopFactor: 0.05 },
    medium: { size: 20, label: 'Medium', description: '20×20', loopFactor: 0.08 },
    hard: { size: 35, label: 'Hard', description: '35×35', loopFactor: 0.12 },
    extreme: { size: 50, label: 'Extreme', description: '50×50', loopFactor: 0.15 },
} as const;

export type CharacterType = 'ball' | 'pixel' | 'child' | 'fox' | 'robot' | 'ghost';

export const CHARACTERS = {
    ball: { emoji: '⬤', name: 'Glowing Ball', color: '#06b6d4' },
    pixel: { emoji: '👾', name: 'Pixel Buddy', color: '#a855f7' },
    child: { emoji: '🧒', name: 'Little Explorer', color: '#f59e0b' },
    fox: { emoji: '🦊', name: 'Friendly Fox', color: '#f97316' },
    robot: { emoji: '🤖', name: 'Robot', color: '#6b7280' },
    ghost: { emoji: '👻', name: 'Ghost', color: '#e5e7eb' },
} as const;

/**
 * Create an empty maze grid with all walls intact
 */
function createEmptyGrid(rows: number, cols: number): MazeCell[][] {
    const grid: MazeCell[][] = [];
    for (let row = 0; row < rows; row++) {
        grid[row] = [];
        for (let col = 0; col < cols; col++) {
            grid[row][col] = {
                row,
                col,
                walls: { top: true, right: true, bottom: true, left: true },
                visited: false,
            };
        }
    }
    return grid;
}

/**
 * Get unvisited neighbors of a cell
 */
function getUnvisitedNeighbors(grid: MazeCell[][], cell: MazeCell): MazeCell[] {
    const { row, col } = cell;
    const neighbors: MazeCell[] = [];
    const rows = grid.length;
    const cols = grid[0].length;

    // Top
    if (row > 0 && !grid[row - 1][col].visited) {
        neighbors.push(grid[row - 1][col]);
    }
    // Right
    if (col < cols - 1 && !grid[row][col + 1].visited) {
        neighbors.push(grid[row][col + 1]);
    }
    // Bottom
    if (row < rows - 1 && !grid[row + 1][col].visited) {
        neighbors.push(grid[row + 1][col]);
    }
    // Left
    if (col > 0 && !grid[row][col - 1].visited) {
        neighbors.push(grid[row][col - 1]);
    }

    return neighbors;
}

/**
 * Remove the wall between two adjacent cells
 */
function removeWall(current: MazeCell, next: MazeCell): void {
    const rowDiff = next.row - current.row;
    const colDiff = next.col - current.col;

    if (rowDiff === -1) {
        // Next is above current
        current.walls.top = false;
        next.walls.bottom = false;
    } else if (rowDiff === 1) {
        // Next is below current
        current.walls.bottom = false;
        next.walls.top = false;
    } else if (colDiff === -1) {
        // Next is left of current
        current.walls.left = false;
        next.walls.right = false;
    } else if (colDiff === 1) {
        // Next is right of current
        current.walls.right = false;
        next.walls.left = false;
    }
}

/**
 * Generate a maze using the Recursive Backtracker algorithm
 * Then add loops by removing random walls to create multiple paths
 */
export function generateMaze(rows: number, cols: number, loopFactor: number = 0.1): MazeGrid {
    const cells = createEmptyGrid(rows, cols);
    const stack: MazeCell[] = [];

    // Start from top-left corner
    const startCell = cells[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(cells, current);

        if (neighbors.length > 0) {
            // Choose a random neighbor
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            next.visited = true;
            removeWall(current, next);
            stack.push(next);
        } else {
            // Backtrack
            stack.pop();
        }
    }

    // Reset visited flags
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            cells[row][col].visited = false;
        }
    }

    // Add loops by removing random walls (creates multiple paths)
    const totalCells = rows * cols;
    const wallsToRemove = Math.floor(totalCells * loopFactor);

    for (let i = 0; i < wallsToRemove; i++) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const cell = cells[row][col];

        // Randomly pick a wall to remove (if it exists and won't break boundary)
        const possibleWalls: Array<'top' | 'right' | 'bottom' | 'left'> = [];
        if (row > 0 && cell.walls.top) possibleWalls.push('top');
        if (col < cols - 1 && cell.walls.right) possibleWalls.push('right');
        if (row < rows - 1 && cell.walls.bottom) possibleWalls.push('bottom');
        if (col > 0 && cell.walls.left) possibleWalls.push('left');

        if (possibleWalls.length > 0) {
            const wallToRemove = possibleWalls[Math.floor(Math.random() * possibleWalls.length)];

            switch (wallToRemove) {
                case 'top':
                    cell.walls.top = false;
                    cells[row - 1][col].walls.bottom = false;
                    break;
                case 'right':
                    cell.walls.right = false;
                    cells[row][col + 1].walls.left = false;
                    break;
                case 'bottom':
                    cell.walls.bottom = false;
                    cells[row + 1][col].walls.top = false;
                    break;
                case 'left':
                    cell.walls.left = false;
                    cells[row][col - 1].walls.right = false;
                    break;
            }
        }
    }

    return {
        cells,
        rows,
        cols,
        start: { row: 0, col: 0 },
        finish: { row: rows - 1, col: cols - 1 },
    };
}

/**
 * Check if a position can move in a given direction
 */
export function canMove(
    maze: MazeGrid,
    row: number,
    col: number,
    direction: 'up' | 'down' | 'left' | 'right'
): boolean {
    if (row < 0 || row >= maze.rows || col < 0 || col >= maze.cols) {
        return false;
    }

    const cell = maze.cells[row][col];

    switch (direction) {
        case 'up':
            return !cell.walls.top;
        case 'down':
            return !cell.walls.bottom;
        case 'left':
            return !cell.walls.left;
        case 'right':
            return !cell.walls.right;
    }
}

/**
 * Check if a pixel position collides with walls
 * Used for smooth movement within cells
 */
export function checkWallCollision(
    maze: MazeGrid,
    x: number,
    y: number,
    radius: number,
    cellSize: number
): { blocked: boolean; adjustedX: number; adjustedY: number } {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || row >= maze.rows || col < 0 || col >= maze.cols) {
        return { blocked: true, adjustedX: x, adjustedY: y };
    }

    const cell = maze.cells[row][col];
    const cellX = col * cellSize;
    const cellY = row * cellSize;

    let adjustedX = x;
    let adjustedY = y;
    let blocked = false;

    // Check collision with each wall
    // Top wall
    if (cell.walls.top && y - radius < cellY) {
        adjustedY = cellY + radius;
        blocked = true;
    }
    // Bottom wall
    if (cell.walls.bottom && y + radius > cellY + cellSize) {
        adjustedY = cellY + cellSize - radius;
        blocked = true;
    }
    // Left wall
    if (cell.walls.left && x - radius < cellX) {
        adjustedX = cellX + radius;
        blocked = true;
    }
    // Right wall
    if (cell.walls.right && x + radius > cellX + cellSize) {
        adjustedX = cellX + cellSize - radius;
        blocked = true;
    }

    // Also check adjacent cells' walls for corner cases
    // This prevents clipping through corners
    const localX = x - cellX;
    const localY = y - cellY;

    // Check if near top-left corner
    if (localX < radius && localY < radius) {
        if (cell.walls.top && cell.walls.left) {
            // Corner blocked
        }
    }

    return { blocked, adjustedX, adjustedY };
}

/**
 * Check if player has reached the finish
 */
export function hasReachedFinish(
    maze: MazeGrid,
    x: number,
    y: number,
    cellSize: number
): boolean {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return row === maze.finish.row && col === maze.finish.col;
}

/**
 * Get starting position in pixels
 */
export function getStartPosition(maze: MazeGrid, cellSize: number): { x: number; y: number } {
    return {
        x: maze.start.col * cellSize + cellSize / 2,
        y: maze.start.row * cellSize + cellSize / 2,
    };
}

/**
 * Save/load high scores
 */
const SCORES_KEY = 'maze_scores';

export interface MazeScore {
    difficulty: Difficulty;
    time: number; // milliseconds
    date: string;
}

export function saveScore(difficulty: Difficulty, time: number): void {
    try {
        const scores = loadScores();
        scores.push({
            difficulty,
            time,
            date: new Date().toISOString(),
        });
        // Keep only top 10 per difficulty
        const filtered = scores
            .filter(s => s.difficulty === difficulty)
            .sort((a, b) => a.time - b.time)
            .slice(0, 10);
        const others = scores.filter(s => s.difficulty !== difficulty);
        localStorage.setItem(SCORES_KEY, JSON.stringify([...filtered, ...others]));
    } catch {
        // Ignore storage errors
    }
}

export function loadScores(): MazeScore[] {
    try {
        const saved = localStorage.getItem(SCORES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export function getBestTime(difficulty: Difficulty): number | null {
    const scores = loadScores().filter(s => s.difficulty === difficulty);
    if (scores.length === 0) return null;
    return Math.min(...scores.map(s => s.time));
}

export function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);

    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${remainingMs.toString().padStart(2, '0')}s`;
}
