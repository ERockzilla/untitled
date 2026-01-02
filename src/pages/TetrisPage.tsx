import { Link } from 'react-router-dom';
import { Tetris } from '../components/games/Tetris';
import { useTheme } from '../lib/ThemeContext';
import { loadGameStats, recordGameResult } from '../lib/gamesUtils';
import { useState, useEffect } from 'react';

export function TetrisPage() {
    const { theme, toggleTheme } = useTheme();
    const [stats, setStats] = useState(loadGameStats('tetris'));
    const [, setCurrentScore] = useState(0);

    useEffect(() => {
        setStats(loadGameStats('tetris'));
    }, []);

    const handleGameOver = (score: number, _lines: number, _level: number) => {
        // Consider it a "win" if they got at least 1000 points
        const won = score >= 1000;
        const newStats = recordGameResult('tetris', won, score);
        setStats(newStats);
    };

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
                                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-rose-500">
                                    <rect x="4" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
                                    <rect x="8" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
                                    <rect x="12" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
                                    <rect x="8" y="8" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8" />
                                </svg>
                                Tetris
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-bold text-accent">{stats.gamesPlayed}</div>
                                <div className="text-xs text-subtle">Games</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-secondary">{stats.bestScore?.toLocaleString() || '-'}</div>
                                <div className="text-xs text-subtle">Best</div>
                            </div>
                        </div>

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
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
                <Tetris
                    onGameOver={handleGameOver}
                    onScoreChange={setCurrentScore}
                />

                {/* Controls help */}
                <div className="mt-6 p-4 bg-elevated rounded-lg border border-muted max-w-md">
                    <h3 className="text-sm font-medium text-text mb-2">Controls</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-subtle">
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">←</kbd>
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">→</kbd>
                            <span>Move</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">↓</kbd>
                            <span>Soft drop</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">↑</kbd>
                            <span>Rotate</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">Space</kbd>
                            <span>Hard drop</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">C</kbd>
                            <span>Hold piece</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-surface rounded border border-muted">P</kbd>
                            <span>Pause</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
