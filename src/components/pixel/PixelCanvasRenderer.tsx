import { useRef, useEffect, useCallback } from 'react';
import { seededRandom } from '../../lib/random';
import { PIXEL_PALETTE_16 } from '../../lib/palettes';

interface PixelCanvasRendererProps {
  address: string;
  size?: number;
  colors?: number;
  zoom?: number;
  palette?: string[];
  onPixelClick?: (x: number, y: number) => void;
  className?: string;
}

/**
 * Generate pixel grid from address
 */
export function addressToPixels(
  address: string,
  size: number,
  colors: number
): number[][] {
  const prng = seededRandom(address);
  const grid: number[][] = [];
  
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      row.push(Math.floor(prng() * colors));
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * Convert pixel grid back to an address (for reverse lookup)
 * This creates a deterministic mapping from grid state to address
 */
export function pixelsToAddress(
  pixels: number[][],
  colors: number,
  addressLength: number = 64
): string {
  // Create a simple hash of the pixel data
  let hash = BigInt(0);
  const size = pixels.length;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Each pixel contributes to the hash
      hash = (hash * BigInt(colors) + BigInt(pixels[y][x])) % (BigInt(1) << BigInt(addressLength * 4));
    }
  }
  
  return hash.toString(16).padStart(addressLength, '0');
}

export function PixelCanvasRenderer({
  address,
  size = 16,
  colors = 16,
  zoom = 1,
  palette = PIXEL_PALETTE_16,
  onPixelClick,
  className = '',
}: PixelCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<number[][]>([]);

  // Generate and render pixels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate pixels from address
    const pixels = addressToPixels(address, size, colors);
    pixelsRef.current = pixels;

    // Calculate pixel size based on canvas size
    const pixelSize = canvas.width / size;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const colorIndex = pixels[y][x];
        ctx.fillStyle = palette[colorIndex % palette.length];
        ctx.fillRect(
          x * pixelSize,
          y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }

    // Draw grid lines if zoomed in enough
    if (zoom >= 2) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i <= size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelSize, 0);
        ctx.lineTo(i * pixelSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * pixelSize);
        ctx.lineTo(canvas.width, i * pixelSize);
        ctx.stroke();
      }
    }
  }, [address, size, colors, zoom, palette]);

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPixelClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / (canvas.width / size));
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / (canvas.height / size));
    
    if (x >= 0 && x < size && y >= 0 && y < size) {
      onPixelClick(x, y);
    }
  }, [onPixelClick, size]);

  // Canvas size based on zoom
  const canvasSize = 512 * zoom;

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      onClick={handleClick}
      className={`image-rendering-pixelated ${className}`}
      style={{
        imageRendering: 'pixelated',
        cursor: onPixelClick ? 'crosshair' : 'default',
      }}
    />
  );
}

/**
 * Mini preview version (no interaction)
 */
export function PixelCanvasPreview({
  address,
  size = 16,
  colors = 16,
  palette = PIXEL_PALETTE_16,
}: {
  address: string;
  size?: number;
  colors?: number;
  palette?: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixels = addressToPixels(address, size, colors);
    const pixelSize = canvas.width / size;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const colorIndex = pixels[y][x];
        ctx.fillStyle = palette[colorIndex % palette.length];
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }, [address, size, colors, palette]);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

