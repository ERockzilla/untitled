import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PixelCanvas } from './pages/PixelCanvas';
import { GeometricComposition } from './pages/GeometricComposition';
import { VoxelSpace } from './pages/VoxelSpace';
import { ParametricCurves } from './pages/ParametricCurves';
import { TilePatterns } from './pages/TilePatterns';
import { LEDMatrix } from './pages/LEDMatrix';

// Check if we're on the DRock VIP subdomain
const isDRockDomain = window.location.hostname.startsWith('d.');

function App() {
  return (
    <Routes>
      {/* Redirect to /led on d.rocksystems.cloud, otherwise show Dashboard */}
      <Route path="/" element={isDRockDomain ? <Navigate to="/led" replace /> : <Dashboard />} />
      <Route path="/pixel" element={<PixelCanvas />} />
      <Route path="/geometric" element={<GeometricComposition />} />
      <Route path="/voxel" element={<VoxelSpace />} />
      <Route path="/curves" element={<ParametricCurves />} />
      <Route path="/tiles" element={<TilePatterns />} />
      <Route path="/led" element={<LEDMatrix />} />
    </Routes>
  );
}

export default App;
