import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PixelCanvas } from './pages/PixelCanvas';
import { GeometricComposition } from './pages/GeometricComposition';
import { VoxelSpace } from './pages/VoxelSpace';
import { ParametricCurves } from './pages/ParametricCurves';
import { TilePatterns } from './pages/TilePatterns';
import { LEDMatrix } from './pages/LEDMatrix';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
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
