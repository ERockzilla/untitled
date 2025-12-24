import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import type { Difficulty, CharacterType } from '../lib/mazeUtils';
import { MAZE_CONFIGS, CHARACTERS, getBestTime, formatTime } from '../lib/mazeUtils';

export function MazeSelection() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [character, setCharacter] = useState<CharacterType>('ball');

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 1024;
            setIsMobile(hasTouchScreen && isSmallScreen);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // On mobile: force easy (10x10) and tilt-only, 2D-only
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [controlMode, setControlMode] = useState<'tilt' | 'touch'>('tilt');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    // Tilt permission state (for mobile)
    const [tiltPermission, setTiltPermission] = useState<'checking' | 'prompt' | 'granted' | 'denied'>('checking');

    // Check tilt permission status on mount
    useEffect(() => {
        if (!isMobile) {
            setTiltPermission('granted'); // Desktop doesn't need permission
            return;
        }

        // Check if DeviceOrientationEvent exists
        if (typeof DeviceOrientationEvent === 'undefined') {
            setTiltPermission('denied');
            return;
        }

        // Check if permission API exists (iOS 13+)
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            setTiltPermission('prompt');
        } else {
            // Android/older iOS - permission not required
            setTiltPermission('granted');
        }
    }, [isMobile]);

    // Request tilt permission
    const requestTiltPermission = useCallback(async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const result = await (DeviceOrientationEvent as any).requestPermission();
                setTiltPermission(result === 'granted' ? 'granted' : 'denied');
            } catch {
                setTiltPermission('denied');
            }
        } else {
            setTiltPermission('granted');
        }
    }, []);

    // Reset to mobile-compatible defaults when mobile detection changes
    useEffect(() => {
        if (isMobile) {
            setDifficulty('easy');
            setControlMode('tilt');
            setViewMode('2d');
        }
    }, [isMobile]);

    const handleStart = () => {
        const mazeSize = isMobile ? 10 : MAZE_CONFIGS[difficulty].size;
        const effectiveDifficulty = isMobile ? 'easy' : difficulty;

        // On mobile with tilt controls, go through calibration first
        if (isMobile && controlMode === 'tilt') {
            const params = new URLSearchParams({
                size: mazeSize.toString(),
                character,
                difficulty: effectiveDifficulty,
            });
            navigate(`/maze/calibrate?${params.toString()}`);
        } else {
            const params = new URLSearchParams({
                size: mazeSize.toString(),
                character,
                controls: controlMode,
                difficulty: effectiveDifficulty,
                view: viewMode,
            });
            navigate(`/maze/play?${params.toString()}`);
        }
    };

    // Check if we can start (on mobile, need tilt permission)
    const canStart = !isMobile || tiltPermission === 'granted';

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-void)' }}>
            {/* Header */}
            <header className="border-b border-elevated">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--color-accent, #06b6d4)' }}>
                            🌀 Maze Runner
                        </h1>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
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
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
                <div className="max-w-lg mx-auto space-y-6">
                    {/* Step 1: Difficulty */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">1</span>
                            Choose Difficulty
                        </h2>

                        {/* Mobile notice */}
                        {isMobile && (
                            <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                                <p className="font-medium">📱 Mobile Mode</p>
                                <p className="text-xs mt-1 text-amber-400/80">
                                    10×10 maze optimized for mobile tilt controls. More sizes coming soon!
                                </p>
                            </div>
                        )}

                        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
                            {(Object.keys(MAZE_CONFIGS) as Difficulty[])
                                .filter(d => !isMobile || d === 'easy') // Only show Easy on mobile
                                .map(d => {
                                    const config = MAZE_CONFIGS[d];
                                    const bestTime = getBestTime(d);
                                    const isSelected = difficulty === d;

                                    return (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`p-3 rounded-xl text-center transition-all duration-200 ${isSelected
                                                ? 'bg-cyan-500 text-void shadow-lg scale-105'
                                                : 'bg-elevated text-text hover:bg-muted'
                                                }`}
                                        >
                                            <div className="text-sm font-medium">{config.label}</div>
                                            <div className={`text-xs mt-1 ${isSelected ? 'text-void/70' : 'text-subtle'}`}>
                                                {config.description}
                                            </div>
                                            {bestTime && (
                                                <div className={`text-xs mt-1 ${isSelected ? 'text-void/60' : 'text-cyan-400'}`}>
                                                    🏆 {formatTime(bestTime)}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    </section>

                    {/* Step 2: Character */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">2</span>
                            Choose Your Character
                        </h2>
                        <div className="grid grid-cols-6 gap-2">
                            {(Object.keys(CHARACTERS) as CharacterType[]).map(c => {
                                const charData = CHARACTERS[c];
                                const isSelected = character === c;

                                return (
                                    <button
                                        key={c}
                                        onClick={() => setCharacter(c)}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${isSelected
                                            ? 'bg-cyan-500 shadow-lg scale-110 ring-2 ring-cyan-300'
                                            : 'bg-elevated hover:bg-muted hover:scale-105'
                                            }`}
                                        title={charData.name}
                                    >
                                        <span className="text-2xl">{charData.emoji}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-subtle mt-2 text-center">
                            {CHARACTERS[character].name}
                        </p>
                    </section>

                    {/* Step 3: Controls - On mobile, tilt-only with calibration note */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">{isMobile ? '2' : '3'}</span>
                            {isMobile ? 'Control Mode' : 'Choose Controls'}
                        </h2>

                        {isMobile ? (
                            // Mobile: Tilt only with permission request + calibration info
                            <div className="space-y-3">
                                {/* Tilt control info */}
                                <div className="p-4 rounded-xl bg-cyan-500 text-void shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">📱</span>
                                        <div>
                                            <div className="font-bold">Tilt Controls</div>
                                            <div className="text-xs text-void/70">
                                                Calibration screen will help tune your motion sensitivity
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Permission request */}
                                {tiltPermission === 'checking' && (
                                    <div className="p-3 rounded-lg bg-elevated text-subtle text-center text-sm animate-pulse">
                                        Checking motion sensor access...
                                    </div>
                                )}

                                {tiltPermission === 'prompt' && (
                                    <button
                                        onClick={requestTiltPermission}
                                        className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-void font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="text-xl">🎯</span>
                                        Enable Motion Access
                                    </button>
                                )}

                                {tiltPermission === 'granted' && (
                                    <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-center text-sm flex items-center justify-center gap-2">
                                        <span>✓</span>
                                        Motion access granted - Ready to play!
                                    </div>
                                )}

                                {tiltPermission === 'denied' && (
                                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-center text-sm">
                                        <p className="font-medium">Motion access denied</p>
                                        <p className="text-xs mt-1">
                                            Please enable motion in browser settings and reload.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Desktop: Full control options
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setControlMode('tilt')}
                                    className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${controlMode === 'tilt'
                                        ? 'bg-cyan-500 text-void shadow-lg'
                                        : 'bg-elevated text-text hover:bg-muted'
                                        }`}
                                >
                                    <span className="text-2xl">📱</span>
                                    <span className="font-medium">Tilt</span>
                                    <span className={`text-xs text-center ${controlMode === 'tilt' ? 'text-void/70' : 'text-subtle'}`}>
                                        Mobile only
                                    </span>
                                </button>
                                <button
                                    onClick={() => setControlMode('touch')}
                                    className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${controlMode === 'touch'
                                        ? 'bg-cyan-500 text-void shadow-lg'
                                        : 'bg-elevated text-text hover:bg-muted'
                                        }`}
                                >
                                    <span className="text-2xl">⌨️</span>
                                    <span className="font-medium">Keyboard</span>
                                    <span className={`text-xs text-center ${controlMode === 'touch' ? 'text-void/70' : 'text-subtle'}`}>
                                        Arrow keys / WASD
                                    </span>
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Step 4: View Mode - Hidden on mobile (forced 2D) */}
                    {!isMobile && (
                        <section>
                            <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">4</span>
                                Choose View
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setViewMode('2d')}
                                    className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${viewMode === '2d'
                                        ? 'bg-cyan-500 text-void shadow-lg'
                                        : 'bg-elevated text-text hover:bg-muted'
                                        }`}
                                >
                                    <span className="text-2xl">🗺️</span>
                                    <span className="font-medium">2D Top-Down</span>
                                    <span className={`text-xs text-center ${viewMode === '2d' ? 'text-void/70' : 'text-subtle'}`}>
                                        Works everywhere ✓
                                    </span>
                                </button>
                                <button
                                    onClick={() => setViewMode('3d')}
                                    className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${viewMode === '3d'
                                        ? 'bg-cyan-500 text-void shadow-lg'
                                        : 'bg-elevated text-text hover:bg-muted'
                                        }`}
                                >
                                    <span className="text-2xl">🎮</span>
                                    <span className="font-medium">3D First-Person</span>
                                    <span className={`text-xs text-center ${viewMode === '3d' ? 'text-void/70' : 'text-subtle'}`}>
                                        Desktop recommended
                                    </span>
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Preview */}
                    <section className="p-4 rounded-xl bg-elevated/50 border border-elevated">
                        <div className="flex items-center justify-center gap-6">
                            <div className="text-4xl">
                                {CHARACTERS[character].emoji}
                            </div>
                            <div className="text-center">
                                <div className="text-text font-medium">
                                    {MAZE_CONFIGS[difficulty].description} Maze
                                </div>
                                <div className="text-sm text-subtle">
                                    {viewMode === '3d' ? '🎮 3D' : '🗺️ 2D'} • {controlMode === 'tilt' ? '📱 Tilt' : '⌨️ Keyboard'}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Start Button */}
            <div className="sticky bottom-0 p-4 bg-gradient-to-t from-void via-void to-transparent">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleStart}
                        disabled={!canStart}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${canStart
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-void shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-elevated text-subtle cursor-not-allowed'
                            }`}
                    >
                        {canStart ? '🌀 Enter the Maze' : '📱 Enable Motion Access First'}
                    </button>
                </div>
            </div>
        </div>
    );
}
