import { Link } from 'react-router-dom';
import { WordSearch } from '../components/games/WordSearch';
import { useTheme } from '../lib/ThemeContext';
import { loadGameStats, recordGameResult } from '../lib/gamesUtils';
import { useState, useCallback } from 'react';

export function WordSearchPage() {
    const { theme, toggleTheme } = useTheme();
    const [stats, setStats] = useState(loadGameStats('wordsearch'));

    const handleComplete = useCallback(() => {
        const newStats = recordGameResult('wordsearch', true);
        setStats(newStats);
    }, []);

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
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-emerald-500">
                                    <rect x="3" y="3" width="14" height="14" rx="2" />
                                    <circle cx="17" cy="17" r="4" strokeWidth="2" />
                                    <line x1="19.5" y1="19.5" x2="22" y2="22" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Word Search
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-bold text-accent">{stats.gamesPlayed}</div>
                                <div className="text-xs text-subtle">Played</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-secondary">{stats.gamesWon}</div>
                                <div className="text-xs text-subtle">Completed</div>
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
                <WordSearch onComplete={handleComplete} />

                {/* Instructions */}
                <div className="mt-6 p-4 bg-elevated rounded-lg border border-muted max-w-md">
                    <h3 className="text-sm font-medium text-text mb-2">How to Play</h3>
                    <ul className="text-xs text-subtle space-y-1">
                        <li>• Click and drag to select words in the grid</li>
                        <li>• Words can be horizontal, vertical, or diagonal</li>
                        <li>• Words can be forwards or backwards</li>
                        <li>• Find all words to complete the puzzle</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
