import { useState, useMemo } from 'react';
import { LibraryLayout } from '../components/library/LibraryLayout';
import { useLibraryState } from '../components/library/useLibraryState';
import { GeometricRenderer, addressToComposition } from '../components/geometric/GeometricRenderer';
import { NeighborhoodExplorer } from '../components/explorer/NeighborhoodExplorer';
import { GEO_PALETTE_64 } from '../lib/palettes';
import { getGeometricSpaceInfo } from '../lib/combinatorics';
import { seededRandom } from '../lib/random';

type ViewMode = 'composition' | 'explorer';

// Simplified bounded shapes for explorer previews
function renderSimplifiedPreview(previewAddress: string, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prng = seededRandom(previewAddress);
  const size = canvas.width;
  const padding = size * 0.1;
  const innerSize = size - padding * 2;

  // Background
  const bgColors = ['#0a0a0f', '#12121a', '#1a1a2e', '#0f1520'];
  ctx.fillStyle = bgColors[Math.floor(prng() * bgColors.length)];
  ctx.fillRect(0, 0, size, size);

  // Limited, harmonious color palette for this preview
  const baseHue = Math.floor(prng() * 360);
  const colors = [
    `hsl(${baseHue}, 70%, 50%)`,
    `hsl(${baseHue}, 70%, 35%)`,
    `hsl(${(baseHue + 30) % 360}, 60%, 45%)`,
    `hsl(${(baseHue + 180) % 360}, 50%, 40%)`,
  ];

  // Draw 2-4 simple, bounded shapes
  const shapeCount = 2 + Math.floor(prng() * 3);
  
  for (let i = 0; i < shapeCount; i++) {
    ctx.save();
    
    // Keep shapes within bounds with margin
    const shapeSize = innerSize * (0.2 + prng() * 0.3);
    const maxOffset = (innerSize - shapeSize) / 2;
    const cx = padding + innerSize / 2 + (prng() - 0.5) * maxOffset * 2;
    const cy = padding + innerSize / 2 + (prng() - 0.5) * maxOffset * 2;
    
    ctx.fillStyle = colors[Math.floor(prng() * colors.length)];
    ctx.globalAlpha = 0.6 + prng() * 0.4;
    
    const shapeType = Math.floor(prng() * 4);
    
    ctx.translate(cx, cy);
    ctx.rotate(prng() * Math.PI * 2);
    
    switch (shapeType) {
      case 0: // Circle
        ctx.beginPath();
        ctx.arc(0, 0, shapeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1: // Square
        ctx.fillRect(-shapeSize / 2, -shapeSize / 2, shapeSize, shapeSize);
        break;
      case 2: // Triangle
        ctx.beginPath();
        ctx.moveTo(0, -shapeSize / 2);
        ctx.lineTo(-shapeSize / 2, shapeSize / 2);
        ctx.lineTo(shapeSize / 2, shapeSize / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 3: // Diamond
        ctx.beginPath();
        ctx.moveTo(0, -shapeSize / 2);
        ctx.lineTo(shapeSize / 2, 0);
        ctx.lineTo(0, shapeSize / 2);
        ctx.lineTo(-shapeSize / 2, 0);
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
}

export function GeometricComposition() {
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
  } = useLibraryState({ pageId: 'geo', addressLength: 64 });

  const [showGlow, setShowGlow] = useState((settings.glow as boolean) ?? false);
  const [animate, setAnimate] = useState((settings.animate as boolean) ?? true);
  const [viewMode, setViewMode] = useState<ViewMode>('composition');

  const composition = addressToComposition(address);
  const spaceInfo = useMemo(() => getGeometricSpaceInfo(5, GEO_PALETTE_64.length, 3, 7), []);

  // Stable render preview function
  const renderPreview = useMemo(() => {
    return renderSimplifiedPreview;
  }, []);

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
            onClick={() => setViewMode('composition')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              viewMode === 'composition'
                ? 'bg-geo text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
            }`}
          >
            Full View
          </button>
          <button
            onClick={() => setViewMode('explorer')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              viewMode === 'explorer'
                ? 'bg-geo text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
            }`}
          >
            3D Explorer
          </button>
        </div>
      </div>

      {/* Composition-specific controls */}
      {viewMode === 'composition' && (
        <>
          {/* Visual Options */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Display Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={animate}
                  onChange={(e) => {
                    setAnimate(e.target.checked);
                    updateSettings({ animate: e.target.checked });
                  }}
                  className="w-4 h-4 rounded bg-elevated border-muted accent-geo"
                />
                <span className="text-sm text-text">Animate transitions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGlow}
                  onChange={(e) => {
                    setShowGlow(e.target.checked);
                    updateSettings({ glow: e.target.checked });
                  }}
                  className="w-4 h-4 rounded bg-elevated border-muted accent-geo"
                />
                <span className="text-sm text-text">Glow effect</span>
              </label>
            </div>
          </div>

          {/* Composition Details */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Current Shapes ({composition.shapes.length})
            </label>
            <div className="space-y-2">
              {composition.shapes.map((shape, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-elevated rounded-lg text-xs"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: shape.color, opacity: shape.opacity }}
                  />
                  <span className="text-subtle capitalize">{shape.type}</span>
                  <span className="text-muted ml-auto">
                    {Math.round(shape.size)}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Explorer-specific info */}
      {viewMode === 'explorer' && (
        <div className="p-4 bg-elevated rounded-lg">
          <h3 className="text-sm font-medium text-text mb-2">Navigation</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-mono">X:</span>
              <span className="text-subtle">Subtle changes (A/D)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-mono">Y:</span>
              <span className="text-subtle">Medium changes (W/S)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-mono">Z:</span>
              <span className="text-subtle">Large changes (Q/E)</span>
            </div>
          </div>
          <p className="text-xs text-subtle mt-3">
            Explorer uses simplified shapes for clarity. Click to view full composition.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">Library Info</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-subtle">Shape Types:</dt>
            <dd className="text-text font-mono">5</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Colors:</dt>
            <dd className="text-text font-mono">{GEO_PALETTE_64.length}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Shapes per Image:</dt>
            <dd className="text-text font-mono">3-7</dd>
          </div>
        </dl>
        
        <div className="mt-3 pt-3 border-t border-muted">
          <h4 className="text-xs font-medium text-text mb-1">Combinatorics</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Address Space:</dt>
              <dd className="text-geo font-mono">{spaceInfo.addressSpace}</dd>
            </div>
          </dl>
          <p className="text-xs text-subtle mt-2">
            {spaceInfo.explanation}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-subtle space-y-1">
        {viewMode === 'composition' ? (
          <>
            <p>• Each address = unique composition</p>
            <p>• Use ← → to browse adjacent</p>
          </>
        ) : (
          <>
            <p>• Click preview to select</p>
            <p>• Ring = current address</p>
            <p>• Shift + key for 5x jumps</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <LibraryLayout
      title="Geometric Composition"
      description="Infinite compositions of shapes and colors"
      address={address}
      onAddressChange={setAddress}
      onRandom={goRandom}
      onPrev={goPrev}
      onNext={goNext}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accentColor="var(--color-geo)"
      controls={controls}
    >
      {viewMode === 'composition' ? (
        <div className="w-full h-full bg-surface rounded-2xl border border-elevated flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-lg aspect-square">
            <GeometricRenderer
              address={address}
              palette={GEO_PALETTE_64}
              className="w-full h-full rounded-xl shadow-2xl"
              animate={animate}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-surface rounded-2xl border border-elevated overflow-hidden">
          <NeighborhoodExplorer
            currentAddress={address}
            onSelectAddress={setAddress}
            renderPreview={renderPreview}
            gridSize={5}
            previewSize={80}
            accentColor="var(--color-geo)"
          />
        </div>
      )}
    </LibraryLayout>
  );
}
