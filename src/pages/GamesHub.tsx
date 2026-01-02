import { Link } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { loadGameStats } from '../lib/gamesUtils';
import { loadProgress } from '../lib/puzzleUtils';

// Modern SVG icons for each game
const GameIcons = {
    puzzles: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.313-.687.75-.687.438 0 .75.332.75.687v.668c0 .11.045.216.125.295l.554.554c.08.08.186.125.295.125h.668c.355 0 .687.313.687.75s-.332.75-.687.75h-.668c-.11 0-.216.045-.295.125l-.554.554c-.08.08-.125.186-.125.295v.668c0 .355-.313.687-.75.687-.438 0-.75-.332-.75-.687v-.668c0-.11-.045-.216-.125-.295l-.554-.554c-.08-.08-.186-.125-.295-.125h-.668c-.355 0-.687-.313-.687-.75s.332-.75.687-.75h.668c.11 0 .216-.045.295-.125l.554-.554c.08-.08.125-.186.125-.295v-.668z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />
        </svg>
    ),
    tetris: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <rect x="4" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
            <rect x="8" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
            <rect x="12" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
            <rect x="16" y="4" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
            <rect x="4" y="8" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
            <rect x="8" y="8" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8" />
            <rect x="12" y="8" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
            <rect x="8" y="12" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
            <rect x="12" y="12" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
            <rect x="8" y="16" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
        </svg>
    ),
    sudoku: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <text x="5.5" y="7.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">1</text>
            <text x="11" y="13.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">5</text>
            <text x="17" y="19.5" fontSize="4" fill="currentColor" stroke="none" fontWeight="bold">9</text>
        </svg>
    ),
    wordSearch: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <text x="5" y="9" fontSize="4" fill="currentColor" stroke="none" fontFamily="monospace">W O R</text>
            <text x="5" y="14" fontSize="4" fill="currentColor" stroke="none" fontFamily="monospace">X D S</text>
            <text x="5" y="19" fontSize="4" fill="currentColor" stroke="none" fontFamily="monospace">A B C</text>
            <circle cx="18" cy="18" r="4" strokeWidth="2" />
            <line x1="20.5" y1="20.5" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    wordle: (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <rect x="2" y="9" width="4" height="4" rx="0.5" fill="#6aaa64" />
            <rect x="7" y="9" width="4" height="4" rx="0.5" fill="#c9b458" />
            <rect x="12" y="9" width="4" height="4" rx="0.5" fill="#787c7e" />
            <rect x="17" y="9" width="4" height="4" rx="0.5" fill="#6aaa64" />
            <text x="3" y="12.5" fontSize="3" fill="white" fontWeight="bold">W</text>
            <text x="8" y="12.5" fontSize="3" fill="white" fontWeight="bold">O</text>
            <text x="13" y="12.5" fontSize="3" fill="white" fontWeight="bold">R</text>
            <text x="18" y="12.5" fontSize="3" fill="white" fontWeight="bold">D</text>
        </svg>
    ),
};

interface GameCardProps {
    to: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    stats?: { played: number; won: number };
}

