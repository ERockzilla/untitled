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
      <div className="flex items-center gap-4 h-full">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 flex"
          title="Previous Composition"
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
              <CurveRenderer
                address={address}
                palette={CURVE_PALETTE_32}
                className="w-full h-full rounded-xl shadow-2xl"
                animate={animate}
                showControlPoints={showControlPoints}
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 flex"
          title="Next Composition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </LibraryLayout>
  );
}
