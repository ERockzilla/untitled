import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MathNatureBackground } from './components/background/MathNatureBackground';
import { useEasterEggs } from './lib/useEasterEggs';

// Lazy load all heavy components for code splitting
// This reduces initial bundle from ~3.8MB to smaller on-demand chunks
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PixelCanvas = lazy(() => import('./pages/PixelCanvas').then(m => ({ default: m.PixelCanvas })));
const GeometricComposition = lazy(() => import('./pages/GeometricComposition').then(m => ({ default: m.GeometricComposition })));
const VoxelSpace = lazy(() => import('./pages/VoxelSpace').then(m => ({ default: m.VoxelSpace })));
const ParametricCurves = lazy(() => import('./pages/ParametricCurves').then(m => ({ default: m.ParametricCurves })));
const TilePatterns = lazy(() => import('./pages/TilePatterns').then(m => ({ default: m.TilePatterns })));
const LEDMatrix = lazy(() => import('./pages/LEDMatrix').then(m => ({ default: m.LEDMatrix })));
const GamesHub = lazy(() => import('./pages/GamesHub').then(m => ({ default: m.GamesHub })));
const PuzzleGame = lazy(() => import('./pages/PuzzleGame').then(m => ({ default: m.PuzzleGame })));
const TetrisPage = lazy(() => import('./pages/TetrisPage').then(m => ({ default: m.TetrisPage })));
const SudokuPage = lazy(() => import('./pages/SudokuPage').then(m => ({ default: m.SudokuPage })));
const WordSearchPage = lazy(() => import('./pages/WordSearchPage').then(m => ({ default: m.WordSearchPage })));
const WordlePage = lazy(() => import('./pages/WordlePage').then(m => ({ default: m.WordlePage })));
const MazeSelection = lazy(() => import('./pages/MazeSelection').then(m => ({ default: m.MazeSelection })));
const MazePlay = lazy(() => import('./pages/MazePlay').then(m => ({ default: m.MazePlay })));
const VoxelTetrisPage = lazy(() => import('./pages/VoxelTetrisPage').then(m => ({ default: m.VoxelTetrisPage })));
const TiltCalibration = lazy(() => import('./pages/TiltCalibration').then(m => ({ default: m.TiltCalibration })));
const Scratchpad = lazy(() => import('./pages/Scratchpad').then(m => ({ default: m.Scratchpad })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-subtle text-sm">Loading...</span>
      </div>
    </div>
  );
}

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
  // 🎮 Enable site-wide easter eggs (Konami code, etc.)
  useEasterEggs();

  return (
    <>
      {/* Mathematical matrix-style animated background */}
      <MathNatureBackground opacity={0.18} speed={1} />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Smart redirect: only on first visit to d.rocksystems.cloud */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/pixel" element={<PixelCanvas />} />
          <Route path="/geometric" element={<GeometricComposition />} />
          <Route path="/voxel" element={<VoxelSpace />} />
          <Route path="/curves" element={<ParametricCurves />} />
          <Route path="/tiles" element={<TilePatterns />} />
          <Route path="/led" element={<LEDMatrix />} />

          {/* Games section */}
          <Route path="/games" element={<GamesHub />} />
          <Route path="/games/puzzles" element={<PuzzleGame />} />
          <Route path="/games/tetris" element={<TetrisPage />} />
          <Route path="/games/voxel-tetris" element={<VoxelTetrisPage />} />
          <Route path="/games/sudoku" element={<SudokuPage />} />
          <Route path="/games/word-search" element={<WordSearchPage />} />
          <Route path="/games/wordle" element={<WordlePage />} />

          {/* Redirects from old puzzle routes */}
          <Route path="/puzzle" element={<Navigate to="/games" replace />} />
          <Route path="/puzzle/play" element={<Navigate to="/games/puzzles" replace />} />

          {/* Maze section */}
          <Route path="/maze" element={<MazeSelection />} />
          <Route path="/maze/calibrate" element={<TiltCalibration />} />
          <Route path="/maze/play" element={<MazePlay />} />

          {/* Hidden routes - unlisted, discoverable via headers */}
          <Route path="/s" element={<Scratchpad />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
