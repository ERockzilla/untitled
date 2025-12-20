import { useState, useMemo } from 'react';
import { LibraryLayout } from '../components/library/LibraryLayout';
import { useLibraryState } from '../components/library/useLibraryState';
import {
  AnimatedLEDMatrix,
  LED_COLORS,
  addressToLEDMatrix,
} from '../components/led/LEDMatrixRenderer';
import type { LEDShape, AnimationMode } from '../components/led/LEDMatrixRenderer';
import { getLEDSpaceInfo } from '../lib/combinatorics';

// Check if we're on the DRock VIP subdomain - defaults to text mode with birthday message!
const isDRockDomain = window.location.hostname.startsWith('d.');

const GRID_PRESETS = [
  { label: '8×8', width: 8, height: 8 },
  { label: '16×8', width: 16, height: 8 },
  { label: '32×8', width: 32, height: 8 },
  { label: '16×16', width: 16, height: 16 },
  { label: '32×16', width: 32, height: 16 },
];

const SHAPE_OPTIONS: { value: LEDShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
];

const ANIMATION_OPTIONS: { value: AnimationMode; label: string }[] = [
  { value: 'static', label: 'Static' },
  { value: 'scroll-left', label: 'Scroll Left' },
  { value: 'scroll-right', label: 'Scroll Right' },
  { value: 'rain', label: 'Rain' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'random', label: 'Random' },
];

