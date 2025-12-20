import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { seededRandom } from '../../lib/random';

// Voxel materials/colors (including empty = 0)
const VOXEL_COLORS = [
  null, // empty
  '#ff3366', // red/pink
  '#00d4aa', // teal
  '#7c5cff', // purple
  '#ffcc00', // yellow
  '#00aaff', // blue
  '#ff6b35', // orange
];

export interface VoxelGrid {
  size: number;
  voxels: number[][][]; // 3D array of color indices
}

/**
 * Generate voxel grid from address
 */
export function addressToVoxels(address: string, size: number = 6): VoxelGrid {
  const prng = seededRandom(address);
  const voxels: number[][][] = [];
  
  for (let x = 0; x < size; x++) {
    const plane: number[][] = [];
    for (let y = 0; y < size; y++) {
      const row: number[] = [];
      for (let z = 0; z < size; z++) {
        // ~40% chance of being filled
        const filled = prng() < 0.4;
        const colorIndex = filled ? 1 + Math.floor(prng() * (VOXEL_COLORS.length - 1)) : 0;
        row.push(colorIndex);
      }
      plane.push(row);
    }
    voxels.push(plane);
  }
  
  return { size, voxels };
}

interface VoxelRendererProps {
  address: string;
  size?: number;
  className?: string;
}

export function VoxelRenderer({
  address,
  size = 6,
  className = '',
}: VoxelRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);
  const meshesRef = useRef<THREE.InstancedMesh[]>([]);

  // Generate voxel data from address
  const voxelGrid = useMemo(() => addressToVoxels(address, size), [address, size]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(size * 1.5, size * 1.5, size * 1.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(size / 2, size / 2, size / 2);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-10, -10, -10);
    scene.add(directionalLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(size, size, 0x333344, 0x222233);
    gridHelper.position.set(size / 2 - 0.5, -0.5, size / 2 - 0.5);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [size]);

  // Update voxels when address changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old meshes
    meshesRef.current.forEach(mesh => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    meshesRef.current = [];

    // Count voxels per color
    const colorCounts: Record<number, number> = {};
    for (let x = 0; x < voxelGrid.size; x++) {
      for (let y = 0; y < voxelGrid.size; y++) {
        for (let z = 0; z < voxelGrid.size; z++) {
          const colorIndex = voxelGrid.voxels[x][y][z];
          if (colorIndex > 0) {
            colorCounts[colorIndex] = (colorCounts[colorIndex] || 0) + 1;
          }
        }
      }
    }

    // Create instanced mesh for each color
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    
    Object.entries(colorCounts).forEach(([colorIndexStr, count]) => {
      const colorIndex = parseInt(colorIndexStr);
      const color = VOXEL_COLORS[colorIndex];
      if (!color) return;

      const material = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      
      let instanceIndex = 0;
      const matrix = new THREE.Matrix4();
      
      for (let x = 0; x < voxelGrid.size; x++) {
        for (let y = 0; y < voxelGrid.size; y++) {
          for (let z = 0; z < voxelGrid.size; z++) {
            if (voxelGrid.voxels[x][y][z] === colorIndex) {
              matrix.setPosition(x, y, z);
              mesh.setMatrixAt(instanceIndex, matrix);
              instanceIndex++;
            }
          }
        }
      }
      
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      meshesRef.current.push(mesh);
    });
  }, [voxelGrid]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
    />
  );
}

/**
 * Simple 2D preview of voxel grid (top-down view)
 */
export function VoxelPreview({
  address,
  size = 6,
}: {
  address: string;
  size?: number;
}) {
  const voxelGrid = useMemo(() => addressToVoxels(address, size), [address, size]);
  const cellSize = 100 / size;

  // Create top-down view (highest y that has a voxel)
  const topView: (string | null)[][] = [];
  for (let x = 0; x < size; x++) {
    const row: (string | null)[] = [];
    for (let z = 0; z < size; z++) {
      let topColor = null;
      for (let y = size - 1; y >= 0; y--) {
        const colorIndex = voxelGrid.voxels[x][y][z];
        if (colorIndex > 0) {
          topColor = VOXEL_COLORS[colorIndex];
          break;
        }
      }
      row.push(topColor);
    }
    topView.push(row);
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" fill="#0a0a0f" />
      {topView.map((row, x) =>
        row.map((color, z) =>
          color && (
            <rect
              key={`${x}-${z}`}
              x={x * cellSize}
              y={z * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={color}
              rx="1"
            />
          )
        )
      )}
    </svg>
  );
}

