import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls, useTexture } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
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

// Puzzle texture paths
const PUZZLE_TEXTURES = [
    '/puzzles/puzzle1.jpg',
    '/puzzles/puzzle2.jpg',
    '/puzzles/puzzle3.jpg',
    '/puzzles/puzzle4.jpg',
    '/puzzles/puzzle5.jpg',
    '/puzzles/puzzle6.jpg',
];

interface MazeScene3DProps {
    size: number;
    character: CharacterType;
    controlMode: 'tilt' | 'touch';
    loopFactor?: number;
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

// Textured wall segment component
function TexturedWallSegment({ 
    position, 
    rotation, 
    textureIndex 
}: { 
    position: [number, number, number]; 
    rotation: number;
    textureIndex: number;
}) {
    const textures = useTexture(PUZZLE_TEXTURES);
    const texture = textures[textureIndex % textures.length];
    
    // Configure texture for better appearance
    useMemo(() => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 0.75);
        texture.colorSpace = THREE.SRGBColorSpace;
    }, [texture]);

    return (
        <mesh 
            position={position} 
            rotation={[0, rotation, 0]} 
            castShadow 
            receiveShadow
        >
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, 0.4]} />
            <meshStandardMaterial
                map={texture}
                roughness={0.7}
                metalness={0.1}
                side={THREE.DoubleSide}
                bumpMap={texture}
                bumpScale={0.02}
            />
        </mesh>
    );
}

// Stone/brick wall segment for walls without pictures
function StoneWallSegment({ 
    position, 
    rotation 
}: { 
    position: [number, number, number]; 
    rotation: number;
}) {
    return (
        <mesh 
            position={position} 
            rotation={[0, rotation, 0]} 
            castShadow 
            receiveShadow
        >
            <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, 0.4]} />
            <meshStandardMaterial
                color="#4a4a5a"
                roughness={0.9}
                metalness={0.05}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// Maze walls with mixed textures and stone
