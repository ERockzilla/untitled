import { Link } from 'react-router-dom';
import { Wordle } from '../components/games/Wordle';
import { useTheme } from '../lib/ThemeContext';
import { loadGameStats, recordGameResult, getWinPercentage } from '../lib/gamesUtils';
import { useState, useCallback } from 'react';

export function WordlePage() {
    const { theme, toggleTheme } = useTheme();
    const [stats, setStats] = useState(loadGameStats('wordle'));
    const [mode, setMode] = useState<'daily' | 'random'>('random');
    const [key, setKey] = useState(0);
    const [showStats, setShowStats] = useState(false);

    const handleComplete = useCallback((won: boolean, attempts: number) => {
        const newStats = recordGameResult('wordle', won, won ? (MAX_GUESSES - attempts + 1) * 100 : 0);
        setStats(newStats);
        // Show stats after short delay
        setTimeout(() => setShowStats(true), 1500);
    }, []);

    const handleModeChange = (newMode: 'daily' | 'random') => {
        setMode(newMode);
        setKey(k => k + 1);
        setShowStats(false);
    };

    const MAX_GUESSES = 6;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-elevated">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/games"
                            className="w-9 h-9 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-text flex items-center gap-2">
                                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                                    <rect x="2" y="10" width="4" height="4" rx="0.5" fill="#6aaa64" />
                                    <rect x="7" y="10" width="4" height="4" rx="0.5" fill="#c9b458" />
                                    <rect x="12" y="10" width="4" height="4" rx="0.5" fill="#787c7e" />
                                    <rect x="17" y="10" width="4" height="4" rx="0.5" fill="#6aaa64" />
                                </svg>
                                Wordle
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Mode toggle */}
                        <div className="hidden sm:flex items-center gap-1 bg-elevated rounded-lg p-1">
                            <button
                                onClick={() => handleModeChange('daily')}
                                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${mode === 'daily' ? 'bg-yellow-500 text-black' : 'text-subtle hover:text-text'}
                `}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => handleModeChange('random')}
                                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${mode === 'random' ? 'bg-green-500 text-white' : 'text-subtle hover:text-text'}
                `}
                            >
                                Random
                            </button>
                        </div>

                        {/* Stats button */}
                        <button
                            onClick={() => setShowStats(true)}
                            className="w-9 h-9 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                            title="Statistics"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
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
                </div>

                {/* Mobile mode toggle */}
                <div className="sm:hidden px-4 pb-3 flex gap-2">
                    <button
                        onClick={() => handleModeChange('daily')}
                        className={`
              flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors
              ${mode === 'daily' ? 'bg-yellow-500 text-black' : 'bg-elevated text-subtle'}
            `}
                    >
                        Daily Word
                    </button>
                    <button
                        onClick={() => handleModeChange('random')}
                        className={`
              flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors
              ${mode === 'random' ? 'bg-green-500 text-white' : 'bg-elevated text-subtle'}
            `}
                    >
                        Random
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
                <Wordle
                    key={`${mode}-${key}`}
                    mode={mode}
                    onComplete={handleComplete}
                />
            </main>

            {/* Stats modal */}
            {showStats && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowStats(false)}
                >
                    <div
                        className="bg-surface border border-elevated rounded-2xl p-6 max-w-sm w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-text text-center mb-4">Statistics</h2>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-text">{stats.gamesPlayed}</div>
                                <div className="text-xs text-subtle">Played</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-text">{getWinPercentage(stats)}</div>
                                <div className="text-xs text-subtle">Win %</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-text">{stats.currentStreak || 0}</div>
                                <div className="text-xs text-subtle">Streak</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-text">{stats.maxStreak || 0}</div>
                                <div className="text-xs text-subtle">Max</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowStats(false)}
                            className="w-full py-3 bg-green-500 rounded-lg text-white font-bold hover:bg-green-400 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
