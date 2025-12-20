import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PixelCanvas } from './pages/PixelCanvas';
import { GeometricComposition } from './pages/GeometricComposition';
import { VoxelSpace } from './pages/VoxelSpace';
import { ParametricCurves } from './pages/ParametricCurves';
import { TilePatterns } from './pages/TilePatterns';
import { LEDMatrix } from './pages/LEDMatrix';

// Check if we're on the DRock VIP subdomain
const isDRockDomain = window.location.hostname.startsWith('d.');

// Track if we've already done the initial redirect (avoids navigation trap)
let hasRedirected = false;

// Component to handle the conditional redirect
function HomeRoute() {
  const location = useLocation();

  // Only redirect on initial visit to d.rocksystems.cloud
  // After that, allow normal navigation to Dashboard
  if (isDRockDomain && !hasRedirected && location.key === 'default') {
    hasRedirected = true;
    return <Navigate to="/led" replace />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      {/* Smart redirect: only on first visit to d.rocksystems.cloud */}
      <Route path="/" element={<HomeRoute />} />
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