function MazeWalls({ maze }: { maze: MazeGrid }) {
    const wallData = useMemo(() => {
        const walls: { position: [number, number, number]; rotation: number; hasPicture: boolean; textureIndex: number }[] = [];
        let pictureIndex = 0;

        for (let row = 0; row < maze.rows; row++) {
            for (let col = 0; col < maze.cols; col++) {
                const cell = maze.cells[row][col];
                const x = (col + 0.5) * CELL_SIZE;
                const z = (row + 0.5) * CELL_SIZE;

                // Determine if this wall should have a picture (roughly 30% of walls)
                const shouldHavePicture = () => {
                    const hash = (row * 31 + col * 17) % 100;
                    return hash < 30;
                };

                if (cell.walls.top) {
                    const hasPic = shouldHavePicture();
                    walls.push({
                        position: [x, WALL_HEIGHT / 2, z - CELL_SIZE / 2],
                        rotation: 0,
                        hasPicture: hasPic,
                        textureIndex: hasPic ? pictureIndex++ : 0,
                    });
                }
                if (cell.walls.left) {
                    const hasPic = shouldHavePicture();
                    walls.push({
                        position: [x - CELL_SIZE / 2, WALL_HEIGHT / 2, z],
                        rotation: Math.PI / 2,
                        hasPicture: hasPic,
                        textureIndex: hasPic ? pictureIndex++ : 0,
                    });
                }
                if (col === maze.cols - 1 && cell.walls.right) {
                    const hasPic = shouldHavePicture();
                    walls.push({
                        position: [x + CELL_SIZE / 2, WALL_HEIGHT / 2, z],
                        rotation: Math.PI / 2,
                        hasPicture: hasPic,
                        textureIndex: hasPic ? pictureIndex++ : 0,
                    });
                }
                if (row === maze.rows - 1 && cell.walls.bottom) {
                    const hasPic = shouldHavePicture();
                    walls.push({
                        position: [x, WALL_HEIGHT / 2, z + CELL_SIZE / 2],
                        rotation: 0,
                        hasPicture: hasPic,
                        textureIndex: hasPic ? pictureIndex++ : 0,
                    });
                }
            }
        }

        return walls;
    }, [maze]);

    // Separate walls into those with pictures and those without
    const pictureWalls = wallData.filter(w => w.hasPicture);
    const stoneWalls = wallData.filter(w => !w.hasPicture);

    return (
        <group>
            {/* Stone walls (no texture) */}
            {stoneWalls.map((wall, i) => (
                <StoneWallSegment
                    key={`stone-${i}`}
                    position={wall.position}
                    rotation={wall.rotation}
                />
            ))}
            {/* Picture walls with puzzle textures */}
            {pictureWalls.map((wall, i) => (
                <TexturedWallSegment
                    key={`pic-${i}`}
                    position={wall.position}
                    rotation={wall.rotation}
                    textureIndex={wall.textureIndex}
                />
            ))}
        </group>
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

// Goal marker - realistic exit portal with arch
function GoalMarker({ position }: { position: [number, number, number] }) {
    const glowRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);

    // Create particle geometry
    const particleGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const count = 50;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = Math.random() * WALL_HEIGHT;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geometry;
    }, []);

    useFrame((state) => {
        if (glowRef.current) {
            // Pulsing glow
            const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.8;
            (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
        }
        
        if (particlesRef.current) {
            // Floating particles
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += 0.02;
                if (positions[i + 1] > WALL_HEIGHT) {
                    positions[i + 1] = 0;
                }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <group position={[position[0], 0, position[2]]}>
            {/* Exit arch frame */}
            <mesh position={[0, WALL_HEIGHT / 2, 0]} castShadow>
                <boxGeometry args={[2.5, WALL_HEIGHT, 0.3]} />
                <meshStandardMaterial
                    color="#8b7355"
                    roughness={0.8}
                    metalness={0.2}
                />
            </mesh>
            
            {/* Glowing exit portal */}
            <mesh ref={glowRef} position={[0, WALL_HEIGHT / 2, 0.05]}>
                <planeGeometry args={[2, WALL_HEIGHT - 0.5]} />
                <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.7}
                    side={THREE.DoubleSide}
                />
            </mesh>
            
            {/* Floating particles */}
            <points ref={particlesRef} geometry={particleGeometry}>
                <pointsMaterial
                    color="#4ade80"
                    size={0.1}
                    transparent
                    opacity={0.8}
                    sizeAttenuation
                />
            </points>
            
            {/* "EXIT" text glow effect */}
            <pointLight color="#22c55e" intensity={3} distance={12} position={[0, 1.5, 1]} />
            <pointLight color="#4ade80" intensity={1} distance={8} position={[0, 0.5, 0.5]} />
        </group>
    );
}

// Floor component with realistic stone texture
function Floor({ size }: { size: number }) {
    const floorSize = size * CELL_SIZE;
    
    // Create procedural floor texture pattern
    const floorMaterial = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        
        // Base stone color
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add stone tile pattern
        const tileSize = 64;
        for (let x = 0; x < 512; x += tileSize) {
            for (let y = 0; y < 512; y += tileSize) {
                // Random stone color variation
                const shade = 35 + Math.random() * 20;
                ctx.fillStyle = `rgb(${shade + 5}, ${shade + 5}, ${shade + 15})`;
                ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                
                // Add subtle texture noise
                for (let i = 0; i < 50; i++) {
                    const nx = x + Math.random() * tileSize;
                    const ny = y + Math.random() * tileSize;
                    const alpha = Math.random() * 0.1;
                    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    ctx.fillRect(nx, ny, 2, 2);
                }
            }
        }
        
        // Grout lines
        ctx.strokeStyle = '#1a1a25';
        ctx.lineWidth = 3;
        for (let x = 0; x <= 512; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        for (let y = 0; y <= 512; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(size * 2, size * 2);
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.85,
            metalness: 0.05,
        });
    }, [size]);

    return (
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[floorSize / 2, 0, floorSize / 2]} 
            receiveShadow
            material={floorMaterial}
        >
            <planeGeometry args={[floorSize, floorSize]} />
        </mesh>
    );
}

