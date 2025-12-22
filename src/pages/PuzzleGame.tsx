import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { JigsawPuzzle } from '../components/puzzle/JigsawPuzzle';
import { SlidingPuzzle } from '../components/puzzle/SlidingPuzzle';
import { useTheme } from '../lib/ThemeContext';
import type {
    PuzzleProgress,
    Difficulty,
} from '../lib/puzzleUtils';
import {
    calculateGrid,
    loadProgress,
    markComplete,
    DIFFICULTY_CONFIGS,
} from '../lib/puzzleUtils';

// Available puzzle images
const PUZZLE_IMAGES = [
    { id: 'puzzle1', src: '/puzzles/puzzle1.jpg', name: 'Puzzle 1' },
    { id: 'puzzle2', src: '/puzzles/puzzle2.jpg', name: 'Puzzle 2' },
    { id: 'puzzle3', src: '/puzzles/puzzle3.jpg', name: 'Puzzle 3' },
    { id: 'puzzle4', src: '/puzzles/puzzle4.jpg', name: 'Puzzle 4' },
    { id: 'puzzle5', src: '/puzzles/puzzle5.jpg', name: 'Puzzle 5' },
    { id: 'puzzle6', src: '/puzzles/puzzle6.jpg', name: 'Puzzle 6' },
];

type PuzzleMode = 'jigsaw' | 'sliding';

