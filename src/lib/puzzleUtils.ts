// Puzzle utility functions

export interface PuzzlePiece {
    id: number;
    correctRow: number;
    correctCol: number;
    currentRow: number;
    currentCol: number;
    rotation: number; // 0, 90, 180, 270
    isPlaced: boolean; // True if placed on the board (anywhere)
    isLocked: boolean; // True if correctly placed and cannot be moved
    // Edge types: -1 = tab inward (hole), 0 = flat, 1 = tab outward
    edges: {
        top: -1 | 0 | 1;
        right: -1 | 0 | 1;
        bottom: -1 | 0 | 1;
        left: -1 | 0 | 1;
    };
}

export interface PuzzleConfig {
    cols: number;
    rows: number;
    pieceWidth: number;
    pieceHeight: number;
    imageWidth: number;
    imageHeight: number;
}

export interface SlidingTile {
    id: number;
    correctIndex: number;
    currentIndex: number;
    isEmpty: boolean;
}

// Difficulty multipliers (higher = smaller pieces = more pieces)
export const DIFFICULTY_CONFIGS = {
    easy: { pixelsPerPiece: 150, label: 'Easy' },
    medium: { pixelsPerPiece: 100, label: 'Medium' },
    hard: { pixelsPerPiece: 75, label: 'Hard' },
} as const;

export type Difficulty = keyof typeof DIFFICULTY_CONFIGS;

/**
 * Calculate grid dimensions based on image size and difficulty
 */
export function calculateGrid(
    imageWidth: number,
    imageHeight: number,
    difficulty: Difficulty = 'medium'
): PuzzleConfig {
    const pixelsPerPiece = DIFFICULTY_CONFIGS[difficulty].pixelsPerPiece;

    const cols = Math.max(2, Math.round(imageWidth / pixelsPerPiece));
    const rows = Math.max(2, Math.round(imageHeight / pixelsPerPiece));

    return {
        cols,
        rows,
        pieceWidth: imageWidth / cols,
        pieceHeight: imageHeight / rows,
        imageWidth,
        imageHeight,
    };
}

/**
 * Generate jigsaw pieces with interlocking edges
 */
export function generateJigsawPieces(config: PuzzleConfig): PuzzlePiece[] {
    const pieces: PuzzlePiece[] = [];
    const { cols, rows } = config;

    // First, generate a grid of edge types to ensure pieces interlock
    // Horizontal edges (between rows)
    const horizontalEdges: (1 | -1)[][] = [];
    for (let row = 0; row < rows - 1; row++) {
        horizontalEdges[row] = [];
        for (let col = 0; col < cols; col++) {
            horizontalEdges[row][col] = Math.random() > 0.5 ? 1 : -1;
        }
    }

    // Vertical edges (between columns)
    const verticalEdges: (1 | -1)[][] = [];
    for (let row = 0; row < rows; row++) {
        verticalEdges[row] = [];
        for (let col = 0; col < cols - 1; col++) {
            verticalEdges[row][col] = Math.random() > 0.5 ? 1 : -1;
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const piece: PuzzlePiece = {
                id: row * cols + col,
                correctRow: row,
                correctCol: col,
                currentRow: -1, // Not placed
                currentCol: -1,
                rotation: 0,
                isPlaced: false,
                isLocked: false,
                edges: {
                    top: row === 0 ? 0 : (-horizontalEdges[row - 1][col] as -1 | 1),
                    right: col === cols - 1 ? 0 : verticalEdges[row][col],
                    bottom: row === rows - 1 ? 0 : horizontalEdges[row][col],
                    left: col === 0 ? 0 : (-verticalEdges[row][col - 1] as -1 | 1),
                },
            };
            pieces.push(piece);
        }
    }

    return pieces;
}

/**
 * Shuffle pieces and assign random rotations (for jigsaw)
 */
export function shuffleJigsawPieces(pieces: PuzzlePiece[]): PuzzlePiece[] {
    const rotations = [0, 90, 180, 270];
    return pieces.map(piece => ({
        ...piece,
        rotation: rotations[Math.floor(Math.random() * 4)],
        isPlaced: false,
        isLocked: false,
        currentRow: -1,
        currentCol: -1,
    })).sort(() => Math.random() - 0.5);
}

/**
 * Generate sliding puzzle tiles
 */
export function generateSlidingTiles(cols: number, rows: number): SlidingTile[] {
    const total = cols * rows;
    const tiles: SlidingTile[] = [];

    for (let i = 0; i < total; i++) {
        tiles.push({
            id: i,
            correctIndex: i,
            currentIndex: i,
            isEmpty: i === total - 1, // Last tile is empty
        });
    }

    return tiles;
}

/**
 * Shuffle sliding tiles ensuring the puzzle is solvable
 */
export function shuffleSlidingTiles(tiles: SlidingTile[], cols: number): SlidingTile[] {
    const shuffled = [...tiles];
    const total = tiles.length;

    // Perform many random valid moves to shuffle
    let emptyIndex = total - 1;
    const moves = total * 100; // More moves = more scrambled

    for (let i = 0; i < moves; i++) {
        const validMoves: number[] = [];
        const emptyRow = Math.floor(emptyIndex / cols);
        const emptyCol = emptyIndex % cols;

        // Check all 4 directions
        if (emptyRow > 0) validMoves.push(emptyIndex - cols); // Up
        if (emptyRow < Math.floor((total - 1) / cols)) validMoves.push(emptyIndex + cols); // Down
        if (emptyCol > 0) validMoves.push(emptyIndex - 1); // Left
        if (emptyCol < cols - 1) validMoves.push(emptyIndex + 1); // Right

        // Pick a random valid move
        const moveFrom = validMoves[Math.floor(Math.random() * validMoves.length)];

        // Swap tiles
        const movingTileIdx = shuffled.findIndex(t => t.currentIndex === moveFrom);
        const emptyTileIdx = shuffled.findIndex(t => t.currentIndex === emptyIndex);

        shuffled[movingTileIdx].currentIndex = emptyIndex;
        shuffled[emptyTileIdx].currentIndex = moveFrom;
        emptyIndex = moveFrom;
    }

    return shuffled;
}

