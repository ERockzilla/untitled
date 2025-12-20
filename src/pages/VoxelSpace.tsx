import { useMemo } from 'react';
import { LibraryLayout } from '../components/library/LibraryLayout';
import { useLibraryState } from '../components/library/useLibraryState';
import { VoxelRenderer, addressToVoxels } from '../components/voxel/VoxelRenderer';
import { getVoxelSpaceInfo } from '../lib/combinatorics';

const VOXEL_COLORS = [
  { name: 'Empty', color: null },
  { name: 'Pink', color: '#ff3366' },
  { name: 'Teal', color: '#00d4aa' },
  { name: 'Purple', color: '#7c5cff' },
  { name: 'Yellow', color: '#ffcc00' },
  { name: 'Blue', color: '#00aaff' },
  { name: 'Orange', color: '#ff6b35' },
];

export function VoxelSpace() {
  const {
    address,
    isLoading,
    isFavorite,
    setAddress,
    goRandom,
    goNext,
    goPrev,
    toggleFavorite,
  } = useLibraryState({ pageId: 'voxel', addressLength: 64 });

  const size = 6;
  const colorCount = VOXEL_COLORS.length - 1; // exclude empty
  const spaceInfo = useMemo(() => getVoxelSpaceInfo(size, colorCount), []);

  // Calculate voxel statistics
  const stats = useMemo(() => {
    const grid = addressToVoxels(address, size);
    const colorCounts: Record<number, number> = {};
    let totalFilled = 0;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const colorIndex = grid.voxels[x][y][z];
          if (colorIndex > 0) {
            colorCounts[colorIndex] = (colorCounts[colorIndex] || 0) + 1;
            totalFilled++;
          }
        }
      }
    }

    return { colorCounts, totalFilled, totalVoxels: size * size * size };
  }, [address, size]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-subtle">Loading...</div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-6">
      {/* Controls hint */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">3D Controls</h3>
        <ul className="text-xs text-subtle space-y-1">
          <li>• Drag to rotate</li>
          <li>• Scroll to zoom</li>
          <li>• Right-drag to pan</li>
        </ul>
      </div>

      {/* Voxel Statistics */}
      <div>
        <label className="block text-sm font-medium text-text mb-3">
          Voxel Breakdown
        </label>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-subtle">Filled:</span>
            <span className="text-text font-mono">
              {stats.totalFilled} / {stats.totalVoxels}
            </span>
          </div>
          <div className="w-full h-2 bg-void rounded-full overflow-hidden">
            <div
              className="h-full bg-voxel rounded-full transition-all"
              style={{ width: `${(stats.totalFilled / stats.totalVoxels) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {VOXEL_COLORS.slice(1).map((item, i) => {
            const count = stats.colorCounts[i + 1] || 0;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: item.color || 'transparent' }}
                />
                <span className="text-subtle flex-1">{item.name}</span>
                <span className="text-text font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">Library Info</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-subtle">Grid Size:</dt>
            <dd className="text-text font-mono">{size}×{size}×{size} = {size * size * size} voxels</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">States per Voxel:</dt>
            <dd className="text-text font-mono">{VOXEL_COLORS.length} (empty + {colorCount} colors)</dd>
          </div>
        </dl>

        <div className="mt-3 pt-3 border-t border-muted">
          <h4 className="text-xs font-medium text-text mb-1">Combinatorics</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Visual Space:</dt>
              <dd className="text-voxel font-mono">{spaceInfo.visualSpace}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle">Address Space:</dt>
              <dd className="text-text font-mono">{spaceInfo.addressSpace}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle">Formula:</dt>
              <dd className="text-text font-mono text-right">{spaceInfo.visualFormula}</dd>
            </div>
          </dl>
          <p className="text-xs text-subtle mt-2 leading-relaxed">
            {spaceInfo.explanation}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-subtle space-y-1">
        <p>• Every possible 3D arrangement exists</p>
        <p>• Navigate to find sculptures</p>
        <p>• Some will be random noise, others art</p>
      </div>
    </div>
  );

  return (
    <LibraryLayout
      title="Voxel Space"
      description="3D sculptures in a 6×6×6 grid"
      address={address}
      onAddressChange={setAddress}
      onRandom={goRandom}
      onPrev={goPrev}
      onNext={goNext}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accentColor="var(--color-voxel)"
      controls={controls}
    >
      <div className="flex items-center gap-4 h-full">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 hidden md:flex"
          title="Previous Sculpture"
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

          <div className="w-full h-full bg-surface rounded-2xl border border-elevated overflow-hidden">
            <VoxelRenderer
              address={address}
              size={size}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 hidden md:flex"
          title="Next Sculpture"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </LibraryLayout>
  );
}
