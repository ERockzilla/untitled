import { useMemo } from 'react';
import { seededRandom } from '../../lib/random';
import type { PRNG } from '../../lib/random';
import { CURVE_PALETTE_32, GRADIENTS } from '../../lib/palettes';

export interface CurvePoint {
  x: number;
  y: number;
}

export interface BezierCurve {
  points: CurvePoint[]; // 4 control points for cubic bezier
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface CurveComposition {
  curves: BezierCurve[];
  background: string[];
}

/**
 * Generate a bezier curve from PRNG
 */
function decodeCurve(prng: PRNG, palette: string[]): BezierCurve {
  const points: CurvePoint[] = [];
  
  // Generate 4 control points
  for (let i = 0; i < 4; i++) {
    points.push({
      x: prng() * 100,
      y: prng() * 100,
    });
  }
  
  return {
    points,
    color: palette[Math.floor(prng() * palette.length)],
    strokeWidth: 2 + prng() * 6,
    opacity: 0.5 + prng() * 0.5,
  };
}

/**
 * Generate curve composition from address
 */
export function addressToCurves(
  address: string,
  palette: string[] = CURVE_PALETTE_32
): CurveComposition {
  const prng = seededRandom(address);
  
  // 2-5 curves per composition
  const curveCount = 2 + Math.floor(prng() * 4);
  
  // Pick a gradient background
  const gradientKeys = Object.keys(GRADIENTS) as (keyof typeof GRADIENTS)[];
  const bgKey = gradientKeys[Math.floor(prng() * gradientKeys.length)];
  const background = GRADIENTS[bgKey];
  
  // Generate curves
  const curves: BezierCurve[] = [];
  for (let i = 0; i < curveCount; i++) {
    curves.push(decodeCurve(prng, palette));
  }
  
  return { curves, background };
}

/**
 * Convert curve to SVG path d attribute
 */
function curveToPath(curve: BezierCurve): string {
  const [p0, p1, p2, p3] = curve.points;
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

interface CurveRendererProps {
  address: string;
  palette?: string[];
  className?: string;
  animate?: boolean;
  showControlPoints?: boolean;
}

export function CurveRenderer({
  address,
  palette = CURVE_PALETTE_32,
  className = '',
  animate = false,
  showControlPoints = false,
}: CurveRendererProps) {
  const composition = useMemo(
    () => addressToCurves(address, palette),
    [address, palette]
  );

  const gradientId = `bg-gradient-${address.slice(0, 8)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {composition.background.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (composition.background.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="curve-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background */}
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      
      {/* Curves */}
      {composition.curves.map((curve, index) => (
        <g key={index}>
          {/* Main curve */}
          <path
            d={curveToPath(curve)}
            stroke={curve.color}
            strokeWidth={curve.strokeWidth}
            strokeLinecap="round"
            fill="none"
            opacity={curve.opacity}
            filter="url(#curve-glow)"
            className={animate ? 'transition-all duration-700 ease-out' : ''}
            style={animate ? {
              strokeDasharray: 200,
              strokeDashoffset: 0,
              animation: `draw-curve 1s ease-out ${index * 0.2}s both`,
            } : undefined}
          />
          
          {/* Control points visualization */}
          {showControlPoints && (
            <>
              {/* Control lines */}
              <line
                x1={curve.points[0].x}
                y1={curve.points[0].y}
                x2={curve.points[1].x}
                y2={curve.points[1].y}
                stroke={curve.color}
                strokeWidth={0.5}
                opacity={0.3}
                strokeDasharray="2,2"
              />
              <line
                x1={curve.points[2].x}
                y1={curve.points[2].y}
                x2={curve.points[3].x}
                y2={curve.points[3].y}
                stroke={curve.color}
                strokeWidth={0.5}
                opacity={0.3}
                strokeDasharray="2,2"
              />
              
              {/* Control point dots */}
              {curve.points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r={i === 0 || i === 3 ? 2 : 1.5}
                  fill={i === 0 || i === 3 ? curve.color : 'white'}
                  opacity={0.8}
                />
              ))}
            </>
          )}
        </g>
      ))}
      
      {/* Animation keyframes */}
      {animate && (
        <style>
          {`
            @keyframes draw-curve {
              from {
                stroke-dashoffset: 200;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>
      )}
    </svg>
  );
}

/**
 * Mini preview version
 */
export function CurvePreview({
  address,
  palette = CURVE_PALETTE_32,
}: {
  address: string;
  palette?: string[];
}) {
  const composition = useMemo(
    () => addressToCurves(address, palette),
    [address, palette]
  );

  const gradientId = `preview-bg-${address.slice(0, 8)}`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full rounded">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {composition.background.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (composition.background.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      {composition.curves.map((curve, index) => (
        <path
          key={index}
          d={curveToPath(curve)}
          stroke={curve.color}
          strokeWidth={curve.strokeWidth}
          strokeLinecap="round"
          fill="none"
          opacity={curve.opacity}
        />
      ))}
    </svg>
  );
}

