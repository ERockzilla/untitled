import { Link } from 'react-router-dom';
import { Sudoku } from '../components/games/Sudoku';
import { useTheme } from '../lib/ThemeContext';
import { loadGameStats, recordGameResult } from '../lib/gamesUtils';
import { useState, useCallback } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

export function SudokuPage() {
    const { theme, toggleTheme } = useTheme();
    const [stats, setStats] = useState(loadGameStats('sudoku'));
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [key, setKey] = useState(0);

    const handleComplete = useCallback((time: number) => {
        const newStats = recordGameResult('sudoku', true, undefined, time);
        setStats(newStats);
    }, []);

    const handleNewGame = useCallback(() => {
        // Increment key to force remount
    }, []);

    const handleDifficultyChange = (diff: Difficulty) => {
        setDifficulty(diff);
        setKey(k => k + 1);
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
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-purple-500">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <line x1="15" y1="3" x2="15" y2="21" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="3" y1="15" x2="21" y2="15" />
                                </svg>
                                Sudoku
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Difficulty selector */}
                        <div className="hidden sm:flex items-center gap-1 bg-elevated rounded-lg p-1">
                            {(['easy', 'medium', 'hard'] as const).map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => handleDifficultyChange(diff)}
                                    className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize
                    ${difficulty === diff
                                            ? 'bg-purple-500 text-white'
                                            : 'text-subtle hover:text-text'
                                        }
                  `}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <div className="font-bold text-accent">{stats.gamesPlayed}</div>
                                <div className="text-xs text-subtle">Played</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-secondary">{stats.gamesWon}</div>
                                <div className="text-xs text-subtle">Won</div>
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

                {/* Mobile difficulty selector */}
                <div className="sm:hidden px-4 pb-3 flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                        <button
                            key={diff}
                            onClick={() => handleDifficultyChange(diff)}
                            className={`
                flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize
                ${difficulty === diff
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-elevated text-subtle'
                                }
              `}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 overflow-x-auto">
                <Sudoku
                    key={`${difficulty}-${key}`}
                    difficulty={difficulty}
                    onComplete={handleComplete}
                    onNewGame={handleNewGame}
                />

                {/* Controls help */}
                <div className="mt-6 p-4 bg-elevated rounded-lg border border-muted max-w-md">
                    <h3 className="text-sm font-medium text-text mb-2">How to Play</h3>
                    <ul className="text-xs text-subtle space-y-1">
                        <li>• Click a cell to select it, then click a number</li>
                        <li>• Use arrow keys to navigate between cells</li>
                        <li>• Press <kbd className="px-1 bg-surface rounded">N</kbd> to toggle notes mode</li>
                        <li>• Fill each row, column, and 3×3 box with numbers 1-9</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