// Ceiling component for enclosed feeling
function Ceiling({ size }: { size: number }) {
    const floorSize = size * CELL_SIZE;
    
    return (
        <mesh 
            rotation={[Math.PI / 2, 0, 0]} 
            position={[floorSize / 2, WALL_HEIGHT + 0.1, floorSize / 2]}
        >
            <planeGeometry args={[floorSize, floorSize]} />
            <meshStandardMaterial 
                color="#1a1a25" 
                roughness={0.95}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

// Ceiling lights scattered throughout
function CeilingLights({ maze }: { maze: MazeGrid }) {
    const lights = useMemo(() => {
        const result: [number, number, number][] = [];
        // Place lights every few cells
        for (let row = 1; row < maze.rows; row += 3) {
            for (let col = 1; col < maze.cols; col += 3) {
                result.push([
                    (col + 0.5) * CELL_SIZE,
                    WALL_HEIGHT - 0.2,
                    (row + 0.5) * CELL_SIZE,
                ]);
            }
        }
        return result;
    }, [maze]);

    return (
        <>
            {lights.map((pos, i) => (
                <group key={i} position={pos}>
                    {/* Light fixture */}
                    <mesh>
                        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
                        <meshStandardMaterial
                            color="#fffbe6"
                            emissive="#ffedd5"
                            emissiveIntensity={2}
                        />
                    </mesh>
                    {/* Point light */}
                    <pointLight 
                        color="#fff5e6" 
                        intensity={0.8} 
                        distance={12}
                        castShadow
                        shadow-mapSize={[256, 256]}
                    />
                </group>
            ))}
        </>
    );
}

// Main scene content
function SceneContent({
    maze,
    startPos,
    goalPos,
    onPositionUpdate,
    onRotationUpdate,
    joystickInput,
    cameraJoystickInput,
}: {
    maze: MazeGrid;
    startPos: { x: number; z: number };
    goalPos: [number, number, number];
    onPositionUpdate: (x: number, z: number) => void;
    onRotationUpdate: (rotation: number) => void;
    joystickInput: { x: number; y: number };
    cameraJoystickInput: { x: number; y: number };
}) {
    return (
        <>
            {/* Realistic indoor lighting */}
            <ambientLight intensity={0.15} color="#e0e8ff" />
            
            {/* Main directional light (like skylights) */}
            <directionalLight 
                position={[20, 40, 20]} 
                intensity={0.3} 
                castShadow 
                shadow-mapSize={[1024, 1024]}
                shadow-camera-far={100}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />

            {/* Atmospheric fog for depth */}
            <fog attach="fog" args={['#0f0f18', 5, 35]} />

            {/* Floor */}
            <Floor size={maze.rows} />
            
            {/* Ceiling */}
            <Ceiling size={maze.rows} />
            
            {/* Ceiling lights */}
            <CeilingLights maze={maze} />

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
            <MazeWalls maze={maze} />

            {/* Goal */}
            <GoalMarker position={goalPos} />

            {/* Post-processing effects for realism */}
            <EffectComposer>
                <Bloom 
                    luminanceThreshold={0.6} 
                    luminanceSmoothing={0.9} 
                    intensity={0.5} 
                />
                <Vignette
                    offset={0.3}
                    darkness={0.5}
                />
                <SMAA />
            </EffectComposer>
        </>
    );
}

export function MazeScene3D({
    size,
    character,
    // controlMode is not used - we detect mobile via touch capability
    loopFactor = 0.1,
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
                        dpr={Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)}
                        gl={{
                            antialias: !isMobile,
                        }}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    >
                        <SceneContent
                            maze={maze}
                            startPos={{ x: startPos.x, z: startPos.y }}
                            goalPos={goalPos}
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
