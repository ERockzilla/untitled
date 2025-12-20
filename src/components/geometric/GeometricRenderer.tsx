import { useMemo } from 'react';
import { seededRandom } from '../../lib/random';
import type { PRNG } from '../../lib/random';
import { GEO_PALETTE_64 } from '../../lib/palettes';

export type ShapeType = 'circle' | 'rect' | 'triangle' | 'ellipse' | 'line';

export interface Shape {
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
}

export interface Composition {
  shapes: Shape[];
  background: string;
}

const SHAPE_TYPES: ShapeType[] = ['circle', 'rect', 'triangle', 'ellipse', 'line'];

/**
 * Decode a shape from PRNG
 */
function decodeShape(prng: PRNG, palette: string[]): Shape {
  return {
    type: SHAPE_TYPES[Math.floor(prng() * SHAPE_TYPES.length)],
    x: prng() * 100,
    y: prng() * 100,
    size: 5 + prng() * 40,
    rotation: prng() * 360,
    color: palette[Math.floor(prng() * palette.length)],
    opacity: 0.3 + prng() * 0.7,
  };
}

/**
 * Generate composition from address
 */
export function addressToComposition(
  address: string,
  palette: string[] = GEO_PALETTE_64
): Composition {
  const prng = seededRandom(address);
  
  // 3-7 shapes per composition
  const shapeCount = 3 + Math.floor(prng() * 5);
  
  // Background color
  const bgIndex = Math.floor(prng() * 8); // First 8 colors are dark
  const background = palette[bgIndex];
  
  // Generate shapes
  const shapes: Shape[] = [];
  for (let i = 0; i < shapeCount; i++) {
    shapes.push(decodeShape(prng, palette));
  }
  
  return { shapes, background };
}

interface ShapeRendererProps {
  shape: Shape;
}

function ShapeRenderer({ shape }: ShapeRendererProps) {
  const { type, x, y, size, rotation, color, opacity } = shape;
  
  const transform = `rotate(${rotation} ${x} ${y})`;
  const style = { fill: color, opacity };
  
  switch (type) {
    case 'circle':
      return (
        <circle
          cx={x}
          cy={y}
          r={size / 2}
          style={style}
          transform={transform}
        />
      );
    
    case 'rect':
      return (
        <rect
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          style={style}
          transform={transform}
        />
      );
    
    case 'triangle':
      const h = size * Math.sqrt(3) / 2;
      const points = [
        `${x},${y - h / 2}`,
        `${x - size / 2},${y + h / 2}`,
        `${x + size / 2},${y + h / 2}`,
      ].join(' ');
      return (
        <polygon
          points={points}
          style={style}
          transform={transform}
        />
      );
    
    case 'ellipse':
      return (
        <ellipse
          cx={x}
          cy={y}
          rx={size / 2}
          ry={size / 3}
          style={style}
          transform={transform}
        />
      );
    
    case 'line':
      return (
        <line
          x1={x - size / 2}
          y1={y}
          x2={x + size / 2}
          y2={y}
          stroke={color}
          strokeWidth={3 + size / 10}
          strokeLinecap="round"
          opacity={opacity}
          transform={transform}
        />
      );
    
    default:
      return null;
  }
}

interface GeometricRendererProps {
  address: string;
  palette?: string[];
  className?: string;
  animate?: boolean;
}

export function GeometricRenderer({
  address,
  palette = GEO_PALETTE_64,
  className = '',
  animate = false,
}: GeometricRendererProps) {
  const composition = useMemo(
    () => addressToComposition(address, palette),
    [address, palette]
  );

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ backgroundColor: composition.background }}
    >
      <defs>
        {/* Optional glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {composition.shapes.map((shape, index) => (
        <g
          key={index}
          className={animate ? 'transition-all duration-500 ease-out' : ''}
          style={animate ? { 
            transitionDelay: `${index * 50}ms`,
          } : undefined}
        >
          <ShapeRenderer shape={shape} />
        </g>
      ))}
    </svg>
  );
}

/**
 * Mini preview version
 */
export function GeometricPreview({
  address,
  palette = GEO_PALETTE_64,
}: {
  address: string;
  palette?: string[];
}) {
  const composition = useMemo(
    () => addressToComposition(address, palette),
    [address, palette]
  );

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full rounded"
      style={{ backgroundColor: composition.background }}
    >
      {composition.shapes.map((shape, index) => (
        <ShapeRenderer key={index} shape={shape} />
      ))}
    </svg>
  );
}

