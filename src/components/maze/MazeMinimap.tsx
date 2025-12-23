import { useEffect, useRef, useMemo } from 'react';
import type { MazeGrid } from '../../lib/mazeUtils';

interface MazeMinimapProps {
    maze: MazeGrid;
    playerX: number;
    playerZ: number;
    playerRotation: number;
    cellSize: number;
    size?: number;
}

export function MazeMinimap({
    maze,
    playerX,
    playerZ,
    playerRotation,
    cellSize,
    size = 120
}: MazeMinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const scale = useMemo(() => size / (maze.cols * cellSize), [size, maze.cols, cellSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and set background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, size, size);

        const scaledCellSize = cellSize * scale;

        // Draw walls
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 1;

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.cells[row][col];
                const x = col * scaledCellSize;
                const y = row * scaledCellSize;

                if (cell.walls.top) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + scaledCellSize, y);
                    ctx.stroke();
                }
                if (cell.walls.left) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + scaledCellSize);
                    ctx.stroke();
                }
                if (col === maze.cols - 1 && cell.walls.right) {
                    ctx.beginPath();
                    ctx.moveTo(x + scaledCellSize, y);
                    ctx.lineTo(x + scaledCellSize, y + scaledCellSize);
                    ctx.stroke();
                }
                if (row === maze.rows - 1 && cell.walls.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + scaledCellSize);
                    ctx.lineTo(x + scaledCellSize, y + scaledCellSize);
                    ctx.stroke();
                }
            }
        }

        // Draw finish marker
        const finishX = (maze.finish.col + 0.5) * scaledCellSize;
        const finishY = (maze.finish.row + 0.5) * scaledCellSize;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(finishX, finishY, scaledCellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw player position and direction
        const px = playerX * scale;
        const pz = playerZ * scale;

        // Player dot
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(px, pz, 4, 0, Math.PI * 2);
        ctx.fill();

        // Direction arrow
        const arrowLength = 10;
        const arrowX = px + Math.sin(playerRotation) * arrowLength;
        const arrowY = pz - Math.cos(playerRotation) * arrowLength;

        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, pz);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();

        // Arrow head
        const headLength = 5;
        const headAngle = Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - headLength * Math.sin(playerRotation - headAngle),
            arrowY + headLength * Math.cos(playerRotation - headAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - headLength * Math.sin(playerRotation + headAngle),
            arrowY + headLength * Math.cos(playerRotation + headAngle)
        );
        ctx.stroke();

    }, [maze, playerX, playerZ, playerRotation, cellSize, scale, size]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-lg border border-cyan-500/30"
            style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
            }}
        />
    );
}
