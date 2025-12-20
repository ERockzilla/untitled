import { useState, useMemo } from 'react';
import { LibraryLayout } from '../components/library/LibraryLayout';
import { useLibraryState } from '../components/library/useLibraryState';
import { CurveRenderer, addressToCurves } from '../components/curves/CurveRenderer';
import { CURVE_PALETTE_32 } from '../lib/palettes';
import { getCurveSpaceInfo } from '../lib/combinatorics';

export function ParametricCurves() {
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
  } = useLibraryState({ pageId: 'curve', addressLength: 64 });

  const [showControlPoints, setShowControlPoints] = useState(
    (settings.showControlPoints as boolean) ?? false
  );
  const [animate, setAnimate] = useState((settings.animate as boolean) ?? true);

  const composition = useMemo(() => addressToCurves(address), [address]);
  const spaceInfo = useMemo(() => getCurveSpaceInfo(CURVE_PALETTE_32.length), []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-subtle">Loading...</div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-6">
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
              className="w-4 h-4 rounded bg-elevated border-muted accent-curve"
            />
            <span className="text-sm text-text">Animate drawing</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showControlPoints}
              onChange={(e) => {
                setShowControlPoints(e.target.checked);
                updateSettings({ showControlPoints: e.target.checked });
              }}
              className="w-4 h-4 rounded bg-elevated border-muted accent-curve"
            />
            <span className="text-sm text-text">Show control points</span>
          </label>
        </div>
      </div>

      {/* Curve Details */}
      <div>
        <label className="block text-sm font-medium text-text mb-3">
          Current Composition
        </label>
        <div className="space-y-2">
          {composition.curves.map((curve, i) => (
            <div
              key={i}
              className="p-3 bg-elevated rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ 
                    backgroundColor: curve.color,
                    opacity: curve.opacity 
                  }}
                />
                <span className="text-xs text-text">Curve {i + 1}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-subtle">Width:</span>
                <span className="text-text font-mono">
                  {curve.strokeWidth.toFixed(1)}px
                </span>
                <span className="text-subtle">Opacity:</span>
                <span className="text-text font-mono">
                  {Math.round(curve.opacity * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">Library Info</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-subtle">Curves per Image:</dt>
            <dd className="text-text font-mono">2-5</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Control Points:</dt>
            <dd className="text-text font-mono">4 per curve (8 coordinates)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Colors:</dt>
            <dd className="text-text font-mono">{CURVE_PALETTE_32.length}</dd>
          </div>
        </dl>
        
        <div className="mt-3 pt-3 border-t border-muted">
          <h4 className="text-xs font-medium text-text mb-1">Combinatorics</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Address Space:</dt>
              <dd className="text-curve font-mono">{spaceInfo.addressSpace}</dd>
            </div>
          </dl>
          <p className="text-xs text-subtle mt-2 leading-relaxed">
            {spaceInfo.explanation}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-subtle space-y-1">
        <p>• Cubic bezier curves with 4 control points</p>
        <p>• Each curve has unique color and thickness</p>
        <p>• Enable control points to see the math</p>
      </div>
    </div>
  );

  return (
    <LibraryLayout
      title="Parametric Curves"
      description="Elegant bezier curve compositions"
      address={address}
      onAddressChange={setAddress}
      onRandom={goRandom}
      onPrev={goPrev}
      onNext={goNext}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accentColor="var(--color-curve)"
      controls={controls}
    >
      <div className="w-full h-full bg-surface rounded-2xl border border-elevated flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-lg aspect-square">
          <CurveRenderer
            address={address}
            palette={CURVE_PALETTE_32}
            className="w-full h-full rounded-xl shadow-2xl"
            animate={animate}
            showControlPoints={showControlPoints}
          />
        </div>
      </div>
    </LibraryLayout>
  );
}
