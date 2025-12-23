import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import type { MazeGrid, CharacterType } from '../../lib/mazeUtils';
import {
    generateMaze,
    hasReachedFinish,
    getStartPosition,
    CHARACTERS,
} from '../../lib/mazeUtils';
import { useTheme } from '../../lib/ThemeContext';
import { MazeMinimap } from './MazeMinimap';

interface MazeRunner3DProps {
    size: number;
    character: CharacterType;
    controlMode: 'tilt' | 'touch';
    loopFactor?: number;
    onComplete: (time: number) => void;
    onBack: () => void;
}

const WALL_HEIGHT = 3;
const PLAYER_HEIGHT = 1.5;
const MOVE_SPEED = 8;
const TURN_SPEED = 2.5;

export function MazeRunner3D({ size, character, controlMode, loopFactor = 0.1, onComplete, onBack }: MazeRunner3DProps) {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animationRef = useRef<number>(0);

    const [maze, setMaze] = useState<MazeGrid | null>(null);
    const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
    const [playerRotation, setPlayerRotation] = useState(0);
    const [velocity, setVelocity] = useState({ forward: 0, turn: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [tiltPermission, setTiltPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    const cellSize = useMemo(() => 4, []); // Fixed cell size for 3D

    // Initialize maze and Three.js scene
    useEffect(() => {
        const newMaze = generateMaze(size, size, loopFactor);
        setMaze(newMaze);
        const startPos = getStartPosition(newMaze, cellSize);
        setPlayerPos({ x: startPos.x, z: startPos.y });
        setPlayerRotation(0);
        setVelocity({ forward: 0, turn: 0 });
        setIsPlaying(true);
        setStartTime(Date.now());
        setElapsedTime(0);
    }, [size, cellSize, loopFactor]);

    // Setup Three.js
    useEffect(() => {
        if (!canvasRef.current || !maze) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight - 60; // Account for header

        // Scene
        const scene = new THREE.Scene();
        const isDark = theme === 'dark';
        scene.background = new THREE.Color(isDark ? 0x0a0a0f : 0xf0f0f0);
        scene.fog = new THREE.Fog(isDark ? 0x0a0a0f : 0xe0e0e0, 5, 40);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        camera.position.set(playerPos.x, PLAYER_HEIGHT, playerPos.z);
        camera.rotation.y = playerRotation;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(maze.cols * cellSize, maze.rows * cellSize);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x1a1a2e : 0xcccccc,
            roughness: 0.8,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set((maze.cols * cellSize) / 2, 0, (maze.rows * cellSize) / 2);
        scene.add(floor);

        // Grid lines on floor
        const gridHelper = new THREE.GridHelper(
            Math.max(maze.cols, maze.rows) * cellSize,
            Math.max(maze.cols, maze.rows),
            isDark ? 0x333355 : 0xaaaaaa,
            isDark ? 0x222244 : 0xbbbbbb
        );
        gridHelper.position.set((maze.cols * cellSize) / 2, 0.01, (maze.rows * cellSize) / 2);
        scene.add(gridHelper);

        // Wall material
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: isDark ? 0x0891b2 : 0x06b6d4,
            roughness: 0.5,
            metalness: 0.2,
        });

        // Create walls using instanced mesh for performance
        const wallGeometry = new THREE.BoxGeometry(cellSize, WALL_HEIGHT, 0.2);
        const walls: THREE.Mesh[] = [];

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.cells[row][col];
                const x = (col + 0.5) * cellSize;
                const z = (row + 0.5) * cellSize;

                // Top wall (north)
                if (cell.walls.top) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, WALL_HEIGHT / 2, z - cellSize / 2);
                    walls.push(wall);
                }

                // Left wall (west)
                if (cell.walls.left) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.rotation.y = Math.PI / 2;
                    wall.position.set(x - cellSize / 2, WALL_HEIGHT / 2, z);
                    walls.push(wall);
                }

                // Right wall for last column
                if (col === maze.cols - 1 && cell.walls.right) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.rotation.y = Math.PI / 2;
                    wall.position.set(x + cellSize / 2, WALL_HEIGHT / 2, z);
                    walls.push(wall);
                }

                // Bottom wall for last row
                if (row === maze.rows - 1 && cell.walls.bottom) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, WALL_HEIGHT / 2, z + cellSize / 2);
                    walls.push(wall);
                }
            }
        }

        walls.forEach(wall => scene.add(wall));

        // Goal marker
        const goalGeometry = new THREE.CylinderGeometry(0.5, 0.5, WALL_HEIGHT * 1.5, 16);
        const goalMaterial = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x22c55e,
            emissiveIntensity: 0.5,
        });
        const goalMarker = new THREE.Mesh(goalGeometry, goalMaterial);
        goalMarker.position.set(
            (maze.finish.col + 0.5) * cellSize,
            WALL_HEIGHT * 0.75,
            (maze.finish.row + 0.5) * cellSize
        );
        scene.add(goalMarker);

        // Goal light
        const goalLight = new THREE.PointLight(0x22c55e, 1, 15);
        goalLight.position.copy(goalMarker.position);
        scene.add(goalLight);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        // Handle resize
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth;
            const h = container.clientHeight - 60;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            walls.forEach(wall => {
                wall.geometry.dispose();
            });
            floorGeometry.dispose();
            goalGeometry.dispose();
        };
    }, [maze, theme, cellSize, playerPos.x, playerPos.z, playerRotation]);

    // Timer
    useEffect(() => {
        if (!isPlaying || !startTime) return;
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 50);
        return () => clearInterval(interval);
    }, [isPlaying, startTime]);

    // Request tilt permission
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

            const gamma = e.gamma || 0;
            const beta = e.beta || 0;

            const turnSensitivity = 0.04;
            const moveSensitivity = 0.15;

            setVelocity({
                forward: Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, (beta - 45) * moveSensitivity)),
                turn: gamma * turnSensitivity,
            });
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [controlMode, tiltPermission, isPlaying]);

    // Touch controls
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

        const moveSensitivity = 0.03;
        const turnSensitivity = 0.02;

        setVelocity({
            forward: Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, -dy * moveSensitivity)),
            turn: dx * turnSensitivity,
        });
    }, [controlMode]);

    const handleTouchEnd = useCallback(() => {
        touchStartRef.current = null;
        setVelocity({ forward: 0, turn: 0 });
    }, []);

    // Keyboard controls
    useEffect(() => {
        const keys: Set<string> = new Set();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;
            keys.add(e.key.toLowerCase());
            updateVelocityFromKeys(keys);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keys.delete(e.key.toLowerCase());
            updateVelocityFromKeys(keys);
        };

        const updateVelocityFromKeys = (activeKeys: Set<string>) => {
            let forward = 0;
            let turn = 0;

            if (activeKeys.has('w') || activeKeys.has('arrowup')) forward = MOVE_SPEED;
            if (activeKeys.has('s') || activeKeys.has('arrowdown')) forward = -MOVE_SPEED;
            if (activeKeys.has('a') || activeKeys.has('arrowleft')) turn = -TURN_SPEED;
            if (activeKeys.has('d') || activeKeys.has('arrowright')) turn = TURN_SPEED;

            setVelocity({ forward, turn });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPlaying]);

    // Game loop
    useEffect(() => {
        if (!maze || !isPlaying || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

        const camera = cameraRef.current;
        const scene = sceneRef.current;
        const renderer = rendererRef.current;

        let lastTime = performance.now();

        const gameLoop = () => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Update rotation
            setPlayerRotation(rot => rot + velocity.turn * deltaTime);

            // Update position
            setPlayerPos(pos => {
                const moveX = Math.sin(playerRotation) * velocity.forward * deltaTime;
                const moveZ = -Math.cos(playerRotation) * velocity.forward * deltaTime;

                let newX = pos.x + moveX;
                let newZ = pos.z + moveZ;

                // Simple collision detection
                const col = Math.floor(newX / cellSize);
                const row = Math.floor(newZ / cellSize);

                if (row >= 0 && row < maze.rows && col >= 0 && col < maze.cols) {
                    const cell = maze.cells[row][col];
                    const localX = newX - col * cellSize;
                    const localZ = newZ - row * cellSize;
                    const margin = 0.5;

                    // Check walls
                    if (cell.walls.top && localZ < margin) newZ = row * cellSize + margin;
                    if (cell.walls.bottom && localZ > cellSize - margin) newZ = (row + 1) * cellSize - margin;
                    if (cell.walls.left && localX < margin) newX = col * cellSize + margin;
                    if (cell.walls.right && localX > cellSize - margin) newX = (col + 1) * cellSize - margin;
                }

                // Check if reached finish
                if (hasReachedFinish(maze, newX, newZ, cellSize)) {
                    setIsPlaying(false);
                    onComplete(Date.now() - (startTime || Date.now()));
                }

                return { x: newX, z: newZ };
            });

            // Update camera
            camera.position.x = playerPos.x;
            camera.position.z = playerPos.z;
            camera.rotation.y = -playerRotation;

            renderer.render(scene, camera);
            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [maze, isPlaying, velocity, playerRotation, cellSize, onComplete, startTime, playerPos.x, playerPos.z]);

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
        setPlayerPos({ x: startPos.x, z: startPos.y });
        setPlayerRotation(0);
        setVelocity({ forward: 0, turn: 0 });
        setIsPlaying(true);
        setStartTime(Date.now());
        setElapsedTime(0);
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full">
            {/* Controls header */}
            <div className="flex items-center justify-between px-4 py-2 bg-surface/80 backdrop-blur-sm">
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
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onClick={requestTiltPermission}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-void font-medium hover:bg-cyan-400 transition-colors"
                    >
                        📱 Enable Tilt Controls
                    </button>
                </div>
            )}

            {/* 3D Canvas with Minimap */}
            <div className="relative flex-1">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />

                {/* Minimap overlay */}
                {maze && (
                    <MazeMinimap
                        maze={maze}
                        playerX={playerPos.x}
                        playerZ={playerPos.z}
                        playerRotation={playerRotation}
                        cellSize={cellSize}
                    />
                )}

                {/* Character indicator */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-sm text-subtle bg-surface/80 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <span>{CHARACTERS[character].emoji}</span>
                    <span>{CHARACTERS[character].name}</span>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-subtle bg-surface/80 px-3 py-2 rounded-lg backdrop-blur-sm">
                    {controlMode === 'tilt'
                        ? 'Tilt forward/back to move • Tilt left/right to turn'
                        : 'Drag up/down to move • Drag left/right to turn'}
                </div>
            </div>
        </div>
    );
}
