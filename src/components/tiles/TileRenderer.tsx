import { useMemo } from 'react';
import { seededRandom } from '../../lib/random';
import type { PRNG } from '../../lib/random';
import { TILE_PALETTE_16 } from '../../lib/palettes';

export type TileType = 
  | 'solid' 
  | 'diagonal-split' 
  | 'diagonal-split-reverse'
  | 'quarter-circle'
  | 'quarter-circle-reverse'
  | 'stripes-h'
  | 'stripes-v'
  | 'checkerboard';

export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'quad';

export interface Tile {
  type: TileType;
  rotation: number; // 0, 90, 180, 270
  primaryColor: string;
  secondaryColor: string;
}

export interface TilePattern {
  tiles: Tile[][];
  size: number;
}

const TILE_TYPES: TileType[] = [
  'solid',
  'diagonal-split',
  'diagonal-split-reverse',
  'quarter-circle',
  'quarter-circle-reverse',
  'stripes-h',
  'stripes-v',
  'checkerboard',
];

/**
 * Generate a single tile from PRNG
 */
function decodeTile(prng: PRNG, palette: string[]): Tile {
  return {
    type: TILE_TYPES[Math.floor(prng() * TILE_TYPES.length)],
    rotation: Math.floor(prng() * 4) * 90,
    primaryColor: palette[Math.floor(prng() * palette.length)],
    secondaryColor: palette[Math.floor(prng() * palette.length)],
  };
}

/**
 * Apply symmetry to a grid
 */
function applySymmetry(tiles: Tile[][], symmetry: SymmetryMode): Tile[][] {
  const size = tiles.length;
  const result: Tile[][] = tiles.map(row => [...row]);
  
  if (symmetry === 'none') {
    return result;
  }
  
  if (symmetry === 'horizontal' || symmetry === 'quad') {
    // Mirror horizontally
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < Math.floor(size / 2); x++) {
        result[y][size - 1 - x] = { ...result[y][x] };
      }
    }
  }
  
  if (symmetry === 'vertical' || symmetry === 'quad') {
    // Mirror vertically
    for (let y = 0; y < Math.floor(size / 2); y++) {
      for (let x = 0; x < size; x++) {
        result[size - 1 - y][x] = { ...result[y][x] };
      }
    }
  }
  
  return result;
}

/**
 * Generate tile pattern from address
 */
export function addressToTiles(
  address: string,
  size: number = 8,
  symmetry: SymmetryMode = 'quad',
  palette: string[] = TILE_PALETTE_16
): TilePattern {
  const prng = seededRandom(address);
  
  const tiles: Tile[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < size; x++) {
      row.push(decodeTile(prng, palette));
    }
    tiles.push(row);
  }
  
  return {
    tiles: applySymmetry(tiles, symmetry),
    size,
  };
}

interface TileShapeProps {
  tile: Tile;
  x: number;
  y: number;
  cellSize: number;
}

function TileShape({ tile, x, y, cellSize }: TileShapeProps) {
  const { type, rotation, primaryColor, secondaryColor } = tile;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const transform = `rotate(${rotation} ${cx} ${cy})`;
  
  switch (type) {
    case 'solid':
      return (
        <rect
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          fill={primaryColor}
        />
      );
    
    case 'diagonal-split':
      return (
        <g transform={transform}>
          <polygon
            points={`${x},${y} ${x + cellSize},${y} ${x},${y + cellSize}`}
            fill={primaryColor}
          />
          <polygon
            points={`${x + cellSize},${y} ${x + cellSize},${y + cellSize} ${x},${y + cellSize}`}
            fill={secondaryColor}
          />
        </g>
      );
    
    case 'diagonal-split-reverse':
      return (
        <g transform={transform}>
          <polygon
            points={`${x},${y} ${x + cellSize},${y} ${x + cellSize},${y + cellSize}`}
            fill={primaryColor}
          />
          <polygon
            points={`${x},${y} ${x + cellSize},${y + cellSize} ${x},${y + cellSize}`}
            fill={secondaryColor}
          />
        </g>
      );
    
    case 'quarter-circle':
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={cellSize} height={cellSize} fill={secondaryColor} />
          <path
            d={`M ${x} ${y} A ${cellSize} ${cellSize} 0 0 1 ${x + cellSize} ${y + cellSize} L ${x} ${y + cellSize} Z`}
            fill={primaryColor}
          />
        </g>
      );
    
    case 'quarter-circle-reverse':
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={cellSize} height={cellSize} fill={secondaryColor} />
          <path
            d={`M ${x + cellSize} ${y} A ${cellSize} ${cellSize} 0 0 0 ${x} ${y + cellSize} L ${x} ${y} Z`}
            fill={primaryColor}
          />
        </g>
      );
    
    case 'stripes-h':
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={cellSize} height={cellSize} fill={secondaryColor} />
          <rect x={x} y={y} width={cellSize} height={cellSize / 4} fill={primaryColor} />
          <rect x={x} y={y + cellSize / 2} width={cellSize} height={cellSize / 4} fill={primaryColor} />
        </g>
      );
    
    case 'stripes-v':
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={cellSize} height={cellSize} fill={secondaryColor} />
          <rect x={x} y={y} width={cellSize / 4} height={cellSize} fill={primaryColor} />
          <rect x={x + cellSize / 2} y={y} width={cellSize / 4} height={cellSize} fill={primaryColor} />
        </g>
      );
    
    case 'checkerboard':
      const half = cellSize / 2;
      return (
        <g transform={transform}>
          <rect x={x} y={y} width={half} height={half} fill={primaryColor} />
          <rect x={x + half} y={y} width={half} height={half} fill={secondaryColor} />
          <rect x={x} y={y + half} width={half} height={half} fill={secondaryColor} />
          <rect x={x + half} y={y + half} width={half} height={half} fill={primaryColor} />
        </g>
      );
    
    default:
      return (
        <rect x={x} y={y} width={cellSize} height={cellSize} fill={primaryColor} />
      );
  }
}

interface TileRendererProps {
  address: string;
  size?: number;
  symmetry?: SymmetryMode;
  palette?: string[];
  className?: string;
}

export function TileRenderer({
  address,
  size = 8,
  symmetry = 'quad',
  palette = TILE_PALETTE_16,
  className = '',
}: TileRendererProps) {
  const pattern = useMemo(
    () => addressToTiles(address, size, symmetry, palette),
    [address, size, symmetry, palette]
  );

  const viewSize = 100;
  const cellSize = viewSize / size;

  return (
    <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className={className}>
      {pattern.tiles.map((row, y) =>
        row.map((tile, x) => (
          <TileShape
            key={`${x}-${y}`}
            tile={tile}
            x={x * cellSize}
            y={y * cellSize}
            cellSize={cellSize}
          />
        ))
      )}
    </svg>
  );
}

/**
 * Mini preview version
 */
export function TilePreview({
  address,
  size = 8,
  symmetry = 'quad',
  palette = TILE_PALETTE_16,
}: {
  address: string;
  size?: number;
  symmetry?: SymmetryMode;
  palette?: string[];
}) {
  const pattern = useMemo(
    () => addressToTiles(address, size, symmetry, palette),
    [address, size, symmetry, palette]
  );

  const viewSize = 100;
  const cellSize = viewSize / size;

  return (
    <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className="w-full h-full rounded">
      {pattern.tiles.map((row, y) =>
        row.map((tile, x) => (
          <TileShape
            key={`${x}-${y}`}
            tile={tile}
            x={x * cellSize}
            y={y * cellSize}
            cellSize={cellSize}
          />
        ))
      )}
    </svg>
  );
}

