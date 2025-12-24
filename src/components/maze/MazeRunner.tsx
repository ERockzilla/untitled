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
import { DPad } from './DPad';

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
    const [viewportSize, setViewportSize] = useState(400);
    const [tiltPermission, setTiltPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [zoom, setZoom] = useState(1); // 1 = full maze visible, 2 = zoomed in 2x, etc.
    const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

    // Calculate base cell size assuming full maze visible
    const baseCellSize = viewportSize / size;
    // Effective cell size based on zoom
    const cellSize = baseCellSize * zoom;
    const playerRadius = cellSize * 0.35;

    // Detect mobile - use touch capability AND screen size
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 1024;
            setIsMobile(hasTouchScreen && isSmallScreen);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Update viewport size based on container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const minDim = Math.min(rect.width - 32, rect.height - 100, 600);
                setViewportSize(Math.max(300, minDim));
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Auto-zoom for larger mazes
    useEffect(() => {
        if (size >= 35) {
            setZoom(2.5); // Zoom in more for extreme
        } else if (size >= 20) {
            setZoom(1.5); // Zoom in for hard
        } else {
            setZoom(1); // Full view for easy/medium
        }
    }, [size]);

    // Update camera to follow player when zoomed in
    useEffect(() => {
        if (zoom > 1 && maze) {
            const mazeWidth = maze.cols * cellSize;
            const mazeHeight = maze.rows * cellSize;
            const halfViewport = viewportSize / 2;

            // Center camera on player
            let offsetX = playerPos.x - halfViewport;
            let offsetY = playerPos.y - halfViewport;

            // Clamp to maze boundaries
            offsetX = Math.max(0, Math.min(offsetX, mazeWidth - viewportSize));
            offsetY = Math.max(0, Math.min(offsetY, mazeHeight - viewportSize));

            setCameraOffset({ x: offsetX, y: offsetY });
        } else {
            setCameraOffset({ x: 0, y: 0 });
        }
    }, [playerPos, zoom, maze, cellSize, viewportSize]);

    // Handle zoom with scroll wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setZoom(z => Math.max(1, Math.min(4, z + delta)));
    }, []);

    // Zoom buttons handler
    const handleZoomIn = () => setZoom(z => Math.min(4, z + 0.5));
    const handleZoomOut = () => setZoom(z => Math.max(1, z - 0.5));

    // Timer
    useEffect(() => {
        if (!isPlaying || !startTime) return;
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 50);
        return () => clearInterval(interval);
    }, [isPlaying, startTime]);

    // Load calibration data from localStorage
    interface CalibrationData {
        neutralBeta: number;
        neutralGamma: number;
        sensitivity: number;
        deadzone: number;
        timestamp: number;
    }

    const [calibration, setCalibration] = useState<CalibrationData | null>(null);
    useEffect(() => {
        try {
            const saved = localStorage.getItem('maze_tilt_calibration');
            if (saved) {
                const data = JSON.parse(saved);
                // Check if calibration is less than 24 hours old
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    setCalibration(data);
                }
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Auto-grant tilt permission since it's now handled in MazeSelection
    useEffect(() => {
        if (controlMode === 'tilt') {
            // Permission was already requested in MazeSelection, so just enable
            setTiltPermission('granted');
        }
    }, [controlMode]);

    // Tilt controls - uses calibration data for better accuracy
    useEffect(() => {
        if (controlMode !== 'tilt' || tiltPermission !== 'granted') return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (!isPlaying) return;

            const gamma = e.gamma || 0;
            const beta = e.beta || 0;

            // Use calibration data if available, otherwise use defaults
            const neutralBeta = calibration?.neutralBeta ?? 45;
            const neutralGamma = calibration?.neutralGamma ?? 0;
            const sensitivityMultiplier = calibration?.sensitivity ?? 1.0;
            const deadzone = calibration?.deadzone ?? 5;

            // Adjust for neutral position
            const adjustedBeta = beta - neutralBeta;
            const adjustedGamma = gamma - neutralGamma;

            // Apply deadzone - no movement if within deadzone
            const effectiveBeta = Math.abs(adjustedBeta) > deadzone
                ? (adjustedBeta - Math.sign(adjustedBeta) * deadzone)
                : 0;
            const effectiveGamma = Math.abs(adjustedGamma) > deadzone
                ? (adjustedGamma - Math.sign(adjustedGamma) * deadzone)
                : 0;

            // Base sensitivity, adjusted by calibration
            const baseSensitivity = 0.025;
            const sensitivity = baseSensitivity * sensitivityMultiplier;
            const maxVel = 3; // Max velocity to prevent wall clipping

            setVelocity(v => ({
                x: Math.max(-maxVel, Math.min(maxVel, v.x * 0.85 + effectiveGamma * sensitivity)),
                y: Math.max(-maxVel, Math.min(maxVel, v.y * 0.85 + effectiveBeta * sensitivity)),
            }));
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [controlMode, tiltPermission, isPlaying, calibration]);

    // D-pad direction handler for touch mode
    const handleDPadDirection = useCallback((dir: { x: number; y: number }) => {
        const speed = 3;
        setVelocity({
            x: dir.x * speed,
            y: dir.y * speed,
        });
    }, []);

    // Swipe touch controls are disabled - use D-pad instead
    const handleTouchStart = useCallback(() => { }, []);
    const handleTouchMove = useCallback(() => { }, []);
    const handleTouchEnd = useCallback(() => { }, []);

    // Keyboard controls (desktop fallback)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;

            const speed = 3;
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

    // Game loop - update player position with step-based collision
    useEffect(() => {
        if (!maze || !isPlaying) return;

        const gameLoop = setInterval(() => {
            setPlayerPos(pos => {
                // Step-based movement to prevent wall clipping
                const steps = 4; // Break movement into smaller steps
                let newX = pos.x;
                let newY = pos.y;
                const stepX = velocity.x / steps;
                const stepY = velocity.y / steps;

                for (let i = 0; i < steps; i++) {
                    // Try X movement
                    const tryX = newX + stepX;
                    const collisionX = checkWallCollision(maze, tryX, newY, playerRadius, cellSize);
                    if (!collisionX.blocked || Math.abs(collisionX.adjustedX - tryX) < 0.1) {
                        newX = collisionX.adjustedX;
                    }

                    // Try Y movement
                    const tryY = newY + stepY;
                    const collisionY = checkWallCollision(maze, newX, tryY, playerRadius, cellSize);
                    if (!collisionY.blocked || Math.abs(collisionY.adjustedY - tryY) < 0.1) {
                        newY = collisionY.adjustedY;
                    }
                }

                // Final collision check
                const finalCollision = checkWallCollision(maze, newX, newY, playerRadius, cellSize);
                newX = finalCollision.adjustedX;
                newY = finalCollision.adjustedY;

                // Check if reached finish
                if (hasReachedFinish(maze, newX, newY, cellSize)) {
                    setIsPlaying(false);
                    onComplete(Date.now() - (startTime || Date.now()));
                }

                return { x: newX, y: newY };
            });

            // Apply friction to velocity
            setVelocity(v => ({
                x: v.x * 0.92,
                y: v.y * 0.92,
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

        // Get the full maze size (zoomed)
        const fullMazeSize = size * cellSize;

        // Clear canvas with full maze size
        ctx.fillStyle = isDark ? '#0f0f12' : '#f5f3ee';
        ctx.fillRect(0, 0, fullMazeSize, fullMazeSize);

        // Draw grid pattern (subtle)
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= size; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, fullMazeSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(fullMazeSize, i * cellSize);
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

        // Draw finish marker with pulsing effect
        const finishX = maze.finish.col * cellSize + cellSize / 2;
        const finishY = maze.finish.row * cellSize + cellSize / 2;

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(6, 182, 212, ${0.4 * pulse})`;
        ctx.beginPath();
        ctx.arc(finishX, finishY, cellSize * (0.6 * pulse), 0, Math.PI * 2);
        ctx.fill();

        // Inner solid circle
        ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.beginPath();
        ctx.arc(finishX, finishY, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Flag icon
        ctx.font = `${cellSize * 0.5}px sans-serif`;
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

    }, [maze, playerPos, cellSize, character, theme, size, cameraOffset, viewportSize]);

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
        <div ref={containerRef} className="flex flex-col items-center h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-void)' }}>
            {/* Controls header - sticky at top */}
            <div className="flex-shrink-0 w-full p-4 pb-2">
                <div className="flex items-center justify-between max-w-md mx-auto">
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
            </div>

            {/* Instructions */}
            <div className="flex-shrink-0 text-xs text-subtle text-center pb-2">
                {isMobile
                    ? (controlMode === 'tilt'
                        ? 'Tilt your device or use D-pad below'
                        : 'Use the D-pad below')
                    : 'Use arrow keys or WASD'}
            </div>

            {/* Maze canvas container - takes remaining space */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden px-4">
                <div
                    className="relative overflow-hidden rounded-lg shadow-lg"
                    style={{
                        width: viewportSize,
                        height: viewportSize,
                        boxShadow: theme === 'dark'
                            ? '0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(6,182,212,0.2)'
                            : '0 4px 16px rgba(0,0,0,0.15)',
                    }}
                    onWheel={handleWheel}
                >
                    <canvas
                        ref={canvasRef}
                        width={size * cellSize}
                        height={size * cellSize}
                        className="touch-none"
                        style={{
                            position: 'absolute',
                            left: -cameraOffset.x,
                            top: -cameraOffset.y,
                            width: size * cellSize,
                            height: size * cellSize,
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />

                    {/* Zoom controls */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                        <button
                            onClick={handleZoomIn}
                            className="w-8 h-8 rounded bg-black/40 text-white hover:bg-black/60 transition-colors flex items-center justify-center text-lg font-bold"
                            title="Zoom In"
                        >
                            +
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="w-8 h-8 rounded bg-black/40 text-white hover:bg-black/60 transition-colors flex items-center justify-center text-lg font-bold"
                            title="Zoom Out"
                        >
                            −
                        </button>
                    </div>

                    {/* Zoom level indicator */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/40 text-white text-xs">
                        {zoom.toFixed(1)}x
                    </div>
                </div>
            </div>

            {/* D-pad for mobile - ALWAYS shown on mobile devices */}
            {isMobile && (
                <div className="flex-shrink-0 py-2 flex justify-center">
                    <DPad onDirectionChange={handleDPadDirection} size={140} />
                </div>
            )}

            {/* Character indicator */}
            <div className="flex-shrink-0 pb-4 flex items-center gap-2 text-sm text-subtle">
                <span>{CHARACTERS[character].emoji}</span>
                <span>{CHARACTERS[character].name}</span>
            </div>
        </div>
    );
}
