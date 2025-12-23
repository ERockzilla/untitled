import { useMemo } from 'react';
import * as THREE from 'three';
import { seededRandom } from '../../lib/random';
import { PIXEL_PALETTE_16 } from '../../lib/palettes';
import { GEO_PALETTE_64 } from '../../lib/palettes';

export type WallTheme = 'neon' | 'pixel' | 'geometric' | 'gallery';

/**
 * Generate a neon-style wall texture
 */
function generateNeonTexture(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Dark background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);

    // Gradient from edges
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    gradient.addColorStop(0.1, 'rgba(6, 182, 212, 0.05)');
    gradient.addColorStop(0.9, 'rgba(6, 182, 212, 0.05)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Top/bottom glow
    const vGradient = ctx.createLinearGradient(0, 0, 0, height);
    vGradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    vGradient.addColorStop(0.1, 'rgba(6, 182, 212, 0)');
    vGradient.addColorStop(0.9, 'rgba(6, 182, 212, 0)');
    vGradient.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
    ctx.fillStyle = vGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    return canvas;
}

/**
 * Generate pixel art texture from address
 */
function generatePixelTexture(width: number, height: number, seed: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const prng = seededRandom(seed);
    const pixelSize = 16;
    const cols = Math.ceil(width / pixelSize);
    const rows = Math.ceil(height / pixelSize);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const colorIndex = Math.floor(prng() * PIXEL_PALETTE_16.length);
            ctx.fillStyle = PIXEL_PALETTE_16[colorIndex];
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }

    return canvas;
}

/**
 * Generate geometric pattern texture
 */
function generateGeometricTexture(width: number, height: number, seed: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const prng = seededRandom(seed);

    // Background
    const bgColor = GEO_PALETTE_64[Math.floor(prng() * 8)];
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Generate shapes
    const shapeCount = 3 + Math.floor(prng() * 4);
    for (let i = 0; i < shapeCount; i++) {
        const color = GEO_PALETTE_64[Math.floor(prng() * GEO_PALETTE_64.length)];
        const x = prng() * width;
        const y = prng() * height;
        const size = 20 + prng() * 60;
        const opacity = 0.3 + prng() * 0.5;
        const shapeType = Math.floor(prng() * 3);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.translate(x, y);
        ctx.rotate(prng() * Math.PI * 2);

        switch (shapeType) {
            case 0: // Circle
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 1: // Rectangle
                ctx.fillRect(-size / 2, -size / 2, size, size);
                break;
            case 2: // Triangle
                ctx.beginPath();
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(-size / 2, size / 2);
                ctx.lineTo(size / 2, size / 2);
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    return canvas;
}

/**
 * Create wall texture based on theme
 */
export function createWallTexture(
    theme: WallTheme,
    seed: string,
    width = 256,
    height = 256
): THREE.CanvasTexture {
    let canvas: HTMLCanvasElement;

    switch (theme) {
        case 'neon':
            canvas = generateNeonTexture(width, height);
            break;
        case 'pixel':
            canvas = generatePixelTexture(width, height, seed);
            break;
        case 'geometric':
            canvas = generateGeometricTexture(width, height, seed);
            break;
        case 'gallery':
            // Gallery uses image textures instead
            canvas = generateNeonTexture(width, height);
            break;
        default:
            canvas = generateNeonTexture(width, height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

/**
 * Hook to get wall textures with memoization
 */
export function useWallTextures(theme: WallTheme, count: number, baseSeed: string) {
    return useMemo(() => {
        const textures: THREE.CanvasTexture[] = [];
        for (let i = 0; i < count; i++) {
            textures.push(createWallTexture(theme, `${baseSeed}-wall-${i}`));
        }
        return textures;
    }, [theme, count, baseSeed]);
}

/**
 * Load puzzle image as texture
 */
export function loadPuzzleTexture(puzzleNumber: number): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(
            `/puzzles/puzzle${puzzleNumber}.jpg`,
            (texture) => {
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                resolve(texture);
            },
            undefined,
            reject
        );
    });
}
