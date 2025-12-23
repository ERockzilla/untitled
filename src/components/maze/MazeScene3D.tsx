import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { MazeGrid, CharacterType } from '../../lib/mazeUtils';
import {
    generateMaze,
    hasReachedFinish,
    getStartPosition,
    CHARACTERS,
} from '../../lib/mazeUtils';
import { MazeMinimap } from './MazeMinimap';
import { Joystick } from './Joystick';
import { createWallTexture, type WallTheme } from './WallTextureGenerator';

interface MazeScene3DProps {
    size: number;
    character: CharacterType;
    controlMode: 'tilt' | 'touch';
    loopFactor?: number;
    wallTheme?: WallTheme;
    onComplete: (time: number) => void;
    onBack: () => void;
}

const WALL_HEIGHT = 3;
const CELL_SIZE = 4;
const MOVE_SPEED = 8;
const TURN_SPEED = 2.5;

// Keyboard control mapping
const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'turnLeft', keys: ['ArrowLeft', 'KeyA', 'KeyQ'] },
    { name: 'turnRight', keys: ['ArrowRight', 'KeyD', 'KeyE'] },
    { name: 'sprint', keys: ['ShiftLeft'] },
];

// Player controller component
function Player({
    startPos,
    onPositionUpdate,
    onRotationUpdate,
    joystickInput,
    cameraJoystickInput,
}: {
    startPos: { x: number; z: number };
    onPositionUpdate: (x: number, z: number) => void;
    onRotationUpdate: (rotation: number) => void;
    joystickInput: { x: number; y: number };
    cameraJoystickInput: { x: number; y: number };
}) {
    const rigidBodyRef = useRef<any>(null);
    const { camera } = useThree();
    const rotationRef = useRef(0);

    const [, getKeys] = useKeyboardControls();

    useFrame((_, delta) => {
        if (!rigidBodyRef.current) return;

        const { forward, backward, turnLeft, turnRight, sprint } = getKeys();
        const speed = sprint ? MOVE_SPEED * 1.5 : MOVE_SPEED;

        // Handle rotation from keyboard
        if (turnLeft) {
            rotationRef.current += TURN_SPEED * delta;
        }
        if (turnRight) {
            rotationRef.current -= TURN_SPEED * delta;
        }

        // Handle rotation from right joystick (for mobile camera control)
        if (cameraJoystickInput.x !== 0) {
            rotationRef.current -= cameraJoystickInput.x * TURN_SPEED * delta * 2;
        }

        // Update camera rotation
        camera.rotation.y = rotationRef.current;

        // Calculate forward direction based on rotation
        const direction = new THREE.Vector3(
            -Math.sin(rotationRef.current),
            0,
            -Math.cos(rotationRef.current)
        );

        // Calculate movement
        let moveX = 0;
        let moveZ = 0;

        // Keyboard input - forward/backward
        if (forward) {
            moveX += direction.x * speed;
            moveZ += direction.z * speed;
        }
        if (backward) {
            moveX -= direction.x * speed;
            moveZ -= direction.z * speed;
        }

        // Joystick input (left joystick moves, right joystick handled above for rotation)
        if (joystickInput.y !== 0) {
            moveX += direction.x * -joystickInput.y * speed;
            moveZ += direction.z * -joystickInput.y * speed;
        }

        // Apply velocity
        rigidBodyRef.current.setLinvel({ x: moveX, y: 0, z: moveZ }, true);

        // Update camera position (first person)
        const pos = rigidBodyRef.current.translation();
        camera.position.set(pos.x, 1.6, pos.z);

        // Report position and rotation
        onPositionUpdate(pos.x, pos.z);
        onRotationUpdate(rotationRef.current);
    });

    return (
        <RigidBody
            ref={rigidBodyRef}
            position={[startPos.x, 1, startPos.z]}
            enabledRotations={[false, false, false]}
            linearDamping={5}
            type="dynamic"
            colliders={false}
        >
            <CuboidCollider args={[0.3, 0.8, 0.3]} />
        </RigidBody>
    );
}

// Maze walls using instanced mesh
function MazeWalls({ maze, wallTexture }: { maze: MazeGrid; wallTexture: THREE.Texture | null }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const { wallData, count } = useMemo(() => {
        const walls: { position: THREE.Vector3; rotation: number }[] = [];

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.cells[row][col];
                const x = (col + 0.5) * CELL_SIZE;
                const z = (row + 0.5) * CELL_SIZE;

                if (cell.walls.top) {
                    walls.push({
                        position: new THREE.Vector3(x, WALL_HEIGHT / 2, z - CELL_SIZE / 2),
                        rotation: 0,
                    });
                }
                if (cell.walls.left) {
                    walls.push({
                        position: new THREE.Vector3(x - CELL_SIZE / 2, WALL_HEIGHT / 2, z),
                        rotation: Math.PI / 2,
                    });
                }
                if (col === maze.cols - 1 && cell.walls.right) {
                    walls.push({
                        position: new THREE.Vector3(x + CELL_SIZE / 2, WALL_HEIGHT / 2, z),
                        rotation: Math.PI / 2,
                    });
                }
                if (row === maze.rows - 1 && cell.walls.bottom) {
                    walls.push({
                        position: new THREE.Vector3(x, WALL_HEIGHT / 2, z + CELL_SIZE / 2),
                        rotation: 0,
                    });
                }
            }
        }

        return { wallData: walls, count: walls.length };
    }, [maze]);

    useEffect(() => {
        if (!meshRef.current) return;

        const dummy = new THREE.Object3D();
        wallData.forEach((wall, i) => {
            dummy.position.copy(wall.position);
            dummy.rotation.y = wall.rotation;
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [wallData]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, 0.2]} />
            <meshStandardMaterial
                color="#0891b2"
                roughness={0.5}
                metalness={0.2}
                map={wallTexture}
                emissive="#06b6d4"
                emissiveIntensity={0.1}
            />
        </instancedMesh>
    );
}

