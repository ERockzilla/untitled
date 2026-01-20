import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { loadGameStats, migrateLocalToCloud, needsMigration } from '../lib/gamesUtils';
import { loadProgress } from '../lib/puzzleUtils';
import { LoginModal } from '../components/auth/LoginModal';
import { UserMenu } from '../components/auth/UserMenu';

// Animated game icons - simulate gameplay on hover
const GameIcons = {
    puzzles: (
        <div className="relative w-12 h-12">
            {/* Animated jigsaw pieces sliding into place */}
            <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full">
                <g className="animate-puzzle-piece-1">
                    <rect x="4" y="4" width="18" height="18" rx="2" opacity="0.9" />
                </g>
                <g className="animate-puzzle-piece-2">
                    <rect x="26" y="4" width="18" height="18" rx="2" opacity="0.7" />
                </g>
                <g className="animate-puzzle-piece-3">
                    <rect x="4" y="26" width="18" height="18" rx="2" opacity="0.7" />
                </g>
                <g className="animate-puzzle-piece-4">
                    <rect x="26" y="26" width="18" height="18" rx="2" opacity="0.9" />
                </g>
                {/* Puzzle tabs */}
                <circle cx="24" cy="13" r="4" className="animate-pulse" />
                <circle cx="13" cy="24" r="4" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            </svg>
        </div>
    ),
    tetris: (
        <div className="relative w-12 h-12">
            {/* Animated falling blocks */}
            <svg viewBox="0 0 48 48" fill="currentColor" className="w-full h-full">
                <rect x="8" y="36" width="8" height="8" rx="1" opacity="0.9" />
                <rect x="16" y="36" width="8" height="8" rx="1" opacity="0.7" />
                <rect x="16" y="28" width="8" height="8" rx="1" opacity="0.8" />
                <rect x="24" y="36" width="8" height="8" rx="1" opacity="0.6" />
                <rect x="32" y="36" width="8" height="8" rx="1" opacity="0.9" />
                {/* Falling T-piece */}
                <g className="animate-tetris-fall">
                    <rect x="16" y="4" width="8" height="8" rx="1" opacity="0.9" />
                    <rect x="8" y="12" width="8" height="8" rx="1" opacity="0.9" />
                    <rect x="16" y="12" width="8" height="8" rx="1" opacity="0.9" />
                    <rect x="24" y="12" width="8" height="8" rx="1" opacity="0.9" />
                </g>
            </svg>
        </div>
    ),
    sudoku: (
        <div className="relative w-12 h-12">
            {/* Grid with appearing numbers */}
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <rect x="4" y="4" width="40" height="40" rx="3" />
                <line x1="17.33" y1="4" x2="17.33" y2="44" />
                <line x1="30.66" y1="4" x2="30.66" y2="44" />
                <line x1="4" y1="17.33" x2="44" y2="17.33" />
                <line x1="4" y1="30.66" x2="44" y2="30.66" />
                {/* Animated numbers */}
                <text x="9" y="14" fontSize="8" fill="currentColor" stroke="none" className="animate-fade-in" style={{ animationDelay: '0s' }}>1</text>
                <text x="22" y="27" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold" className="animate-fade-in" style={{ animationDelay: '0.3s' }}>5</text>
                <text x="35" y="40" fontSize="8" fill="currentColor" stroke="none" className="animate-fade-in" style={{ animationDelay: '0.6s' }}>9</text>
            </svg>
        </div>
    ),
    wordSearch: (
        <div className="relative w-12 h-12">
            {/* Grid with sweeping highlight */}
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <rect x="4" y="4" width="40" height="36" rx="3" />
                {/* Letters */}
                <text x="8" y="15" fontSize="6" fill="currentColor" stroke="none" fontFamily="monospace">W O R D</text>
                <text x="8" y="24" fontSize="6" fill="currentColor" stroke="none" fontFamily="monospace">X A B C</text>
                <text x="8" y="33" fontSize="6" fill="currentColor" stroke="none" fontFamily="monospace">S E A R</text>
                {/* Animated highlight line */}
                <line x1="6" y1="12" x2="38" y2="12" strokeWidth="6" stroke="currentColor" opacity="0.3" className="animate-word-highlight" />
                {/* Magnifying glass */}
                <circle cx="38" cy="38" r="6" strokeWidth="2" fill="none" />
                <line x1="42" y1="42" x2="46" y2="46" strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    ),
    wordle: (
        <div className="relative w-12 h-12">
            {/* Animated letter tiles flipping */}
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
                <rect x="2" y="17" width="10" height="10" rx="1.5" fill="#6aaa64" className="animate-tile-flip" style={{ animationDelay: '0s' }} />
                <rect x="14" y="17" width="10" height="10" rx="1.5" fill="#c9b458" className="animate-tile-flip" style={{ animationDelay: '0.1s' }} />
                <rect x="26" y="17" width="10" height="10" rx="1.5" fill="#787c7e" className="animate-tile-flip" style={{ animationDelay: '0.2s' }} />
                <rect x="38" y="17" width="8" height="10" rx="1.5" fill="#6aaa64" className="animate-tile-flip" style={{ animationDelay: '0.3s' }} />
                {/* Letters */}
                <text x="5" y="25" fontSize="6" fill="white" fontWeight="bold" className="animate-tile-flip" style={{ animationDelay: '0s' }}>W</text>
                <text x="17" y="25" fontSize="6" fill="white" fontWeight="bold" className="animate-tile-flip" style={{ animationDelay: '0.1s' }}>O</text>
                <text x="29" y="25" fontSize="6" fill="white" fontWeight="bold" className="animate-tile-flip" style={{ animationDelay: '0.2s' }}>R</text>
                <text x="40" y="25" fontSize="6" fill="white" fontWeight="bold" className="animate-tile-flip" style={{ animationDelay: '0.3s' }}>D</text>
            </svg>
        </div>
    ),
    maze: (
        <div className="relative w-12 h-12">
            {/* Maze with animated path */}
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                <rect x="4" y="4" width="40" height="40" rx="3" />
                {/* Maze walls */}
                <path d="M12 4 L12 20 M20 12 L20 28 M28 4 L28 20 M36 12 L36 36" opacity="0.5" />
                <path d="M4 12 L20 12 M12 20 L36 20 M4 28 L28 28 M20 36 L44 36" opacity="0.5" />
                {/* Animated runner dot */}
                <circle cx="8" cy="8" r="3" fill="currentColor" className="animate-maze-run" />
            </svg>
        </div>
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
                {/* Large animated icon area */}
                <div className="flex items-center justify-center mb-4 h-24 rounded-xl transition-all duration-300"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <div
                        className="p-4 rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{ color }}
                    >
                        {icon}
                    </div>
                </div>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <h3 className="text-lg font-bold text-text group-hover:text-accent transition-colors">
                            {title}
                        </h3>
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

                <p className="text-sm text-subtle mt-2">
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
    const { user } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    // Migrate local stats to cloud when user first signs in
    useEffect(() => {
        if (user && needsMigration()) {
            migrateLocalToCloud(user.id).then(({ error }) => {
                if (error) {
                    console.error('Migration error:', error);
                } else {
                    console.log('Local stats migrated to cloud successfully');
                }
            });
        }
    }, [user]);

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
        {
            to: '/games/maze',
            title: 'Maze Runner',
            description: 'Navigate procedural mazes with tilt controls or touch',
            icon: GameIcons.maze,
            color: '#64748b',
            stats: { played: 0, won: 0 },
        },
        {
            to: '/games/voxel-tetris',
            title: 'VoxTris 3D',
            description: '3D Tetris in a 6x6x14 voxel well. Rotate dimensions!',
            icon: (
                <div className="relative w-12 h-12">
                    {/* 3D Cube Icon */}
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                        <path d="M24 4L8 12V36L24 44L40 36V12L24 4Z" fill="none" className="stroke-current" />
                        <path d="M24 4V20M24 44V28M40 12L24 20L8 12M40 36L24 28L8 36" className="stroke-current opacity-60" />
                        {/* Inner falling cube */}
                        <g className="animate-tetris-fall">
                            <path d="M24 14L18 17V23L24 26L30 23V17L24 14Z" fill="currentColor" opacity="0.8" />
                        </g>
                    </svg>
                </div>
            ),
            color: '#8b5cf6',
            stats: { played: 0, won: 0 }, // TODO: Persist stats for VoxTris
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

                        {/* User menu */}
                        <UserMenu onLoginClick={() => setShowLogin(true)} />

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

            {/* Login modal */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
            />

            {/* Footer with credits */}
            <footer className="border-t border-elevated mt-auto">
                <div className="px-4 sm:px-6 py-4 text-center">
                    <p className="text-xs text-subtle">
                        Inspired by <span className="text-text font-medium">Georg Bauer</span> (Georgius Agricola)
                        &amp; his seminal work <em>De Re Metallica</em> (1556)
                    </p>
                    <p className="text-xs text-subtle mt-1">
                        🎵 Background vibes: <span className="text-text font-medium">Metallica - Orion</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
