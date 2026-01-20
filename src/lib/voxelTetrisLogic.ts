
// Types for Voxel Tetris

// A 3D vector coordinate
export type Vector3 = { x: number; y: number; z: number };

// Voxel colors
export const VOXEL_PALETTE = [
    '#000000', // Empty (0)
    '#00f5ff', // Cyan (I)
    '#ffd700', // Yellow (O)
    '#a855f7', // Purple (T)
    '#22c55e', // Green (S)
    '#ef4444', // Red (Z)
    '#3b82f6', // Blue (J)
    '#f97316', // Orange (L)
    '#ff3366', // Pink (Tripod)
    '#00d4aa', // Teal (Screw Left)
    '#7c5cff', // Violet (Screw Right)
];

// Tetracube Definitions (pieces made of 4 voxels)
// We define them centered around 0,0,0 as much as possible for rotation
export const TETRACUBES = {
    // 2D Shapes (Classic Tetris extended to 3D)
    I: {
        id: 1,
        color: VOXEL_PALETTE[1],
        shape: [{ x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }]
    },
    O: {
        id: 2,
        color: VOXEL_PALETTE[2],
        shape: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }]
    },
    T: {
        id: 3,
        color: VOXEL_PALETTE[3],
        shape: [{ x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]
    },
    S: {
        id: 4,
        color: VOXEL_PALETTE[4],
        shape: [{ x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }]
    },
    Z: {
        id: 5,
        color: VOXEL_PALETTE[5],
        shape: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }]
    },
    J: {
        id: 6,
        color: VOXEL_PALETTE[6],
        shape: [{ x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }]
    },
    L: {
        id: 7,
        color: VOXEL_PALETTE[7],
        shape: [{ x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: -1, y: 1, z: 0 }]
    },
    // 3D Specific Shapes
    // Tripod (corner piece)
    Tripod: {
        id: 8,
        color: VOXEL_PALETTE[8],
        shape: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }]
    },
    // Spiral/Screw shapes
    ScrewLeft: {
        id: 9,
        color: VOXEL_PALETTE[9],
        shape: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }] // Twisted
    },
    ScrewRight: {
        id: 10,
        color: VOXEL_PALETTE[10],
        shape: [{ x: 0, y: 0, z: 0 }, { x: -1, y: 0, z: 0 }, { x: -1, y: 0, z: 1 }, { x: -1, y: 1, z: 1 }] // Twisted opposite
    }
};

export type TetracubeType = keyof typeof TETRACUBES;

export interface GameState {
    board: number[][][]; // x, y, z - 0 is empty, >0 is color index
    activePiece: {
        type: TetracubeType;
        position: Vector3;
        rotation: Vector3; // Euler angles roughly (0-3 for 90 deg steps)
        shape: Vector3[]; // Transformed shape
    } | null;
    score: number;
    level: number;
    lines: number;
    gameOver: boolean;
    isPaused: boolean;
    nextPiece: TetracubeType;
}

// Board Dimensions
// Width (X) and Depth (Z) are usually equal (e.g. 5x5 or 6x6)
// Height (Y) is deeper
export const BOARD_SIZE = { x: 6, y: 14, z: 6 };

// --- Logic Helpers ---

export function createEmptyBoard(size = BOARD_SIZE): number[][][] {
    const board: number[][][] = [];
    for (let x = 0; x < size.x; x++) {
        const plane: number[][] = [];
        for (let y = 0; y < size.y; y++) {
            const row: number[] = new Array(size.z).fill(0);
            plane.push(row);
        }
        board.push(plane);
    }
    return board;
}

export function getRandomPieceType(): TetracubeType {
    const keys = Object.keys(TETRACUBES) as TetracubeType[];
    return keys[Math.floor(Math.random() * keys.length)];
}

// Rotate a single point around an axis (90 degrees)
// axis: 'x', 'y', 'z'
export function rotatePoint(p: Vector3, axis: 'x' | 'y' | 'z'): Vector3 {
    switch (axis) {
        case 'x': return { x: p.x, y: -p.z, z: p.y };
        case 'y': return { x: p.z, y: p.y, z: -p.x };
        case 'z': return { x: -p.y, y: p.x, z: p.z };
    }
}

// Apply current rotation to basic shape
export function getTransformedShape(baseShape: Vector3[], rotation: Vector3): Vector3[] {
    let shape = baseShape.map(p => ({ ...p }));

    // Apply X rotations
    for (let i = 0; i < rotation.x; i++) shape = shape.map(p => rotatePoint(p, 'x'));
    // Apply Y rotations
    for (let i = 0; i < rotation.y; i++) shape = shape.map(p => rotatePoint(p, 'y'));
    // Apply Z rotations
    for (let i = 0; i < rotation.z; i++) shape = shape.map(p => rotatePoint(p, 'z'));

    return shape;
}

// Check for collisions
export function checkCollision(
    shape: Vector3[],
    pos: Vector3,
    board: number[][][],
    size = BOARD_SIZE
): boolean {
    for (const point of shape) {
        const x = pos.x + point.x;
        const y = pos.y + point.y;
        const z = pos.z + point.z;

        // Boundaries
        if (x < 0 || x >= size.x || y < 0 || z < 0 || z >= size.z) return true;

        // Board occupancy (ignore checks above board top)
        if (y < size.y && board[x][y][z] !== 0) return true;
    }
    return false;
}

// Merge piece into board
export function mergePieceToBoard(
    shape: Vector3[],
    pos: Vector3,
    type: TetracubeType,
    board: number[][][]
): number[][][] {
    const newBoard = board.map(plane => plane.map(row => [...row])); // Deep clone
    const colorId = TETRACUBES[type].id;

    for (const point of shape) {
        const x = pos.x + point.x;
        const y = pos.y + point.y;
        const z = pos.z + point.z;

        if (x >= 0 && x < BOARD_SIZE.x && y >= 0 && y < BOARD_SIZE.y && z >= 0 && z < BOARD_SIZE.z) {
            newBoard[x][y][z] = colorId;
        }
    }
    return newBoard;
}

// Check and clear filled layers (Y-planes)
export function checkLayers(board: number[][][], size = BOARD_SIZE): { board: number[][][], cleared: number } {
    const newBoard = createEmptyBoard(size);
    let targetY = 0;
    let cleared = 0;

    // Iterate through original board's Y layers
    for (let y = 0; y < size.y; y++) {
        let isFull = true;
        // Check if layer y is full
        for (let x = 0; x < size.x; x++) {
            for (let z = 0; z < size.z; z++) {
                if (board[x][y][z] === 0) {
                    isFull = false;
                    break;
                }
            }
            if (!isFull) break;
        }

        if (isFull) {
            cleared++;
            // Don't copy this layer to newBoard (it effectively disappears)
        } else {
            // Copy this layer to targetY in newBoard
            for (let x = 0; x < size.x; x++) {
                for (let z = 0; z < size.z; z++) {
                    newBoard[x][targetY][z] = board[x][y][z];
                }
            }
            targetY++;
        }
    }

    return { board: newBoard, cleared };
}

// Calculate ghost piece position (hard drop position)
export function getGhostPosition(
    shape: Vector3[],
    pos: Vector3,
    board: number[][][],
    size = BOARD_SIZE
): Vector3 {
    let ghostY = pos.y;
    while (!checkCollision(shape, { ...pos, y: ghostY - 1 }, board, size)) {
        ghostY--;
    }
    return { ...pos, y: ghostY };
}
