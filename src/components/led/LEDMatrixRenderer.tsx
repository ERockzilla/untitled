import { useMemo, useEffect, useState } from 'react';
import { seededRandom } from '../../lib/random';

export type LEDShape = 'circle' | 'square' | 'rounded';
export type AnimationMode = 'static' | 'scroll-left' | 'scroll-right' | 'rain' | 'pulse' | 'random';

// Simple 5x7 pixel font for text rendering
const PIXEL_FONT: Record<string, number[]> = {
  'A': [0x7C, 0x12, 0x11, 0x12, 0x7C],
  'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
  'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
  'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
  'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
  'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F],
  'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
  'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
  'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
  'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
  'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
  'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
  'W': [0x3F, 0x40, 0x38, 0x40, 0x3F],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
  '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x00, 0x00, 0x5F, 0x00, 0x00],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  ',': [0x00, 0x80, 0x60, 0x00, 0x00],
  '?': [0x02, 0x01, 0x51, 0x09, 0x06],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '<': [0x08, 0x14, 0x22, 0x41, 0x00],
  '>': [0x00, 0x41, 0x22, 0x14, 0x08],
  '♥': [0x0E, 0x1F, 0x3E, 0x1F, 0x0E],
};

// LED color palette
export const LED_COLORS = [
  '#ff0000', // red
  '#00ff00', // green
  '#0000ff', // blue
  '#ffff00', // yellow
  '#ff00ff', // magenta
  '#00ffff', // cyan
  '#ff8800', // orange
  '#ff0088', // pink
  '#88ff00', // lime
  '#00ff88', // spring
  '#0088ff', // sky
  '#8800ff', // violet
  '#ffffff', // white
  '#ff4444', // light red
  '#44ff44', // light green
  '#4444ff', // light blue
];

export interface LEDState {
  on: boolean;
  color: string;
  brightness: number;
}

export interface LEDMatrix {
  width: number;
  height: number;
  leds: LEDState[][];
}

/**
 * Generate LED matrix from address
 */
export function addressToLEDMatrix(
  address: string,
  width: number,
  height: number,
  colors: string[] = LED_COLORS
): LEDMatrix {
  const prng = seededRandom(address);
  const leds: LEDState[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: LEDState[] = [];
    for (let x = 0; x < width; x++) {
      const on = prng() > 0.4; // 60% chance of being on
      row.push({
        on,
        color: colors[Math.floor(prng() * colors.length)],
        brightness: 0.5 + prng() * 0.5,
      });
    }
    leds.push(row);
  }
  
  return { width, height, leds };
}

/**
 * Render text to LED matrix
 */
export function textToLEDMatrix(
  text: string,
  height: number = 8,
  color: string = '#00ff00',
  bgColor: string | null = null
): LEDMatrix {
  const chars = text.toUpperCase().split('');
  let width = 0;
  
  // Calculate total width
  chars.forEach(char => {
    const charData = PIXEL_FONT[char] || PIXEL_FONT[' '];
    width += charData.length + 1; // +1 for spacing
  });
  width = Math.max(width - 1, 1); // Remove trailing space
  
  const leds: LEDState[][] = [];
  for (let y = 0; y < height; y++) {
    leds.push([]);
  }
  
  let xOffset = 0;
  chars.forEach(char => {
    const charData = PIXEL_FONT[char] || PIXEL_FONT[' '];
    
    charData.forEach((col) => {
      for (let y = 0; y < Math.min(7, height); y++) {
        const on = (col & (1 << y)) !== 0;
        leds[y].push({
          on,
          color: on ? color : (bgColor || '#111'),
          brightness: on ? 1 : 0.1,
        });
      }
      // Fill remaining rows if height > 7
      for (let y = 7; y < height; y++) {
        leds[y].push({
          on: false,
          color: bgColor || '#111',
          brightness: 0.1,
        });
      }
    });
    
    // Add spacing between characters
    if (xOffset < chars.length - 1) {
      for (let y = 0; y < height; y++) {
        leds[y].push({
          on: false,
          color: bgColor || '#111',
          brightness: 0.1,
        });
      }
    }
    
    xOffset++;
  });
  
  return { width: leds[0]?.length || 1, height, leds };
}

interface LEDMatrixRendererProps {
  matrix: LEDMatrix;
  ledShape?: LEDShape;
  ledSize?: number;
  gap?: number;
  showGlow?: boolean;
  className?: string;
}