// Wall colliders for physics
function WallColliders({ maze }: { maze: MazeGrid }) {
    const colliders = useMemo(() => {
        const cols: { position: [number, number, number]; rotation: number; size: [number, number, number] }[] = [];

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.cells[row][col];
                const x = (col + 0.5) * CELL_SIZE;
                const z = (row + 0.5) * CELL_SIZE;

                if (cell.walls.top) {
                    cols.push({
                        position: [x, WALL_HEIGHT / 2, z - CELL_SIZE / 2],
                        rotation: 0,
                        size: [CELL_SIZE / 2, WALL_HEIGHT / 2, 0.15],
                    });
                }
                if (cell.walls.left) {
                    cols.push({
                        position: [x - CELL_SIZE / 2, WALL_HEIGHT / 2, z],
                        rotation: Math.PI / 2,
                        size: [CELL_SIZE / 2, WALL_HEIGHT / 2, 0.15],
                    });
                }
                if (col === maze.cols - 1 && cell.walls.right) {
                    cols.push({
                        position: [x + CELL_SIZE / 2, WALL_HEIGHT / 2, z],
                        rotation: Math.PI / 2,
                        size: [CELL_SIZE / 2, WALL_HEIGHT / 2, 0.15],
                    });
                }
                if (row === maze.rows - 1 && cell.walls.bottom) {
                    cols.push({
                        position: [x, WALL_HEIGHT / 2, z + CELL_SIZE / 2],
                        rotation: 0,
                        size: [CELL_SIZE / 2, WALL_HEIGHT / 2, 0.15],
                    });
                }
            }
        }

        return cols;
    }, [maze]);

    return (
        <>
            {colliders.map((col, i) => (
                <RigidBody key={i} type="fixed" position={col.position} rotation={[0, col.rotation, 0]}>
                    <CuboidCollider args={col.size} />
                </RigidBody>
            ))}
        </>
    );
}

// Goal marker
function GoalMarker({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
                <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <pointLight color="#22c55e" intensity={2} distance={15} />
        </group>
    );
}

// Floor component
function Floor({ size }: { size: number }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[size * CELL_SIZE / 2, 0, size * CELL_SIZE / 2]} receiveShadow>
            <planeGeometry args={[size * CELL_SIZE, size * CELL_SIZE]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
        </mesh>
    );
}

// Main scene content
function SceneContent({
    maze,
    startPos,
    goalPos,
    wallTheme,
    onPositionUpdate,
    onRotationUpdate,
    joystickInput,
    cameraJoystickInput,
}: {
    maze: MazeGrid;
    startPos: { x: number; z: number };
    goalPos: [number, number, number];
    wallTheme: WallTheme;
    onPositionUpdate: (x: number, z: number) => void;
    onRotationUpdate: (rotation: number) => void;
    joystickInput: { x: number; y: number };
    cameraJoystickInput: { x: number; y: number };
}) {
    const wallTexture = useMemo(() => createWallTexture(wallTheme, 'maze-walls'), [wallTheme]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 20, 10]} intensity={0.5} castShadow />

            {/* Fog */}
            <fog attach="fog" args={['#0a0a12', 5, 35]} />

            {/* Floor */}
            <Floor size={maze.rows} />

            {/* Physics world */}
            <Physics gravity={[0, -9.81, 0]}>
                <Player
                    startPos={startPos}
                    onPositionUpdate={onPositionUpdate}
                    onRotationUpdate={onRotationUpdate}
                    joystickInput={joystickInput}
                    cameraJoystickInput={cameraJoystickInput}
                />
                <WallColliders maze={maze} />

                {/* Floor collider */}
                <RigidBody type="fixed">
                    <CuboidCollider
                        args={[maze.cols * CELL_SIZE / 2, 0.1, maze.rows * CELL_SIZE / 2]}
                        position={[maze.cols * CELL_SIZE / 2, -0.1, maze.rows * CELL_SIZE / 2]}
                    />
                </RigidBody>
            </Physics>

            {/* Walls (visual only, physics separate) */}
            <MazeWalls maze={maze} wallTexture={wallTexture} />

            {/* Goal */}
            <GoalMarker position={goalPos} />

            {/* Post-processing effects */}
            <EffectComposer>
                <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.8} />
            </EffectComposer>
        </>
    );
}

