import { useState, useCallback, useMemo } from 'react';
import { LibraryLayout } from '../components/library/LibraryLayout';
import { useLibraryState } from '../components/library/useLibraryState';
import { PixelCanvasRenderer, addressToPixels, pixelsToAddress } from '../components/pixel/PixelCanvasRenderer';
import { NeighborhoodExplorer } from '../components/explorer/NeighborhoodExplorer';
import { PIXEL_PALETTE_16 } from '../lib/palettes';
import { getPixelSpaceInfo } from '../lib/combinatorics';
import { seededRandom } from '../lib/random';

type ViewMode = 'canvas' | 'explorer';

// Generate shades of a color
function generateShades(hexColor: string, count: number = 4): string[] {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.3 + (i / (count - 1)) * 0.7; // 30% to 100% brightness
    const sr = Math.round(r * factor);
    const sg = Math.round(g * factor);
    const sb = Math.round(b * factor);
    shades.push(`#${sr.toString(16).padStart(2, '0')}${sg.toString(16).padStart(2, '0')}${sb.toString(16).padStart(2, '0')}`);
  }
  return shades;
}

export function PixelCanvas() {
  const {
    address,
    isLoading,
    isFavorite,
    settings,
    setAddress,
    goRandom,
    goNext,
    goPrev,
    toggleFavorite,
    updateSettings,
  } = useLibraryState({ pageId: 'pixel', addressLength: 64 });

  const [zoom, setZoom] = useState((settings.zoom as number) || 1);
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');

  // Selected colors for filtering - default to ALL colors selected
  const [explorerColors, setExplorerColors] = useState<Set<number>>(() =>
    new Set((settings.explorerColors as number[]) || PIXEL_PALETTE_16.map((_, i) => i))
  );
  const [useShades, setUseShades] = useState((settings.useShades as boolean) ?? true);

  const size = 16;
  const colors = 16;
  const spaceInfo = useMemo(() => getPixelSpaceInfo(size, colors), []);

  // Build filtered palette for CANVAS (no shades, just active colors)
  const canvasPalette = useMemo(() => {
    const selectedIndices = Array.from(explorerColors);
    if (selectedIndices.length === 0) {
      return PIXEL_PALETTE_16;
    }
    return selectedIndices.map(idx => PIXEL_PALETTE_16[idx]);
  }, [explorerColors]);

  // Build filtered palette for EXPLORER (with optional shades)
  const explorerPalette = useMemo(() => {
    const selectedIndices = Array.from(explorerColors);
    if (selectedIndices.length === 0) {
      return PIXEL_PALETTE_16;
    }

    if (useShades) {
      const allShades: string[] = [];
      selectedIndices.forEach(idx => {
        const baseColor = PIXEL_PALETTE_16[idx];
        allShades.push(...generateShades(baseColor, 4));
      });
      return allShades;
    } else {
      return selectedIndices.map(idx => PIXEL_PALETTE_16[idx]);
    }
  }, [explorerColors, useShades]);

  // Toggle a color in explorer selection
  const toggleExplorerColor = useCallback((index: number) => {
    setExplorerColors(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        if (next.size > 1) {
          next.delete(index);
        }
      } else {
        next.add(index);
      }
      updateSettings({ explorerColors: Array.from(next) });
      return next;
    });
  }, [updateSettings]);

  // Select all colors
  const selectAllColors = useCallback(() => {
    const all = new Set(PIXEL_PALETTE_16.map((_, i) => i));
    setExplorerColors(all);
    updateSettings({ explorerColors: Array.from(all) });
  }, [updateSettings]);

  // Handle pixel click - toggle to selected color
  const handlePixelClick = useCallback((x: number, y: number) => {
    const pixels = addressToPixels(address, size, colors);
    pixels[y][x] = (pixels[y][x] + 1) % colors;
    const newAddress = pixelsToAddress(pixels, colors, 64);
    setAddress(newAddress);
  }, [address, setAddress]);

  // Handle zoom change
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    updateSettings({ zoom: newZoom });
  };

  // Render preview for neighborhood explorer with filtered palette
  // This needs to be a stable function that captures the current palette
  const renderPreview = useMemo(() => {
    const palette = explorerPalette;
    return (previewAddress: string, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const prng = seededRandom(previewAddress);
      const pixelSize = canvas.width / size;

      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const colorIndex = Math.floor(prng() * palette.length);
          ctx.fillStyle = palette[colorIndex];
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    };
  }, [explorerPalette]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-subtle">Loading...</div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          View Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${viewMode === 'canvas'
              ? 'bg-pixel text-void font-medium'
              : 'bg-elevated text-text hover:bg-muted'
              }`}
          >
            Canvas
          </button>
          <button
            onClick={() => setViewMode('explorer')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${viewMode === 'explorer'
              ? 'bg-pixel text-void font-medium'
              : 'bg-elevated text-text hover:bg-muted'
              }`}
          >
            3D Explorer
          </button>
        </div>
      </div>

      {/* Canvas-specific controls */}
      {viewMode === 'canvas' && (
        <>
          {/* Zoom Control */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Zoom: {zoom}x
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-pixel"
            />
          </div>

          {/* Active Colors Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">
                Active Colors ({explorerColors.size})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllColors}
                  className="text-xs text-pixel hover:underline"
                >
                  All
                </button>
                <button
                  onClick={() => {
                    const first = new Set([0]);
                    setExplorerColors(first);
                    updateSettings({ explorerColors: [0] });
                  }}
                  className="text-xs text-subtle hover:text-text hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {PIXEL_PALETTE_16.map((color, i) => (
                <button
                  key={i}
                  onClick={() => toggleExplorerColor(i)}
                  className={`w-8 h-8 rounded border-2 transition-all relative ${explorerColors.has(i)
                    ? 'border-white scale-110 ring-2 ring-pixel ring-offset-1 ring-offset-void'
                    : 'border-transparent opacity-30 hover:opacity-70'
                    }`}
                  style={{ backgroundColor: color }}
                  title={`Color ${i} - Click to ${explorerColors.has(i) ? 'deactivate' : 'activate'}`}
                >
                  {!explorerColors.has(i) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[2px] bg-red-500/70 rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-subtle mt-2">
              Click colors to toggle. Canvas shows only active colors.
            </p>
          </div>
        </>
      )}

      {/* Explorer-specific controls */}
      {viewMode === 'explorer' && (
        <>
          {/* Explorer Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">
                Explorer Palette ({explorerColors.size} colors)
              </label>
              <button
                onClick={selectAllColors}
                className="text-xs text-pixel hover:underline"
              >
                Select All
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {PIXEL_PALETTE_16.map((color, i) => (
                <button
                  key={i}
                  onClick={() => toggleExplorerColor(i)}
                  className={`w-8 h-8 rounded border-2 transition-all ${explorerColors.has(i)
                    ? 'border-white scale-110 ring-2 ring-pixel ring-offset-1 ring-offset-void'
                    : 'border-transparent opacity-40 hover:opacity-70'
                    }`}
                  style={{ backgroundColor: color }}
                  title={`Color ${i}${explorerColors.has(i) ? ' (selected)' : ''}`}
                />
              ))}
            </div>
            <p className="text-xs text-subtle mt-2">
              Fewer colors = more coherent patterns
            </p>
          </div>

          {/* Shades toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useShades}
                onChange={(e) => {
                  setUseShades(e.target.checked);
                  updateSettings({ useShades: e.target.checked });
                }}
                className="w-4 h-4 rounded bg-elevated border-muted accent-pixel"
              />
              <span className="text-sm text-text">Generate shades</span>
            </label>
            <p className="text-xs text-subtle mt-1 ml-7">
              4 brightness levels per color
            </p>
          </div>

          {/* Explorer Navigation Info */}
          <div className="p-4 bg-elevated rounded-lg">
            <h3 className="text-sm font-medium text-text mb-2">Navigation</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono">X:</span>
                <span className="text-subtle">±1 step (A/D)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-mono">Y:</span>
                <span className="text-subtle">±256 steps (W/S)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono">Z:</span>
                <span className="text-subtle">±65K steps (Q/E)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">Library Info</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-subtle">Grid:</dt>
            <dd className="text-text font-mono">{size}×{size}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Colors:</dt>
            <dd className="text-text font-mono">{colors}</dd>
          </div>
          {viewMode === 'explorer' && (
            <div className="flex justify-between">
              <dt className="text-subtle">Explorer Palette:</dt>
              <dd className="text-pixel font-mono">{explorerPalette.length}</dd>
            </div>
          )}
        </dl>

        <div className="mt-3 pt-3 border-t border-muted">
          <h4 className="text-xs font-medium text-text mb-1">Combinatorics</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Visual Space:</dt>
              <dd className="text-pixel font-mono">{spaceInfo.visualSpace}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle">Address Space:</dt>
              <dd className="text-text font-mono">{spaceInfo.addressSpace}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-subtle space-y-1">
        {viewMode === 'canvas' ? (
          <>
            <p>• Click pixels to cycle colors</p>
            <p>• Use ← → to browse adjacent images</p>
          </>
        ) : (
          <>
            <p>• Click any preview to select it</p>
            <p>• Highlighted = current address</p>
            <p>• Shift + key for 5x jumps</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <LibraryLayout
      title="Pixel Canvas"
      description="Every possible 16×16 image with 16 colors"
      address={address}
      onAddressChange={setAddress}
      onRandom={goRandom}
      onPrev={goPrev}
      onNext={goNext}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accentColor="var(--color-pixel)"
      controls={controls}
    >
      <div className="flex items-center gap-4 h-full">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 hidden md:flex"
          title="Previous Image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className="flex-1 aspect-square relative group">
          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={goRandom}
              className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all active:rotate-180"
              title="Random"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg
                className="w-5 h-5"
                fill={isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {viewMode === 'canvas' ? (
            <div className="w-full h-full bg-surface rounded-2xl border border-elevated flex items-center justify-center p-4 overflow-hidden relative">
              <div
                className="relative transition-all duration-300"
                style={{
                  width: `${Math.min(100, zoom * 50)}%`,
                  aspectRatio: '1',
                }}
              >
                <PixelCanvasRenderer
                  address={address}
                  size={size}
                  colors={canvasPalette.length}
                  zoom={zoom}
                  palette={canvasPalette}
                  onPixelClick={handlePixelClick}
                  className="w-full h-full rounded-lg shadow-2xl"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-surface rounded-2xl border border-elevated overflow-hidden relative">
              <NeighborhoodExplorer
                currentAddress={address}
                onSelectAddress={setAddress}
                renderPreview={renderPreview}
                gridSize={5}
                previewSize={64}
                accentColor="var(--color-pixel)"
              />
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 hidden md:flex"
          title="Next Image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </LibraryLayout>
  );
}
