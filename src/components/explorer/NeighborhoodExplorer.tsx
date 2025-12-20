import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { offsetAddress } from '../../lib/babel-core';

interface NeighborhoodExplorerProps {
  currentAddress: string;
  onSelectAddress: (address: string) => void;
  renderPreview: (address: string, canvas: HTMLCanvasElement) => void;
  gridSize?: number; // Must be odd (5, 7, 9)
  previewSize?: number;
  accentColor?: string;
}

interface GridPosition {
  x: number;
  y: number;
  z: number;
  address: string;
  isCenter: boolean;
}

// Address offsets for each axis - creates orthogonal exploration dimensions
const AXIS_OFFSETS = {
  x: 1n,           // Tiny variations
  y: 256n,         // Medium jumps
  z: 65536n,       // Large jumps
};

export function NeighborhoodExplorer({
  currentAddress,
  onSelectAddress,
  renderPreview,
  gridSize = 5,
  previewSize = 64,
  accentColor = '#ff3366',
}: NeighborhoodExplorerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const texturesRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());
  const highlightMeshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const [hoveredAddress, setHoveredAddress] = useState<string | null>(null);
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0, z: 0 });
  
  // Key to force re-render of textures when renderPreview changes
  const [textureKey, setTextureKey] = useState(0);
  
  // Force texture regeneration when renderPreview changes
  useEffect(() => {
    // Clear texture cache when render function changes
    texturesRef.current.forEach(texture => texture.dispose());
    texturesRef.current.clear();
    setTextureKey(prev => prev + 1);
  }, [renderPreview]);
  
  const half = Math.floor(gridSize / 2);
  
  // Generate grid positions based on current view position
  const gridPositions = useMemo(() => {
    const positions: GridPosition[] = [];
    
    for (let x = -half; x <= half; x++) {
      for (let y = -half; y <= half; y++) {
        for (let z = -half; z <= half; z++) {
          // Calculate address offset from current
          const totalOffset = 
            BigInt(x + viewPosition.x) * AXIS_OFFSETS.x +
            BigInt(y + viewPosition.y) * AXIS_OFFSETS.y +
            BigInt(z + viewPosition.z) * AXIS_OFFSETS.z;
          
          const address = offsetAddress(currentAddress, totalOffset);
          const isCenter = x === 0 && y === 0 && z === 0 && 
                          viewPosition.x === 0 && viewPosition.y === 0 && viewPosition.z === 0;
          
          positions.push({ x, y, z, address, isCenter });
        }
      }
    }
    
    return positions;
  }, [currentAddress, viewPosition, half]);
  
  // Generate preview texture for an address
  const getTexture = useCallback((address: string): THREE.CanvasTexture => {
    const cacheKey = `${address}-${textureKey}`;
    if (texturesRef.current.has(cacheKey)) {
      return texturesRef.current.get(cacheKey)!;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = previewSize;
    canvas.height = previewSize;
    
    renderPreview(address, canvas);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texturesRef.current.set(cacheKey, texture);
    
    return texture;
  }, [renderPreview, previewSize, textureKey]);
  
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
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(gridSize * 1.5, gridSize * 1.2, gridSize * 1.5);
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
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    
    // Axis lines
    const axisLength = gridSize + 2;
    
    // X axis (red)
    const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.5 });
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLength, 0, 0),
      new THREE.Vector3(axisLength, 0, 0),
    ]);
    scene.add(new THREE.Line(xAxisGeometry, xAxisMaterial));
    
    // Y axis (green)
    const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.5 });
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -axisLength, 0),
      new THREE.Vector3(0, axisLength, 0),
    ]);
    scene.add(new THREE.Line(yAxisGeometry, yAxisMaterial));
    
    // Z axis (blue)
    const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x4444ff, transparent: true, opacity: 0.5 });
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -axisLength),
      new THREE.Vector3(0, 0, axisLength),
    ]);
    scene.add(new THREE.Line(zAxisGeometry, zAxisMaterial));
    
    // Create highlight ring for center/current
    const highlightGeometry = new THREE.RingGeometry(0.55, 0.65, 32);
    const highlightMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(accentColor),
      side: THREE.DoubleSide,
    });
    const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlightMesh.visible = false;
    scene.add(highlightMesh);
    highlightMeshRef.current = highlightMesh;
    
    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
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
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      // Clean up textures
      texturesRef.current.forEach(texture => texture.dispose());
      texturesRef.current.clear();
      meshesRef.current.clear();
    };
  }, [gridSize, accentColor]);
  
  // Update meshes when grid positions change
  useEffect(() => {
    const scene = sceneRef.current;
    const highlightMesh = highlightMeshRef.current;
    if (!scene) return;
    
    // Track which addresses we need
    const neededAddresses = new Set(gridPositions.map(p => `${p.address}-${textureKey}`));
    
    // Remove meshes that are no longer needed
    meshesRef.current.forEach((mesh, key) => {
      if (!neededAddresses.has(key)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        meshesRef.current.delete(key);
      }
    });
    
    // Add or update meshes
    const spacing = 1.3;
    const planeSize = 1;
    
    gridPositions.forEach(({ x, y, z, address, isCenter }) => {
      const meshKey = `${address}-${textureKey}`;
      let mesh = meshesRef.current.get(meshKey);
      
      if (!mesh) {
        const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const texture = getTexture(address);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });
        
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData.address = address;
        scene.add(mesh);
        meshesRef.current.set(meshKey, mesh);
      }
      
      // Position the mesh
      mesh.position.set(x * spacing, y * spacing, z * spacing);
      
      // Make planes face outward from center
      const cameraDir = new THREE.Vector3(1, 0.5, 1).normalize();
      mesh.lookAt(mesh.position.clone().add(cameraDir));
      
      // Highlight center (current address)
      if (isCenter) {
        mesh.scale.setScalar(1.3);
        
        // Position highlight ring behind center mesh
        if (highlightMesh) {
          highlightMesh.visible = true;
          highlightMesh.position.copy(mesh.position);
          highlightMesh.lookAt(mesh.position.clone().add(cameraDir));
          highlightMesh.position.add(cameraDir.clone().multiplyScalar(-0.05));
          highlightMesh.scale.setScalar(1.5);
        }
      } else {
        mesh.scale.setScalar(1);
      }
    });
  }, [gridPositions, getTexture, textureKey]);
  
  // Handle mouse move for hover detection
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;
    
    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const meshArray = Array.from(meshesRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(meshArray);
    
    if (intersects.length > 0) {
      const address = intersects[0].object.userData.address;
      setHoveredAddress(address);
      container.style.cursor = 'pointer';
    } else {
      setHoveredAddress(null);
      container.style.cursor = 'grab';
    }
  }, []);
  
  // Handle click to select
  const handleClick = useCallback((event: React.MouseEvent) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;
    
    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const meshArray = Array.from(meshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshArray);
    
    if (intersects.length > 0) {
      const address = intersects[0].object.userData.address;
      if (address) {
        // Reset view position when selecting a new address
        setViewPosition({ x: 0, y: 0, z: 0 });
        onSelectAddress(address);
      }
    }
  }, [onSelectAddress]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const step = e.shiftKey ? 5 : 1;
      
      switch (e.key.toLowerCase()) {
        case 'a':
          setViewPosition(p => ({ ...p, x: p.x - step }));
          break;
        case 'd':
          setViewPosition(p => ({ ...p, x: p.x + step }));
          break;
        case 'w':
          setViewPosition(p => ({ ...p, y: p.y + step }));
          break;
        case 's':
          setViewPosition(p => ({ ...p, y: p.y - step }));
          break;
        case 'q':
          setViewPosition(p => ({ ...p, z: p.z - step }));
          break;
        case 'e':
          setViewPosition(p => ({ ...p, z: p.z + step }));
          break;
        case 'r':
          // Reset to origin
          setViewPosition({ x: 0, y: 0, z: 0 });
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      {/* Controls header */}
      <div className="flex items-center justify-between p-3 bg-elevated border-b border-muted">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium" style={{ color: accentColor }}>
            3D Neighborhood Explorer
          </h3>
          <div className="text-xs text-subtle font-mono">
            Offset: ({viewPosition.x}, {viewPosition.y}, {viewPosition.z})
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-subtle">
          <span className="px-2 py-1 bg-surface rounded">WASD</span>
          <span>X/Y</span>
          <span className="px-2 py-1 bg-surface rounded">Q/E</span>
          <span>Z</span>
          <span className="px-2 py-1 bg-surface rounded">R</span>
          <span>Reset</span>
        </div>
      </div>
      
      {/* 3D viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      
      {/* Status bar */}
      <div className="p-2 bg-elevated border-t border-muted flex items-center justify-between text-xs">
        <div className="text-subtle">
          {gridSize}³ = {gridSize ** 3} previews • 
          Drag to orbit • Click to select • 
          <span style={{ color: accentColor }}> Ring = Current</span>
        </div>
        {hoveredAddress && (
          <div className="font-mono text-text">
            Click: 0x{hoveredAddress.slice(0, 12)}...
          </div>
        )}
      </div>
    </div>
  );
}
