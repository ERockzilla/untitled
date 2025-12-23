import { useState, useEffect, useRef, useCallback } from 'react';
import type { MazeGrid, CharacterType } from '../../lib/mazeUtils';
import {
    generateMaze,
    checkWallCollision,
    hasReachedFinish,
    getStartPosition,
    CHARACTERS,
} from '../../lib/mazeUtils';
import { useTheme } from '../../lib/ThemeContext';

interface MazeRunnerProps {
    size: number;
    character: CharacterType;
    controlMode: 'tilt' | 'touch';
    loopFactor?: number;
    onComplete: (time: number) => void;
    onBack: () => void;
}

export function MazeRunner({ size, character, controlMode, loopFactor = 0.1, onComplete, onBack }: MazeRunnerProps) {
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maze, setMaze] = useState<MazeGrid | null>(null);
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [canvasSize, setCanvasSize] = useState(300);
    const [tiltPermission, setTiltPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    const cellSize = canvasSize / size;
    const playerRadius = cellSize * 0.35;

    // Initialize maze
    useEffect(() => {
        const newMaze = generateMaze(size, size, loopFactor);
        setMaze(newMaze);
        const startPos = getStartPosition(newMaze, cellSize);
        setPlayerPos(startPos);
        setVelocity({ x: 0, y: 0 });
        setIsPlaying(true);
        setStartTime(Date.now());
        setElapsedTime(0);
    }, [size, cellSize]);

    // Update canvas size based on container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const minDim = Math.min(rect.width - 32, rect.height - 100, 500);
                setCanvasSize(Math.max(280, minDim));
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Timer
    useEffect(() => {
        if (!isPlaying || !startTime) return;
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 50);
        return () => clearInterval(interval);
    }, [isPlaying, startTime]);

    // Request tilt permission (iOS 13+)
    const requestTiltPermission = useCallback(async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                setTiltPermission(permission);
            } catch {
                setTiltPermission('denied');
            }
        } else {
            setTiltPermission('granted');
        }
    }, []);

    // Tilt controls
    useEffect(() => {
        if (controlMode !== 'tilt' || tiltPermission !== 'granted') return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (!isPlaying) return;

            const gamma = e.gamma || 0; // Left/right tilt (-90 to 90)
            const beta = e.beta || 0;   // Front/back tilt (-180 to 180)

            // Sensitivity factor - increased for faster movement
            const sensitivity = 0.06;

            setVelocity(v => ({
                x: v.x * 0.9 + gamma * sensitivity,
                y: v.y * 0.9 + (beta - 45) * sensitivity, // Offset for natural phone holding angle
            }));
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [controlMode, tiltPermission, isPlaying]);

    // Touch controls (swipe direction)
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (controlMode !== 'touch') return;
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }, [controlMode]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (controlMode !== 'touch' || !touchStartRef.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        // Update velocity based on drag distance
        const sensitivity = 0.25;
        const maxVelocity = 12;

        setVelocity({
            x: Math.max(-maxVelocity, Math.min(maxVelocity, dx * sensitivity)),
            y: Math.max(-maxVelocity, Math.min(maxVelocity, dy * sensitivity)),
        });
    }, [controlMode]);

    const handleTouchEnd = useCallback(() => {
        touchStartRef.current = null;
        // Apply friction
        setVelocity(v => ({ x: v.x * 0.8, y: v.y * 0.8 }));
    }, []);

    // Keyboard controls (desktop fallback)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;

            const speed = 6;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    setVelocity(v => ({ ...v, y: -speed }));
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    setVelocity(v => ({ ...v, y: speed }));
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    setVelocity(v => ({ ...v, x: -speed }));
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    setVelocity(v => ({ ...v, x: speed }));
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
                setVelocity(v => ({ ...v, y: 0 }));
            }
            if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
                setVelocity(v => ({ ...v, x: 0 }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPlaying]);

    // Game loop - update player position
    useEffect(() => {
        if (!maze || !isPlaying) return;

        const gameLoop = setInterval(() => {
            setPlayerPos(pos => {
                let newX = pos.x + velocity.x;
                let newY = pos.y + velocity.y;

                // Check wall collisions
                const collision = checkWallCollision(maze, newX, newY, playerRadius, cellSize);
                newX = collision.adjustedX;
                newY = collision.adjustedY;

                // Check if reached finish
                if (hasReachedFinish(maze, newX, newY, cellSize)) {
                    setIsPlaying(false);
                    onComplete(Date.now() - (startTime || Date.now()));
                }

                return { x: newX, y: newY };
            });

            // Apply friction to velocity
            setVelocity(v => ({
                x: v.x * 0.95,
                y: v.y * 0.95,
            }));
        }, 16); // ~60fps

        return () => clearInterval(gameLoop);
    }, [maze, isPlaying, velocity, cellSize, playerRadius, onComplete, startTime]);

    // Render maze on canvas
    useEffect(() => {
        if (!maze || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isDark = theme === 'dark';

        // Clear canvas
        ctx.fillStyle = isDark ? '#0f0f12' : '#f5f3ee';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw grid pattern (subtle)
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= size; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvasSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvasSize, i * cellSize);
            ctx.stroke();
        }

        // Draw walls
        ctx.strokeStyle = isDark ? '#06b6d4' : '#0891b2';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.cells[row][col];
                const x = col * cellSize;
                const y = row * cellSize;

                if (cell.walls.top) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cellSize, y);
                    ctx.stroke();
                }
                if (cell.walls.left) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + cellSize);
                    ctx.stroke();
                }
                // Draw right wall only for last column
                if (col === maze.cols - 1 && cell.walls.right) {
                    ctx.beginPath();
                    ctx.moveTo(x + cellSize, y);
                    ctx.lineTo(x + cellSize, y + cellSize);
                    ctx.stroke();
                }
                // Draw bottom wall only for last row
                if (row === maze.rows - 1 && cell.walls.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + cellSize);
                    ctx.lineTo(x + cellSize, y + cellSize);
                    ctx.stroke();
                }
            }
        }

        // Draw start marker
        const startX = maze.start.col * cellSize + cellSize / 2;
        const startY = maze.start.row * cellSize + cellSize / 2;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.beginPath();
        ctx.arc(startX, startY, cellSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.font = `${cellSize * 0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🟢', startX, startY);

        // Draw finish marker
        const finishX = maze.finish.col * cellSize + cellSize / 2;
        const finishY = maze.finish.row * cellSize + cellSize / 2;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.beginPath();
        ctx.arc(finishX, finishY, cellSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText('🏁', finishX, finishY);

        // Draw player
        const charData = CHARACTERS[character];
        if (character === 'ball') {
            // Glowing ball with gradient
            const gradient = ctx.createRadialGradient(
                playerPos.x, playerPos.y, 0,
                playerPos.x, playerPos.y, playerRadius
            );
            gradient.addColorStop(0, '#67e8f9');
            gradient.addColorStop(0.5, '#06b6d4');
            gradient.addColorStop(1, '#0891b2');

            // Glow effect
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 15;

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(playerPos.x, playerPos.y, playerRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        } else {
            // Emoji character
            ctx.font = `${cellSize * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(charData.emoji, playerPos.x, playerPos.y);
        }

    }, [maze, playerPos, canvasSize, cellSize, character, theme, size]);

    const formatTimeDisplay = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const hundredths = Math.floor((ms % 1000) / 10);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        const newMaze = generateMaze(size, size, loopFactor);
        setMaze(newMaze);
        const startPos = getStartPosition(newMaze, cellSize);
        setPlayerPos(startPos);
        setVelocity({ x: 0, y: 0 });
        setIsPlaying(true);
        setStartTime(Date.now());
        setElapsedTime(0);
    };

    return (
        <div ref={containerRef} className="flex flex-col items-center gap-4 h-full p-4">
            {/* Controls header */}
            <div className="flex items-center justify-between w-full max-w-md">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-elevated hover:bg-muted transition-colors text-text"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                </button>

                <div className="text-lg font-mono font-bold text-cyan-400">
                    {formatTimeDisplay(elapsedTime)}
                </div>

                <button
                    onClick={handleReset}
                    className="px-3 py-2 rounded-lg bg-elevated hover:bg-muted transition-colors text-sm text-text"
                >
                    ↻ Reset
                </button>
            </div>

            {/* Permission request for tilt */}
            {controlMode === 'tilt' && tiltPermission === 'prompt' && (
                <button
                    onClick={requestTiltPermission}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-void font-medium hover:bg-cyan-400 transition-colors"
                >
                    📱 Enable Tilt Controls
                </button>
            )}

            {/* Instructions */}
            <div className="text-xs text-subtle text-center">
                {controlMode === 'tilt'
                    ? 'Tilt your device to roll through the maze'
                    : 'Drag to move • Arrow keys on desktop'}
            </div>

            {/* Maze canvas */}
            <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="rounded-lg shadow-lg touch-none"
                style={{
                    boxShadow: theme === 'dark'
                        ? '0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(6,182,212,0.2)'
                        : '0 4px 16px rgba(0,0,0,0.15)',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

            {/* Character indicator */}
            <div className="flex items-center gap-2 text-sm text-subtle">
                <span>{CHARACTERS[character].emoji}</span>
                <span>{CHARACTERS[character].name}</span>
            </div>
        </div>
    );
}
