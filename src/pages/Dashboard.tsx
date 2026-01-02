import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { persistence } from '../lib/persistence';
import type { LibraryState } from '../lib/persistence';
import { randomAddress } from '../lib/babel-core';
import { useTheme } from '../lib/ThemeContext';
import { PixelCanvasPreview } from '../components/pixel/PixelCanvasRenderer';
import { GeometricPreview } from '../components/geometric/GeometricRenderer';
import { VoxelPreview } from '../components/voxel/VoxelRenderer';
import { CurvePreview } from '../components/curves/CurveRenderer';
import { TilePreview } from '../components/tiles/TileRenderer';
import { LEDMatrixPreview } from '../components/led/LEDMatrixRenderer';
import mazePreview from '../assets/maze.png';

interface LibraryCard {
  id: string;
  title: string;
  description: string;
  path: string;
  color: string;
  PreviewComponent: React.ComponentType<{ address: string }>;
}

const libraries: LibraryCard[] = [
  {
    id: 'pixel',
    title: 'Pixel Canvas',
    description: 'Every possible 16×16 image with 16 colors',
    path: '/pixel',
    color: 'var(--color-pixel)',
    PreviewComponent: PixelCanvasPreview,
  },
  {
    id: 'geo',
    title: 'Geometric',
    description: 'Infinite compositions of shapes and colors',
    path: '/geometric',
    color: 'var(--color-geo)',
    PreviewComponent: GeometricPreview,
  },
  {
    id: 'voxel',
    title: 'Voxel Space',
    description: '3D sculptures in a 6×6×6 grid',
    path: '/voxel',
    color: 'var(--color-voxel)',
    PreviewComponent: VoxelPreview,
  },
  {
    id: 'curve',
    title: 'Parametric Curves',
    description: 'Elegant bezier curve compositions',
    path: '/curves',
    color: 'var(--color-curve)',
    PreviewComponent: CurvePreview,
  },
  {
    id: 'tile',
    title: 'Tile Patterns',
    description: 'Symmetric tessellations and mosaics',
    path: '/tiles',
    color: 'var(--color-tile)',
    PreviewComponent: TilePreview,
  },
  {
    id: 'led',
    title: 'LED Matrix',
    description: 'Animated LED displays and text marquees',
    path: '/led',
    color: 'var(--color-led)',
    PreviewComponent: LEDMatrixPreview,
  },
];

