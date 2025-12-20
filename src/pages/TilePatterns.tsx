import { useState, useMemo } from 'react';
import { LibraryLayout } from '../components/library/LibraryLayout';
import { useLibraryState } from '../components/library/useLibraryState';
import { TileRenderer } from '../components/tiles/TileRenderer';
import type { SymmetryMode } from '../components/tiles/TileRenderer';
import { TILE_PALETTE_16 } from '../lib/palettes';
import { getTileSpaceInfo } from '../lib/combinatorics';

const SYMMETRY_OPTIONS: { value: SymmetryMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'quad', label: '4-Way Mirror' },
];

const SIZE_OPTIONS = [4, 6, 8, 10, 12];

export function TilePatterns() {
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
  } = useLibraryState({ pageId: 'tile', addressLength: 64 });

  const [symmetry, setSymmetry] = useState<SymmetryMode>(
    (settings.symmetry as SymmetryMode) || 'quad'
  );
  const [gridSize, setGridSize] = useState((settings.gridSize as number) || 8);

  const spaceInfo = useMemo(
    () => getTileSpaceInfo(gridSize, 8, 4, TILE_PALETTE_16.length, symmetry),
    [gridSize, symmetry]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-subtle">Loading...</div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-6">
      {/* Symmetry Mode */}
      <div>
        <label className="block text-sm font-medium text-text mb-3">
          Symmetry Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SYMMETRY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSymmetry(option.value);
                updateSettings({ symmetry: option.value });
              }}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${symmetry === option.value
                ? 'bg-tile text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Size */}
      <div>
        <label className="block text-sm font-medium text-text mb-3">
          Grid Size: {gridSize}×{gridSize}
        </label>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => {
                setGridSize(size);
                updateSettings({ gridSize: size });
              }}
              className={`flex-1 px-2 py-2 rounded-lg text-sm transition-all ${gridSize === size
                ? 'bg-tile text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
                }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Tile Types Legend */}
      <div>
        <label className="block text-sm font-medium text-text mb-3">
          Tile Types
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Solid', preview: '■' },
            { name: 'Diagonal', preview: '◢' },
            { name: 'Diagonal R', preview: '◣' },
            { name: 'Arc', preview: '◠' },
            { name: 'Arc R', preview: '◡' },
            { name: 'H-Stripe', preview: '≡' },
            { name: 'V-Stripe', preview: '|||' },
            { name: 'Check', preview: '▚' },
          ].map((tile, i) => (
            <div
              key={i}
              className="p-2 bg-elevated rounded text-center text-xs"
              title={tile.name}
            >
              <div className="text-lg mb-1">{tile.preview}</div>
              <div className="text-subtle truncate">{tile.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Palette Preview */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Color Palette
        </label>
        <div className="grid grid-cols-8 gap-1">
          {TILE_PALETTE_16.map((color, i) => (
            <div
              key={i}
              className="aspect-square rounded"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">Library Info</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-subtle">Grid Size:</dt>
            <dd className="text-text font-mono">{gridSize}×{gridSize}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Tile Types:</dt>
            <dd className="text-text font-mono">8 × 4 rotations</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Colors:</dt>
            <dd className="text-text font-mono">{TILE_PALETTE_16.length} (2 per tile)</dd>
          </div>
        </dl>

        <div className="mt-3 pt-3 border-t border-muted">
          <h4 className="text-xs font-medium text-text mb-1">Combinatorics</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Visual Space:</dt>
              <dd className="text-tile font-mono">{spaceInfo.visualSpace}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle">Address Space:</dt>
              <dd className="text-text font-mono">{spaceInfo.addressSpace}</dd>
            </div>
          </dl>
          <p className="text-xs text-subtle mt-2 leading-relaxed">
            {spaceInfo.explanation}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-subtle space-y-1">
        <p>• Symmetry creates balanced compositions</p>
        <p>• Tiles combine rotation and color pairs</p>
        <p>• Try different grid sizes for variety</p>
      </div>
    </div>
  );

  return (
    <LibraryLayout
      title="Tile Patterns"
      description="Symmetric tessellations and mosaics"
      address={address}
      onAddressChange={setAddress}
      onRandom={goRandom}
      onPrev={goPrev}
      onNext={goNext}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accentColor="var(--color-tile)"
      controls={controls}
    >
      <div className="flex items-center gap-4 h-full">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 flex"
          title="Previous Pattern"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className="flex-1 aspect-square relative group">
          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
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

          <div className="w-full h-full bg-surface rounded-2xl border border-elevated flex items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-lg aspect-square">
              <TileRenderer
                address={address}
                size={gridSize}
                symmetry={symmetry}
                palette={TILE_PALETTE_16}
                className="w-full h-full rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 flex"
          title="Next Pattern"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </LibraryLayout>
  );
}