function GameCard({ to, title, description, icon, color, stats }: GameCardProps) {
    const winRate = stats && stats.played > 0
        ? Math.round((stats.won / stats.played) * 100)
        : null;

    return (
        <Link
            to={to}
            className="group relative overflow-hidden rounded-2xl bg-surface border border-elevated hover:border-muted transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        >
            {/* Gradient accent */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
            />

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${color}20`, color }}
                    >
                        {icon}
                    </div>

                    {winRate !== null && (
                        <div className="text-right">
                            <div className="text-xs text-subtle">Win Rate</div>
                            <div className="text-lg font-bold" style={{ color }}>
                                {winRate}%
                            </div>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-text mb-1 group-hover:text-accent transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-subtle">
                    {description}
                </p>

                {stats && stats.played > 0 && (
                    <div className="mt-4 pt-4 border-t border-elevated flex gap-4 text-xs text-subtle">
                        <span>{stats.played} played</span>
                        <span>{stats.won} won</span>
                    </div>
                )}
            </div>

            {/* Arrow indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <svg className="w-5 h-5 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
}

export function GamesHub() {
    const { theme, toggleTheme } = useTheme();

    // Load stats for each game
    const tetrisStats = loadGameStats('tetris');
    const sudokuStats = loadGameStats('sudoku');
    const wordSearchStats = loadGameStats('wordsearch');
    const wordleStats = loadGameStats('wordle');

    // Load puzzle progress
    const puzzleProgress = loadProgress();
    const puzzleCount = Object.values(puzzleProgress).reduce((acc, p) => {
        return acc + (p.jigsaw ? 1 : 0) + (p.sliding ? 1 : 0);
    }, 0);

    const games = [
        {
            to: '/games/puzzles',
            title: 'Puzzles',
            description: 'Classic jigsaw and sliding tile puzzles with your own images',
            icon: GameIcons.puzzles,
            color: '#06b6d4',
            stats: { played: puzzleCount, won: puzzleCount },
        },
        {
            to: '/games/tetris',
            title: 'Tetris',
            description: 'Classic falling blocks - clear lines and chase high scores',
            icon: GameIcons.tetris,
            color: '#f43f5e',
            stats: { played: tetrisStats.gamesPlayed, won: tetrisStats.gamesWon },
        },
        {
            to: '/games/sudoku',
            title: 'Sudoku',
            description: 'Fill the 9×9 grid with numbers 1-9 in every row, column, and box',
            icon: GameIcons.sudoku,
            color: '#8b5cf6',
            stats: { played: sudokuStats.gamesPlayed, won: sudokuStats.gamesWon },
        },
        {
            to: '/games/word-search',
            title: 'Word Search',
            description: 'Find hidden words in a grid of letters',
            icon: GameIcons.wordSearch,
            color: '#10b981',
            stats: { played: wordSearchStats.gamesPlayed, won: wordSearchStats.gamesWon },
        },
        {
            to: '/games/wordle',
            title: 'Wordle',
            description: 'Guess the 5-letter word in 6 tries with color hints',
            icon: GameIcons.wordle,
            color: '#eab308',
            stats: { played: wordleStats.gamesPlayed, won: wordleStats.gamesWon },
        },
    ];

    // Calculate total stats
    const totalPlayed = games.reduce((acc, g) => acc + (g.stats?.played || 0), 0);
    const totalWon = games.reduce((acc, g) => acc + (g.stats?.won || 0), 0);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-elevated">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="w-9 h-9 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Games
                            </h1>
                            <p className="text-xs text-subtle hidden sm:block">
                                Challenge yourself with puzzles and classic games
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Stats summary */}
                        <div className="hidden sm:flex items-center gap-6 text-center">
                            <div>
                                <div className="text-lg font-bold text-accent">{games.length}</div>
                                <div className="text-xs text-subtle">Games</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-secondary">{totalPlayed}</div>
                                <div className="text-xs text-subtle">Played</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-tertiary">{totalWon}</div>
                                <div className="text-xs text-subtle">Won</div>
                            </div>
                        </div>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
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
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Games grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {games.map((game) => (
                            <GameCard key={game.to} {...game} />
                        ))}
                    </div>

                    {/* Mobile stats */}
                    <div className="sm:hidden mt-6 p-4 bg-surface rounded-xl border border-elevated">
                        <div className="flex justify-around text-center">
                            <div>
                                <div className="text-lg font-bold text-accent">{games.length}</div>
                                <div className="text-xs text-subtle">Games</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-secondary">{totalPlayed}</div>
                                <div className="text-xs text-subtle">Played</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-tertiary">{totalWon}</div>
                                <div className="text-xs text-subtle">Won</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