export function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [states, setStates] = useState<Record<string, LibraryState>>({});
  const [previewAddresses, setPreviewAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    persistence.getAll().then(setStates);

    // Generate preview addresses for libraries without saved state
    const addresses: Record<string, string> = {};
    libraries.forEach(lib => {
      addresses[lib.id] = randomAddress(64);
    });
    setPreviewAddresses(addresses);
  }, []);

  const getPreviewAddress = (libId: string) => {
    return states[libId]?.currentAddress || previewAddresses[libId] || randomAddress(64);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-void via-abyss to-surface" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-40 right-40 w-48 h-48 bg-tertiary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Theme toggle button - top right */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 z-10 w-11 h-11 rounded-xl bg-surface/80 backdrop-blur border border-elevated hover:border-muted transition-all flex items-center justify-center text-subtle hover:text-text theme-toggle"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
            <span className="text-gradient">Untitled</span>
          </h1>

          {/* Quick stats */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">6</div>
              <div className="text-sm text-subtle">Libraries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#f59e0b' }}>6</div>
              <div className="text-sm text-subtle">Games</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">∞</div>
              <div className="text-sm text-subtle">Fun</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-tertiary">
                {Object.keys(states).length}
              </div>
              <div className="text-sm text-subtle">Explored</div>
            </div>
          </div>
        </div>
      </header>

      {/* Library Cards */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-text">Explore Libraries</h2>
          <button
            onClick={() => {
              const addresses: Record<string, string> = {};
              libraries.forEach(lib => {
                addresses[lib.id] = randomAddress(64);
              });
              setPreviewAddresses(addresses);
            }}
            className="px-4 py-2 bg-elevated hover:bg-muted rounded-lg text-sm text-subtle hover:text-text transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Shuffle Previews
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraries.map((lib) => {
            const state = states[lib.id];
            const hasProgress = state?.currentAddress;
            const address = getPreviewAddress(lib.id);

            return (
              <Link
                key={lib.id}
                to={lib.path}
                className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                {/* Preview area */}
                <div
                  className="h-48 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: `color-mix(in srgb, ${lib.color} 5%, var(--color-void))` }}
                >
                  <div className="w-36 h-36 transition-transform duration-300 group-hover:scale-110">
                    <lib.PreviewComponent address={address} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: lib.color }}
                    />
                    <h3 className="text-lg font-semibold text-text">{lib.title}</h3>
                  </div>
                  <p className="text-sm text-subtle">{lib.description}</p>

                  {hasProgress && (
                    <div className="mt-4 pt-4 border-t border-elevated flex items-center justify-between">
                      <p className="text-xs text-subtle">
                        Last visited: {new Date(state.lastVisited).toLocaleDateString()}
                      </p>
                      {state.favorites.length > 0 && (
                        <p className="text-xs text-accent flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {state.favorites.length}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Hover accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                  style={{ backgroundColor: lib.color }}
                />
              </Link>
            );
          })}
        </div>

        {/* Interactive Games Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-text mb-8">Interactive Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Puzzles Card */}
            <Link
              to="/games/puzzles"
              className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className="h-48 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, #06b6d4 5%, var(--color-void))' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20 text-cyan-400 transition-transform duration-300 group-hover:scale-110">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.313-.687.75-.687.438 0 .75.332.75.687v.668c0 .11.045.216.125.295l.554.554c.08.08.186.125.295.125h.668c.355 0 .687.313.687.75s-.332.75-.687.75h-.668a.418.418 0 00-.295.125l-.554.554a.418.418 0 00-.125.295v.668c0 .355-.313.687-.75.687-.438 0-.75-.332-.75-.687v-.668a.418.418 0 00-.125-.295l-.554-.554a.418.418 0 00-.295-.125h-.668c-.355 0-.687-.313-.687-.75s.332-.75.687-.75h.668c.11 0 .216-.045.295-.125l.554-.554c.08-.08.125-.186.125-.295v-.668z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />
                </svg>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06b6d4' }} />
                  <h3 className="text-lg font-semibold text-text">Puzzles</h3>
                </div>
                <p className="text-sm text-subtle">Classic jigsaw and sliding tile puzzles</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: '#06b6d4' }} />
            </Link>

            {/* Tetris Card */}
            <Link
              to="/games/tetris"
              className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className="h-48 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, #f43f5e 5%, var(--color-void))' }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-20 h-20 text-rose-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <rect x="4" y="2" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
                  <rect x="8" y="2" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
                  <rect x="12" y="2" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
                  <rect x="16" y="2" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
                  <rect x="4" y="6" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
                  <rect x="8" y="6" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8" />
                  <rect x="12" y="6" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
                  <rect x="8" y="10" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
                  <rect x="12" y="10" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
                  <rect x="8" y="14" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
                  <rect x="12" y="14" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
                  <rect x="8" y="18" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f43f5e' }} />
                  <h3 className="text-lg font-semibold text-text">Tetris</h3>
                </div>
                <p className="text-sm text-subtle">Classic falling blocks - clear lines and chase high scores</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: '#f43f5e' }} />
            </Link>

            {/* Sudoku Card */}
            <Link
              to="/games/sudoku"
              className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className="h-48 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, #8b5cf6 5%, var(--color-void))' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20 text-purple-400 transition-transform duration-300 group-hover:scale-110">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <text x="5.5" y="7.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">1</text>
                  <text x="11" y="13.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">5</text>
                  <text x="17" y="19.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">9</text>
                </svg>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                  <h3 className="text-lg font-semibold text-text">Sudoku</h3>
                </div>
                <p className="text-sm text-subtle">Fill the 9×9 grid with numbers 1-9 in every row, column, and box</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: '#8b5cf6' }} />
            </Link>

            {/* Word Search Card */}
            <Link
              to="/games/word-search"
              className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className="h-48 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, #10b981 5%, var(--color-void))' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-20 h-20 text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                  <rect x="3" y="3" width="14" height="14" rx="2" />
                  <text x="5" y="9" fontSize="3.5" fill="currentColor" stroke="none" fontFamily="monospace">WOR</text>
                  <text x="5" y="13" fontSize="3.5" fill="currentColor" stroke="none" fontFamily="monospace">XDS</text>
                  <circle cx="18" cy="18" r="4" strokeWidth="2" />
                  <line x1="20.5" y1="20.5" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                  <h3 className="text-lg font-semibold text-text">Word Search</h3>
                </div>
                <p className="text-sm text-subtle">Find hidden words in a grid of letters</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: '#10b981' }} />
            </Link>

            {/* Wordle Card */}
            <Link
              to="/games/wordle"
              className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className="h-48 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, #eab308 5%, var(--color-void))' }}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-24 h-16 transition-transform duration-300 group-hover:scale-110">
                  <rect x="1" y="8" width="4.5" height="4.5" rx="0.5" fill="#6aaa64" />
                  <rect x="6" y="8" width="4.5" height="4.5" rx="0.5" fill="#c9b458" />
                  <rect x="11" y="8" width="4.5" height="4.5" rx="0.5" fill="#787c7e" />
                  <rect x="16" y="8" width="4.5" height="4.5" rx="0.5" fill="#6aaa64" />
                  <text x="2.25" y="11.5" fontSize="3" fill="white" fontWeight="bold" textAnchor="middle">W</text>
                  <text x="8.25" y="11.5" fontSize="3" fill="white" fontWeight="bold" textAnchor="middle">O</text>
                  <text x="13.25" y="11.5" fontSize="3" fill="white" fontWeight="bold" textAnchor="middle">R</text>
                  <text x="18.25" y="11.5" fontSize="3" fill="white" fontWeight="bold" textAnchor="middle">D</text>
                </svg>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }} />
                  <h3 className="text-lg font-semibold text-text">Wordle</h3>
                </div>
                <p className="text-sm text-subtle">Guess the 5-letter word in 6 tries with color hints</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: '#eab308' }} />
            </Link>

            {/* Maze Runner Card */}
            <Link
              to="/maze"
              className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div
                className="h-48 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 5%, var(--color-void))' }}
              >
                <img
                  src={mazePreview}
                  alt="Maze Runner Preview"
                  className="w-32 h-32 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                  <h3 className="text-lg font-semibold text-text">Maze Runner</h3>
                </div>
                <p className="text-sm text-subtle">Navigate procedural mazes with tilt controls or touch</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ backgroundColor: '#f59e0b' }} />
            </Link>

          </div>
        </div>
      </main>

      {/* About Section */}
      <section className="border-t border-elevated">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-6 text-text">About</h2>
          <div className="space-y-4">
            <p className="text-subtle leading-relaxed">
              This is a highly sophisticated, cloud-native, AWS-powered digital playground
              designed specifically for DRock's Birthday. It serves as a "visual workspace"
              to experiment with UI, interactivity, and design, but mostly, it serves as a
              digital monument to how cool my big sister is. Check out the VIP experience at{' '}
              <a
                href="https://d.rocksystems.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-secondary underline underline-offset-2 transition-colors"
              >
                d.rocksystems.cloud
              </a>.
            </p>

            {/* Address vs Visual Space */}
            <div className="mt-8 p-5 bg-surface rounded-xl border border-elevated">
              <h3 className="font-semibold text-text mb-3">Address Space vs Visual Space</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-accent font-mono text-lg">2^256 ≈ 10^77</div>
                  <div className="text-subtle">Possible addresses (64 hex chars)</div>
                </div>
                <div>
                  <div className="text-secondary font-mono text-lg">10^63 — 10^315</div>
                  <div className="text-subtle">Visual possibilities (varies by library)</div>
                </div>
              </div>
              <p className="text-xs text-subtle mt-3">
                Some libraries have more possible visuals than addresses—not every image is reachable.
                Others have fewer, meaning every possibility has a unique address. Settings like grid size
                and symmetry create parallel "dimensions" where the same address produces different results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-surface rounded-xl border border-elevated">
                <h3 className="font-semibold text-text mb-2">Deterministic</h3>
                <p className="text-sm text-subtle">
                  Every address produces the same image, every time. Nothing is stored—it's all generated.
                </p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-elevated">
                <h3 className="font-semibold text-text mb-2">Navigable</h3>
                <p className="text-sm text-subtle">
                  Browse adjacent addresses to see nearby variations, or jump to any location in the library.
                </p>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-elevated">
                <h3 className="font-semibold text-text mb-2">Settings = Dimensions</h3>
                <p className="text-sm text-subtle">
                  Changing grid size or symmetry accesses a parallel library with the same addresses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-elevated py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-6">
            <span className="text-3xl">🎂</span>
          </div>
          <p className="text-lg text-text font-medium mb-2">
            Made with ❤️ for DRock
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/ERockzilla/untitled"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-elevated hover:bg-muted rounded-lg text-subtle hover:text-text transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://d.rocksystems.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg text-accent hover:text-secondary transition-colors"
            >
              <span>👑</span>
              VIP Lounge
            </a>
          </div>
          <p className="mt-8 text-xs text-muted">
            Every possible combination exists. You just have to find it.
          </p>
        </div>
      </footer>
    </div>
  );
}