/**
 * Check if a sliding move is valid
 */
export function canSlide(tiles: SlidingTile[], tileIndex: number, cols: number): boolean {
    const tile = tiles[tileIndex];
    if (tile.isEmpty) return false;

    const emptyTile = tiles.find(t => t.isEmpty)!;
    const tilePos = tile.currentIndex;
    const emptyPos = emptyTile.currentIndex;

    const tileRow = Math.floor(tilePos / cols);
    const tileCol = tilePos % cols;
    const emptyRow = Math.floor(emptyPos / cols);
    const emptyCol = emptyPos % cols;

    // Must be adjacent (not diagonal)
    const rowDiff = Math.abs(tileRow - emptyRow);
    const colDiff = Math.abs(tileCol - emptyCol);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Perform a slide move
 */
export function slideTile(tiles: SlidingTile[], tileIndex: number): SlidingTile[] {
    const newTiles = [...tiles];
    const tile = newTiles[tileIndex];
    const emptyTile = newTiles.find(t => t.isEmpty)!;

    // Swap positions
    const tempPos = tile.currentIndex;
    tile.currentIndex = emptyTile.currentIndex;
    emptyTile.currentIndex = tempPos;

    return newTiles;
}

/**
 * Check if jigsaw puzzle is complete
 */
export function isJigsawComplete(pieces: PuzzlePiece[]): boolean {
    return pieces.every(p => p.isLocked);
}

/**
 * Check if sliding puzzle is complete
 */
export function isSlidingComplete(tiles: SlidingTile[]): boolean {
    return tiles.every(t => t.currentIndex === t.correctIndex);
}

/**
 * Generate SVG path for a jigsaw piece with tabs/holes
 */
export function generatePiecePath(
    width: number,
    height: number,
    edges: PuzzlePiece['edges'],
    tabSize: number = 0.2 // Tab size as fraction of edge length
): string {
    const tw = width * tabSize;  // Tab width
    const th = height * tabSize; // Tab height

    // Helper to generate tab/hole curve
    const tabCurve = (length: number, tabDepth: number, direction: -1 | 0 | 1, isHorizontal: boolean): string => {
        if (direction === 0) {
            return isHorizontal ? `l ${length} 0` : `l 0 ${length}`;
        }

        const mid = length / 2;
        const tabW = length * 0.3;
        const tabH = tabDepth * direction;

        if (isHorizontal) {
            // Horizontal edge (top/bottom)
            return `l ${mid - tabW / 2} 0 ` +
                `c 0 0 0 ${-tabH} ${tabW / 2} ${-tabH} ` +
                `c ${tabW / 2} 0 ${tabW / 2} ${tabH} ${tabW / 2} ${tabH} ` +
                `l ${mid - tabW / 2} 0`;
        } else {
            // Vertical edge (left/right)
            return `l 0 ${mid - tabW / 2} ` +
                `c 0 0 ${-tabH} 0 ${-tabH} ${tabW / 2} ` +
                `c 0 ${tabW / 2} ${tabH} ${tabW / 2} ${tabH} ${tabW / 2} ` +
                `l 0 ${mid - tabW / 2}`;
        }
    };

    // Start at top-left
    let path = `M 0 0 `;

    // Top edge (left to right)
    path += tabCurve(width, th, edges.top, true) + ' ';

    // Right edge (top to bottom)
    path += tabCurve(height, tw, edges.right, false) + ' ';

    // Bottom edge (right to left) - need to negate direction
    path += `l ${-width / 2 + width * 0.15} 0 `;
    if (edges.bottom !== 0) {
        const tabH = th * edges.bottom;
        path += `c 0 0 0 ${tabH} ${-width * 0.15} ${tabH} ` +
            `c ${-width * 0.15} 0 ${-width * 0.15} ${-tabH} ${-width * 0.15} ${-tabH} `;
    }
    path += `l ${-width / 2 + width * 0.15} 0 `;

    // Left edge (bottom to top) - need to negate direction
    path += `l 0 ${-height / 2 + height * 0.15} `;
    if (edges.left !== 0) {
        const tabW = tw * edges.left;
        path += `c 0 0 ${tabW} 0 ${tabW} ${-height * 0.15} ` +
            `c 0 ${-height * 0.15} ${-tabW} ${-height * 0.15} ${-tabW} ${-height * 0.15} `;
    }
    path += `l 0 ${-height / 2 + height * 0.15} `;

    path += 'Z';

    return path;
}

/**
 * Progress tracking
 */
export interface PuzzleProgress {
    [imageId: string]: {
        jigsaw: boolean;
        sliding: boolean;
    };
}

const PROGRESS_KEY = 'puzzle_progress';

export function loadProgress(): PuzzleProgress {
    try {
        const saved = localStorage.getItem(PROGRESS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

export function saveProgress(progress: PuzzleProgress): void {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function markComplete(imageId: string, mode: 'jigsaw' | 'sliding'): PuzzleProgress {
    const progress = loadProgress();
    if (!progress[imageId]) {
        progress[imageId] = { jigsaw: false, sliding: false };
    }
    progress[imageId][mode] = true;
    saveProgress(progress);
    return progress;
}