export function PuzzleGame() {
    const { theme, toggleTheme } = useTheme();
    const [selectedImage, setSelectedImage] = useState(PUZZLE_IMAGES[0]);
    const [mode, setMode] = useState<PuzzleMode>('sliding');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [progress, setProgress] = useState<PuzzleProgress>({});
    const [showCongrats, setShowCongrats] = useState(false);
    const [showMasterCongrats, setShowMasterCongrats] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    // Load progress on mount
    useEffect(() => {
        setProgress(loadProgress());
    }, []);

    // Load image dimensions when image changes
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = selectedImage.src;
    }, [selectedImage]);

    // Calculate puzzle config based on image dimensions and difficulty
    const puzzleConfig = useMemo(() => {
        if (!imageDimensions) return null;
        return calculateGrid(imageDimensions.width, imageDimensions.height, difficulty);
    }, [imageDimensions, difficulty]);



    // Total progress
    const progressStats = useMemo(() => {
        let completed = 0;
        const total = PUZZLE_IMAGES.length * 2; // 2 modes per image

        PUZZLE_IMAGES.forEach(img => {
            const p = progress[img.id];
            if (p?.jigsaw) completed++;
            if (p?.sliding) completed++;
        });

        return { completed, total };
    }, [progress]);

    const handleComplete = useCallback(() => {
        const newProgress = markComplete(selectedImage.id, mode);
        setProgress(newProgress);
        setShowCongrats(true);

        // Check for master completion
        const allDone = PUZZLE_IMAGES.every(img => {
            const p = newProgress[img.id];
            return p && p.jigsaw && p.sliding;
        });

        if (allDone) {
            setTimeout(() => {
                setShowCongrats(false);
                setShowMasterCongrats(true);
            }, 2000);
        }
    }, [selectedImage, mode]);

    const handleReset = useCallback(() => {
        setResetKey(k => k + 1);
    }, []);

    const isCurrentComplete = progress[selectedImage.id]?.[mode] || false;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-elevated gap-2">
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link
                        to="/"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--color-accent, #06b6d4)' }}>
                            Interactive Puzzles
                        </h1>
                        <p className="text-xs sm:text-sm text-subtle">
                            {progressStats.completed} / {progressStats.total} completed
                        </p>
                    </div>
                </div>

                {/* Progress indicator - hidden on very small screens */}
                <div className="hidden sm:flex items-center gap-2">
                    {PUZZLE_IMAGES.map(img => {
                        const p = progress[img.id];
                        const jigsawDone = p?.jigsaw;
                        const slidingDone = p?.sliding;
                        return (
                            <div key={img.id} className="flex gap-0.5">
                                <div
                                    className={`w-3 h-3 rounded-sm ${jigsawDone ? 'bg-green-500' : 'bg-elevated'}`}
                                    title={`${img.name} Jigsaw`}
                                />
                                <div
                                    className={`w-3 h-3 rounded-sm ${slidingDone ? 'bg-green-500' : 'bg-elevated'}`}
                                    title={`${img.name} Sliding`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Theme toggle button */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text theme-toggle"
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
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Puzzle area */}
                <div className="flex-1 flex flex-col items-center justify-start lg:justify-center p-4 sm:p-6 overflow-auto">
                    {puzzleConfig ? (
                        <div className="w-full max-w-2xl">
                            {mode === 'jigsaw' ? (
                                <JigsawPuzzle
                                    key={`jigsaw-${selectedImage.id}-${difficulty}-${resetKey}`}
                                    imageUrl={selectedImage.src}
                                    config={puzzleConfig}
                                    onComplete={handleComplete}
                                />
                            ) : (
                                <SlidingPuzzle
                                    key={`sliding-${selectedImage.id}-${difficulty}-${resetKey}`}
                                    imageUrl={selectedImage.src}
                                    config={puzzleConfig}
                                    onComplete={handleComplete}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="text-subtle animate-pulse">Loading image...</div>
                    )}
                </div>

                {/* Controls sidebar */}
                <aside className="w-full lg:w-72 xl:w-80 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-elevated overflow-auto">
                    <div className="space-y-4 sm:space-y-6">
                        {/* Image selector */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-3">
                                Select Image
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {PUZZLE_IMAGES.map(img => {
                                    const p = progress[img.id];
                                    const bothDone = p?.jigsaw && p?.sliding;
                                    const isSelected = selectedImage.id === img.id;

                                    return (
                                        <button
                                            key={img.id}
                                            onClick={() => setSelectedImage(img)}
                                            className={`relative aspect-square rounded-lg overflow-hidden transition-all ${isSelected
                                                ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-void scale-105'
                                                : 'hover:scale-105 opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img
                                                src={img.src}
                                                alt={img.name}
                                                className="w-full h-full object-cover"
                                            />
                                            {bothDone && (
                                                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                                    <span className="text-lg">✓</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Puzzle mode */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-3">
                                Puzzle Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['jigsaw', 'sliding'] as const).map(m => {
                                    const isDone = progress[selectedImage.id]?.[m];
                                    return (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`px-4 py-3 rounded-lg text-sm transition-all ${mode === m
                                                ? 'bg-cyan-500 text-void font-medium'
                                                : 'bg-elevated text-text hover:bg-muted'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {m === 'jigsaw' ? '🧩' : '🔲'}
                                                <span className="capitalize">{m}</span>
                                                {isDone && <span className="text-green-400">✓</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-3">
                                Difficulty
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`px-3 py-2 rounded-lg text-sm transition-all ${difficulty === d
                                            ? 'bg-cyan-500 text-void font-medium'
                                            : 'bg-elevated text-text hover:bg-muted'
                                            }`}
                                    >
                                        {DIFFICULTY_CONFIGS[d].label}
                                    </button>
                                ))}
                            </div>
                            {puzzleConfig && (
                                <p className="text-xs text-subtle mt-2">
                                    Grid: {puzzleConfig.cols} × {puzzleConfig.rows} = {puzzleConfig.cols * puzzleConfig.rows} pieces
                                </p>
                            )}
                        </div>

                        {/* Reset button */}
                        <button
                            onClick={handleReset}
                            className="w-full px-4 py-3 rounded-lg bg-elevated hover:bg-muted text-text transition-colors"
                        >
                            Reset Current Puzzle
                        </button>

                        {/* Current status */}
                        {isCurrentComplete && (
                            <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                                <div className="flex items-center gap-2 text-green-400">
                                    <span>✓</span>
                                    <span className="text-sm font-medium">
                                        {selectedImage.name} {mode} completed!
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="p-4 bg-elevated rounded-lg">
                            <h3 className="text-sm font-medium text-text mb-2">How to Play</h3>
                            {mode === 'jigsaw' ? (
                                <ul className="text-xs text-subtle space-y-1">
                                    <li>• Click a piece to select it</li>
                                    <li>• Use arrow keys to rotate 90°</li>
                                    <li>• Drag pieces to the correct spot</li>
                                    <li>• Pieces must be correctly rotated to snap</li>
                                </ul>
                            ) : (
                                <ul className="text-xs text-subtle space-y-1">
                                    <li>• Click tiles adjacent to the empty space</li>
                                    <li>• Or use arrow keys to slide tiles</li>
                                    <li>• Arrange all tiles in order</li>
                                </ul>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* Congratulations Modal */}
            {showCongrats && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setShowCongrats(false)}
                >
                    <div
                        className="bg-surface border border-elevated rounded-2xl p-8 max-w-md mx-4 text-center transform animate-bounce-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-text mb-2">Congratulations!</h2>
                        <p className="text-subtle mb-6">
                            You completed the {mode === 'jigsaw' ? 'Jigsaw' : 'Sliding'} puzzle for {selectedImage.name}!
                        </p>
                        <button
                            onClick={() => setShowCongrats(false)}
                            className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-void font-medium transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Master Congratulations Modal */}
            {showMasterCongrats && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
                    onClick={() => setShowMasterCongrats(false)}
                >
                    <div
                        className="bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 border border-yellow-500/30 rounded-2xl p-8 max-w-md mx-4 text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-bold text-yellow-400 mb-2">MASTER PUZZLER!</h2>
                        <p className="text-text mb-6">
                            Incredible! You've completed ALL puzzles in BOTH modes!
                        </p>
                        <div className="flex justify-center gap-2 mb-6">
                            {['🧩', '🔲', '⭐', '🎯', '🏆'].map((emoji, i) => (
                                <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                                    {emoji}
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowMasterCongrats(false)}
                            className="px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-cyan-500 text-void font-bold transition-all hover:scale-105"
                        >
                            Amazing!
                        </button>
                    </div>
                </div>
            )}

            {/* Animation keyframes */}
            <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}
