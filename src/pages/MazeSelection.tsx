import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import type { Difficulty, CharacterType } from '../lib/mazeUtils';
import { MAZE_CONFIGS, CHARACTERS, getBestTime, formatTime } from '../lib/mazeUtils';

export function MazeSelection() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [character, setCharacter] = useState<CharacterType>('ball');
    const [controlMode, setControlMode] = useState<'tilt' | 'touch'>('tilt');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    const handleStart = () => {
        const params = new URLSearchParams({
            size: MAZE_CONFIGS[difficulty].size.toString(),
            character,
            controls: controlMode,
            difficulty,
            view: viewMode,
        });
        navigate(`/maze/play?${params.toString()}`);
    };

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
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(MAZE_CONFIGS) as Difficulty[]).map(d => {
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

                    {/* Step 3: Controls */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">3</span>
                            Choose Controls
                        </h2>
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
                                <span className={`text-xs ${controlMode === 'tilt' ? 'text-void/70' : 'text-subtle'}`}>
                                    Tilt your device
                                </span>
                            </button>
                            <button
                                onClick={() => setControlMode('touch')}
                                className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${controlMode === 'touch'
                                    ? 'bg-cyan-500 text-void shadow-lg'
                                    : 'bg-elevated text-text hover:bg-muted'
                                    }`}
                            >
                                <span className="text-2xl">👆</span>
                                <span className="font-medium">Touch</span>
                                <span className={`text-xs ${controlMode === 'touch' ? 'text-void/70' : 'text-subtle'}`}>
                                    Drag to move
                                </span>
                            </button>
                        </div>
                    </section>

                    {/* Step 4: View Mode */}
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
                                <span className={`text-xs ${viewMode === '2d' ? 'text-void/70' : 'text-subtle'}`}>
                                    Classic view
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
                                <span className={`text-xs ${viewMode === '3d' ? 'text-void/70' : 'text-subtle'}`}>
                                    Immersive view
                                </span>
                            </button>
                        </div>
                    </section>

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
                                    {viewMode === '3d' ? '🎮 3D' : '🗺️ 2D'} • {controlMode === 'tilt' ? '📱 Tilt' : '👆 Touch'}
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
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-void shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        🌀 Enter the Maze
                    </button>
                </div>
            </div>
        </div>
    );
}
