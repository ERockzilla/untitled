import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PixelCanvas } from './pages/PixelCanvas';
import { GeometricComposition } from './pages/GeometricComposition';
import { VoxelSpace } from './pages/VoxelSpace';
import { ParametricCurves } from './pages/ParametricCurves';
import { TilePatterns } from './pages/TilePatterns';
import { LEDMatrix } from './pages/LEDMatrix';
import { GamesHub } from './pages/GamesHub';
import { PuzzleGame } from './pages/PuzzleGame';
import { TetrisPage } from './pages/TetrisPage';
import { SudokuPage } from './pages/SudokuPage';
import { WordSearchPage } from './pages/WordSearchPage';
import { WordlePage } from './pages/WordlePage';
import { MazeSelection } from './pages/MazeSelection';
import { MazePlay } from './pages/MazePlay';
import { TiltCalibration } from './pages/TiltCalibration';
import { MathNatureBackground } from './components/background/MathNatureBackground';
import { Scratchpad } from './pages/Scratchpad';
import { useEasterEggs } from './lib/useEasterEggs';

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
    </>
  );
}

export default App;