export function LEDMatrixRenderer({
  matrix,
  ledShape = 'circle',
  ledSize = 12,
  gap = 2,
  showGlow = true,
  className = '',
}: LEDMatrixRendererProps) {
  const cellSize = ledSize + gap;
  const viewWidth = matrix.width * cellSize;
  const viewHeight = matrix.height * cellSize;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className={className}
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <defs>
        {showGlow && (
          <filter id="led-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      
      {/* Background panel */}
      <rect
        width={viewWidth}
        height={viewHeight}
        fill="#111"
        rx="4"
      />
      
      {/* LEDs */}
      {matrix.leds.map((row, y) =>
        row.map((led, x) => {
          const cx = x * cellSize + cellSize / 2;
          const cy = y * cellSize + cellSize / 2;
          const r = ledSize / 2 - 1;
          
          const style = {
            fill: led.on ? led.color : '#222',
            opacity: led.on ? led.brightness : 0.3,
            filter: led.on && showGlow ? 'url(#led-glow)' : undefined,
          };
          
          if (ledShape === 'circle') {
            return (
              <circle
                key={`${x}-${y}`}
                cx={cx}
                cy={cy}
                r={r}
                {...style}
              />
            );
          } else if (ledShape === 'rounded') {
            return (
              <rect
                key={`${x}-${y}`}
                x={cx - r}
                y={cy - r}
                width={r * 2}
                height={r * 2}
                rx={r * 0.3}
                {...style}
              />
            );
          } else {
            return (
              <rect
                key={`${x}-${y}`}
                x={cx - r}
                y={cy - r}
                width={r * 2}
                height={r * 2}
                {...style}
              />
            );
          }
        })
      )}
    </svg>
  );
}

/**
 * Animated LED Matrix with scrolling/effects
 */
interface AnimatedLEDMatrixProps {
  address: string;
  width?: number;
  height?: number;
  text?: string;
  textColor?: string;
  animation?: AnimationMode;
  speed?: number;
  ledShape?: LEDShape;
  showGlow?: boolean;
  colors?: string[];
  className?: string;
}

export function AnimatedLEDMatrix({
  address,
  width = 32,
  height = 8,
  text,
  textColor = '#00ff00',
  animation = 'static',
  speed = 100,
  ledShape = 'circle',
  showGlow = true,
  colors = LED_COLORS,
  className = '',
}: AnimatedLEDMatrixProps) {
  const [offset, setOffset] = useState(0);
  const [randomState, setRandomState] = useState(0);
  
  // Generate base matrix
  const baseMatrix = useMemo(() => {
    if (text) {
      return textToLEDMatrix(text, height, textColor);
    }
    return addressToLEDMatrix(address, width, height, colors);
  }, [address, width, height, text, textColor, colors]);
  
  // Animation loop
  useEffect(() => {
    if (animation === 'static') return;
    
    const interval = setInterval(() => {
      if (animation === 'scroll-left' || animation === 'scroll-right') {
        setOffset(prev => prev + 1);
      } else if (animation === 'rain' || animation === 'random') {
        setRandomState(prev => prev + 1);
      } else if (animation === 'pulse') {
        setOffset(prev => prev + 1);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [animation, speed]);
  
  // Apply animation to matrix
  const displayMatrix = useMemo(() => {
    if (animation === 'static') {
      // For static, pad or clip to fit display width
      const leds: LEDState[][] = [];
      for (let y = 0; y < height; y++) {
        const row: LEDState[] = [];
        for (let x = 0; x < width; x++) {
          if (baseMatrix.leds[y] && baseMatrix.leds[y][x]) {
            row.push(baseMatrix.leds[y][x]);
          } else {
            row.push({ on: false, color: '#111', brightness: 0.1 });
          }
        }
        leds.push(row);
      }
      return { width, height, leds };
    }
    
    if (animation === 'scroll-left' || animation === 'scroll-right') {
      const totalWidth = baseMatrix.width + width;
      const leds: LEDState[][] = [];
      
      for (let y = 0; y < height; y++) {
        const row: LEDState[] = [];
        for (let x = 0; x < width; x++) {
          let srcX: number;
          if (animation === 'scroll-left') {
            srcX = (x + offset) % totalWidth - width;
          } else {
            srcX = baseMatrix.width - 1 - ((x + offset) % totalWidth);
          }
          
          if (srcX >= 0 && srcX < baseMatrix.width && baseMatrix.leds[y]) {
            row.push(baseMatrix.leds[y][srcX]);
          } else {
            row.push({ on: false, color: '#111', brightness: 0.1 });
          }
        }
        leds.push(row);
      }
      return { width, height, leds };
    }
    
    if (animation === 'rain') {
      const leds: LEDState[][] = [];
      
      for (let y = 0; y < height; y++) {
        const row: LEDState[] = [];
        for (let x = 0; x < width; x++) {
          const dropY = ((randomState + x * 3) % (height * 2)) - height;
          const inDrop = y >= dropY && y < dropY + 3;
          const brightness = inDrop ? 1 - (y - dropY) * 0.3 : 0;
          
          row.push({
            on: brightness > 0,
            color: colors[x % colors.length],
            brightness: Math.max(0.1, brightness),
          });
        }
        leds.push(row);
      }
      return { width, height, leds };
    }
    
    if (animation === 'pulse') {
      const pulse = Math.sin(offset * 0.1) * 0.3 + 0.7;
      const leds: LEDState[][] = baseMatrix.leds.map(row =>
        row.map(led => ({
          ...led,
          brightness: led.on ? led.brightness * pulse : led.brightness,
        }))
      );
      return { ...baseMatrix, leds };
    }
    
    if (animation === 'random') {
      const prng = seededRandom(address + randomState);
      const leds: LEDState[][] = [];
      
      for (let y = 0; y < height; y++) {
        const row: LEDState[] = [];
        for (let x = 0; x < width; x++) {
          row.push({
            on: prng() > 0.5,
            color: colors[Math.floor(prng() * colors.length)],
            brightness: 0.5 + prng() * 0.5,
          });
        }
        leds.push(row);
      }
      return { width, height, leds };
    }
    
    return baseMatrix;
  }, [baseMatrix, animation, offset, randomState, width, height, address, colors]);
  
  return (
    <LEDMatrixRenderer
      matrix={displayMatrix}
      ledShape={ledShape}
      showGlow={showGlow}
      className={className}
    />
  );
}

/**
 * Mini preview version
 */
export function LEDMatrixPreview({
  address,
  width = 16,
  height = 8,
}: {
  address: string;
  width?: number;
  height?: number;
}) {
  const matrix = useMemo(
    () => addressToLEDMatrix(address, width, height),
    [address, width, height]
  );
  
  return (
    <LEDMatrixRenderer
      matrix={matrix}
      ledShape="circle"
      ledSize={6}
      gap={1}
      showGlow={false}
      className="w-full h-full rounded"
    />
  );
}