export function LEDMatrix() {
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
  } = useLibraryState({ pageId: 'led', addressLength: 64 });

  // Settings state
  const [gridSize, setGridSize] = useState({
    width: (settings.width as number) || 32,
    height: (settings.height as number) || 8,
  });
  const [ledShape, setLedShape] = useState<LEDShape>(
    (settings.ledShape as LEDShape) || 'circle'
  );
  const [animation, setAnimation] = useState<AnimationMode>(
    (settings.animation as AnimationMode) || 'scroll-left'
  );
  const [speed, setSpeed] = useState((settings.speed as number) || 100);
  const [showGlow, setShowGlow] = useState((settings.showGlow as boolean) ?? true);
  const [textMode, setTextMode] = useState((settings.textMode as boolean) ?? isDRockDomain);
  const [customText, setCustomText] = useState((settings.customText as string) || 'HAPPY BIRTHDAY!');
  const [textColor, setTextColor] = useState((settings.textColor as string) || '#00ff00');

  const spaceInfo = useMemo(
    () => getLEDSpaceInfo(gridSize.width, gridSize.height, LED_COLORS.length, textMode),
    [gridSize.width, gridSize.height, textMode]
  );

  // Calculate stats
  const stats = useMemo(() => {
    const matrix = addressToLEDMatrix(address, gridSize.width, gridSize.height);
    let litCount = 0;
    const colorCounts: Record<string, number> = {};

    matrix.leds.forEach(row => {
      row.forEach(led => {
        if (led.on) {
          litCount++;
          colorCounts[led.color] = (colorCounts[led.color] || 0) + 1;
        }
      });
    });

    return {
      totalLEDs: gridSize.width * gridSize.height,
      litCount,
      colorCounts,
    };
  }, [address, gridSize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-subtle">Loading...</div>
      </div>
    );
  }

  const controls = (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-medium text-text mb-3">
          Display Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTextMode(false);
              updateSettings({ textMode: false });
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${!textMode
              ? 'bg-led text-void font-medium'
              : 'bg-elevated text-text hover:bg-muted'
              }`}
          >
            Pattern
          </button>
          <button
            onClick={() => {
              setTextMode(true);
              updateSettings({ textMode: true });
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${textMode
              ? 'bg-led text-void font-medium'
              : 'bg-elevated text-text hover:bg-muted'
              }`}
          >
            Text
          </button>
        </div>
      </div>

      {/* Text Input (if text mode) */}
      {textMode && (
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Custom Text
          </label>
          <input
            type="text"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              updateSettings({ customText: e.target.value });
            }}
            maxLength={32}
            className="w-full px-3 py-2 bg-elevated border border-muted rounded-lg text-text focus:outline-none focus:border-led"
            placeholder="Enter text..."
          />
          <div className="mt-2">
            <label className="block text-xs text-subtle mb-1">Text Color</label>
            <div className="flex flex-wrap gap-1">
              {LED_COLORS.slice(0, 8).map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setTextColor(color);
                    updateSettings({ textColor: color });
                  }}
                  className={`w-6 h-6 rounded border-2 transition-all ${textColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Size */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Grid Size
        </label>
        <div className="flex flex-wrap gap-2">
          {GRID_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setGridSize({ width: preset.width, height: preset.height });
                updateSettings({ width: preset.width, height: preset.height });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${gridSize.width === preset.width && gridSize.height === preset.height
                ? 'bg-led text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
                }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* LED Shape */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          LED Shape
        </label>
        <div className="flex gap-2">
          {SHAPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setLedShape(option.value);
                updateSettings({ ledShape: option.value });
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${ledShape === option.value
                ? 'bg-led text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animation */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Animation
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ANIMATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setAnimation(option.value);
                updateSettings({ animation: option.value });
              }}
              className={`px-2 py-1.5 rounded-lg text-xs transition-all ${animation === option.value
                ? 'bg-led text-void font-medium'
                : 'bg-elevated text-text hover:bg-muted'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {animation !== 'static' && (
          <div className="mt-3">
            <label className="block text-xs text-subtle mb-1">
              Speed: {speed}ms
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={speed}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSpeed(val);
                updateSettings({ speed: val });
              }}
              className="w-full accent-led"
            />
          </div>
        )}
      </div>

      {/* Visual Options */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showGlow}
            onChange={(e) => {
              setShowGlow(e.target.checked);
              updateSettings({ showGlow: e.target.checked });
            }}
            className="w-4 h-4 rounded bg-elevated border-muted accent-led"
          />
          <span className="text-sm text-text">LED Glow Effect</span>
        </label>
      </div>

      {/* Stats */}
      {!textMode && (
        <div className="p-4 bg-elevated rounded-lg">
          <h3 className="text-sm font-medium text-text mb-2">Pattern Stats</h3>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Grid:</dt>
              <dd className="text-text font-mono">{gridSize.width}×{gridSize.height}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-subtle">LEDs Lit:</dt>
              <dd className="text-text font-mono">{stats.litCount} / {stats.totalLEDs}</dd>
            </div>
          </dl>
          <div className="mt-2 w-full h-2 bg-void rounded-full overflow-hidden">
            <div
              className="h-full bg-led rounded-full transition-all"
              style={{ width: `${(stats.litCount / stats.totalLEDs) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-elevated rounded-lg">
        <h3 className="text-sm font-medium text-text mb-2">Library Info</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-subtle">Grid:</dt>
            <dd className="text-text font-mono">{gridSize.width}×{gridSize.height} = {gridSize.width * gridSize.height} LEDs</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Colors:</dt>
            <dd className="text-text font-mono">{LED_COLORS.length} + off state</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Animations:</dt>
            <dd className="text-text font-mono">6 modes</dd>
          </div>
        </dl>

        <div className="mt-3 pt-3 border-t border-muted">
          <h4 className="text-xs font-medium text-text mb-1">Combinatorics</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-subtle">Visual Space:</dt>
              <dd className="text-led font-mono">{spaceInfo.visualSpace}</dd>
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
    </div>
  );

  return (
    <LibraryLayout
      title="LED Matrix"
      description="Animated LED displays and text marquees"
      address={address}
      onAddressChange={setAddress}
      onRandom={goRandom}
      onPrev={goPrev}
      onNext={goNext}
      isFavorite={isFavorite}
      onToggleFavorite={toggleFavorite}
      accentColor="var(--color-led)"
      controls={controls}
    >
      <div className="flex items-center gap-4 h-full">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 hidden md:flex"
          title="Previous Pattern"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className="flex-1 aspect-square md:aspect-auto h-full relative group flex items-center justify-center">
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

          <div className="w-full h-full bg-surface rounded-2xl border border-elevated flex items-center justify-center p-6 overflow-hidden">
            <div className="w-full max-w-2xl">
              <AnimatedLEDMatrix
                address={address}
                width={gridSize.width}
                height={gridSize.height}
                text={textMode ? customText : undefined}
                textColor={textColor}
                animation={animation}
                speed={speed}
                ledShape={ledShape}
                showGlow={showGlow}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="p-3 rounded-xl bg-elevated/50 hover:bg-elevated text-subtle hover:text-text transition-all hover:scale-110 active:scale-95 hidden md:flex"
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

