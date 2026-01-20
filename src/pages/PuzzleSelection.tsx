import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import type { PuzzleProgress, Difficulty } from '../lib/puzzleUtils';
import { loadProgress, DIFFICULTY_CONFIGS } from '../lib/puzzleUtils';

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

export function PuzzleSelection() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [mode, setMode] = useState<PuzzleMode>('jigsaw');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [progress, setProgress] = useState<PuzzleProgress>({});

    // Load progress on mount
    useEffect(() => {
        setProgress(loadProgress());
    }, []);

    // Total progress stats
    const progressStats = useMemo(() => {
        let completed = 0;
        const total = PUZZLE_IMAGES.length * 2;

        PUZZLE_IMAGES.forEach(img => {
            const p = progress[img.id];
            if (p?.jigsaw) completed++;
            if (p?.sliding) completed++;
        });

        return { completed, total };
    }, [progress]);

    const handleStartPuzzle = () => {
        if (!selectedImage) return;
        const params = new URLSearchParams({
            image: selectedImage,
            mode,
            difficulty,
        });
        navigate(`/puzzle/play?${params.toString()}`);
    };

    const selectedImageData = PUZZLE_IMAGES.find(img => img.id === selectedImage);

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
                            🧩 Puzzles
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-tertiary font-bold">{progressStats.completed}</span>
                            <span className="text-subtle">/{progressStats.total} done</span>
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
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
                <div className="max-w-lg mx-auto space-y-6">
                    {/* Step 1: Select Image */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">1</span>
                            Choose an Image
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            {PUZZLE_IMAGES.map(img => {
                                const p = progress[img.id];
                                const bothDone = p?.jigsaw && p?.sliding;
                                const currentModeDone = p?.[mode];
                                const isSelected = selectedImage === img.id;

                                return (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(img.id)}
                                        className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${isSelected
                                            ? 'ring-3 ring-cyan-400 scale-105 shadow-lg shadow-cyan-500/20'
                                            : 'opacity-80 hover:opacity-100 hover:scale-102'
                                            }`}
                                    >
                                        <img
                                            src={img.src}
                                            alt={img.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Progress overlay */}
                                        {bothDone && (
                                            <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                                                <span className="text-2xl">✓</span>
                                            </div>
                                        )}
                                        {!bothDone && currentModeDone && (
                                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                <span className="text-xs">✓</span>
                                            </div>
                                        )}
                                        {/* Selection indicator */}
                                        {isSelected && (
                                            <div className="absolute inset-0 border-4 border-cyan-400 rounded-xl pointer-events-none" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Step 2: Select Mode */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">2</span>
                            Choose Puzzle Type
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {(['sliding', 'jigsaw'] as const).map(m => {
                                const isSelected = mode === m;
                                const isDone = selectedImage ? progress[selectedImage]?.[m] : false;

                                return (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className={`p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${isSelected
                                            ? 'bg-cyan-500 text-void shadow-lg'
                                            : 'bg-elevated text-text hover:bg-muted'
                                            }`}
                                    >
                                        <span className="text-3xl">{m === 'jigsaw' ? '🧩' : '🔲'}</span>
                                        <span className="font-medium capitalize">{m}</span>
                                        {isDone && (
                                            <span className={`text-xs ${isSelected ? 'text-void/70' : 'text-green-400'}`}>
                                                ✓ Completed
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {mode === 'jigsaw' && (
                            <p className="text-xs text-subtle mt-2 text-center">
                                Rotate pieces with the buttons while solving
                            </p>
                        )}
                    </section>

                    {/* Step 3: Select Difficulty */}
                    <section>
                        <h2 className="text-sm font-semibold text-subtle mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-cyan-500 text-void text-xs flex items-center justify-center font-bold">3</span>
                            Choose Difficulty
                        </h2>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`p-3 rounded-xl text-sm transition-all duration-200 ${difficulty === d
                                        ? 'bg-cyan-500 text-void font-medium shadow-lg'
                                        : 'bg-elevated text-text hover:bg-muted'
                                        }`}
                                >
                                    <div className="font-medium capitalize">{d}</div>
                                    <div className={`text-xs mt-1 ${difficulty === d ? 'text-void/70' : 'text-subtle'}`}>
                                        Lvl {DIFFICULTY_CONFIGS[d].label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Selected Preview */}
                    {selectedImageData && (
                        <section className="p-4 rounded-xl bg-elevated/50 border border-elevated">
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedImageData.src}
                                    alt={selectedImageData.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                    <div className="text-text font-medium">
                                        {selectedImageData.name}
                                    </div>
                                    <div className="text-sm text-subtle">
                                        {mode === 'jigsaw' ? '🧩 Jigsaw' : '🔲 Sliding'} • {DIFFICULTY_CONFIGS[difficulty].label}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Start Button - Fixed at bottom */}
            <div className="sticky bottom-0 p-4 bg-gradient-to-t from-void via-void to-transparent">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleStartPuzzle}
                        disabled={!selectedImage}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${selectedImage
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-void shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-elevated text-subtle cursor-not-allowed'
                            }`}
                    >
                        {selectedImage ? '🎮 Start Puzzle' : 'Select an image to start'}
                    </button>
                </div>
            </div>
        </div>
    );
}