export function MazeScene3D({
    size,
    character,
    // controlMode is not used - we detect mobile via touch capability
    loopFactor = 0.1,
    wallTheme = 'neon',
    onComplete,
    onBack,
}: MazeScene3DProps) {
    const [maze, setMaze] = useState<MazeGrid | null>(null);
    const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });
    const [playerRotation, setPlayerRotation] = useState(0);
    const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
    const [cameraJoystickInput, setCameraJoystickInput] = useState({ x: 0, y: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const isMobile = typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Initialize maze
    useEffect(() => {
        const newMaze = generateMaze(size, size, loopFactor);
        setMaze(newMaze);
        const startPos = getStartPosition(newMaze, CELL_SIZE);
        setPlayerPos({ x: startPos.x, z: startPos.y });
        setIsPlaying(true);
        setStartTime(Date.now());
        setElapsedTime(0);
    }, [size, loopFactor]);

    // Timer
    useEffect(() => {
        if (!isPlaying || !startTime) return;
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 50);
        return () => clearInterval(interval);
    }, [isPlaying, startTime]);

    // Position update callback
    const handlePositionUpdate = useCallback((x: number, z: number) => {
        setPlayerPos({ x, z });

        if (maze && hasReachedFinish(maze, x, z, CELL_SIZE)) {
            setIsPlaying(false);
            onComplete(Date.now() - (startTime || Date.now()));
        }
    }, [maze, startTime, onComplete]);

    // Joystick handlers
    const handleJoystickMove = useCallback((x: number, y: number) => {
        setJoystickInput({ x, y });
    }, []);

    const handleCameraJoystickMove = useCallback((x: number, y: number) => {
        setCameraJoystickInput({ x, y });
    }, []);

    // Rotation update handler
    const handleRotationUpdate = useCallback((rotation: number) => {
        setPlayerRotation(rotation);
    }, []);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const hundredths = Math.floor((ms % 1000) / 10);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        const newMaze = generateMaze(size, size, loopFactor);
        setMaze(newMaze);
        const startPos = getStartPosition(newMaze, CELL_SIZE);
        setPlayerPos({ x: startPos.x, z: startPos.y });
        setPlayerRotation(0);
        setJoystickInput({ x: 0, y: 0 });
        setCameraJoystickInput({ x: 0, y: 0 });
        setIsPlaying(true);
        setStartTime(Date.now());
        setElapsedTime(0);
    };

    if (!maze) return null;

    const startPos = getStartPosition(maze, CELL_SIZE);
    const goalPos: [number, number, number] = [
        (maze.finish.col + 0.5) * CELL_SIZE,
        WALL_HEIGHT / 2,
        (maze.finish.row + 0.5) * CELL_SIZE,
    ];

    return (
        <div className="relative w-full h-screen flex flex-col" style={{ backgroundColor: '#0a0a12' }}>
            {/* Header */}
            <div className="flex-shrink-0 z-10 flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                </button>

                <div className="text-lg font-mono font-bold text-cyan-400">
                    {formatTime(elapsedTime)}
                </div>

                <button
                    onClick={handleReset}
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
                >
                    ↻ Reset
                </button>
            </div>

            {/* 3D Canvas - fills remaining space */}
            <div className="flex-1 relative">
                <KeyboardControls map={keyboardMap}>
                    <Canvas
                        shadows
                        camera={{ fov: 75, near: 0.1, far: 100 }}
                        gl={{
                            antialias: !isMobile,
                            pixelRatio: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)
                        }}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    >
                        <SceneContent
                            maze={maze}
                            startPos={{ x: startPos.x, z: startPos.y }}
                            goalPos={goalPos}
                            wallTheme={wallTheme}
                            onPositionUpdate={handlePositionUpdate}
                            onRotationUpdate={handleRotationUpdate}
                            joystickInput={joystickInput}
                            cameraJoystickInput={cameraJoystickInput}
                        />
                    </Canvas>
                </KeyboardControls>

                {/* Minimap */}
                <MazeMinimap
                    maze={maze}
                    playerX={playerPos.x}
                    playerZ={playerPos.z}
                    playerRotation={playerRotation}
                    cellSize={CELL_SIZE}
                    size={100}
                />

                {/* Mobile joysticks - left for movement, right for camera */}
                {isMobile && (
                    <>
                        <div className="absolute bottom-8 left-8 z-10">
                            <Joystick onMove={handleJoystickMove} size={100} />
                        </div>
                        <div className="absolute bottom-8 right-8 z-10">
                            <Joystick onMove={handleCameraJoystickMove} size={100} />
                        </div>
                    </>
                )}

                {/* Character indicator */}
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 text-sm text-white/70 bg-black/50 px-3 py-2 rounded-lg" style={{ right: isMobile ? 140 : 16 }}>
                    <span>{CHARACTERS[character].emoji}</span>
                    <span>{CHARACTERS[character].name}</span>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-white/50 bg-black/50 px-3 py-2 rounded-lg">
                    {isMobile ? 'Left stick: move • Right stick: look' : 'W/S or ↑/↓ to move • A/D or ←/→ to turn • Shift to run'}
                </div>
            </div>
        </div>
    );
}
