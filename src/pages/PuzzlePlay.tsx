import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { JigsawPuzzle } from '../components/puzzle/JigsawPuzzle';
import { SlidingPuzzle } from '../components/puzzle/SlidingPuzzle';
import { useTheme } from '../lib/ThemeContext';
import type { Difficulty } from '../lib/puzzleUtils';
import { calculateGrid, markComplete, DIFFICULTY_CONFIGS } from '../lib/puzzleUtils';

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

export function PuzzlePlay() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get params from URL
    const imageId = searchParams.get('image') || 'puzzle1';
    const mode = (searchParams.get('mode') as PuzzleMode) || 'sliding';
    const difficulty = (searchParams.get('difficulty') as Difficulty) || 'medium';

    const selectedImage = PUZZLE_IMAGES.find(img => img.id === imageId) || PUZZLE_IMAGES[0];

    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [showCongrats, setShowCongrats] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    // Load image dimensions
    useEffect(() => {
        setImageDimensions(null);

        const img = new Image();
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            console.error('Failed to load image:', selectedImage.src);
            setImageDimensions({ width: 800, height: 600 });
        };
        img.src = selectedImage.src;

        if (img.complete && img.naturalWidth > 0) {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        }
    }, [selectedImage]);

    // Calculate puzzle config
    const puzzleConfig = useMemo(() => {
        if (!imageDimensions) return null;
        return calculateGrid(imageDimensions.width, imageDimensions.height, difficulty);
    }, [imageDimensions, difficulty]);

    const handleComplete = useCallback(() => {
        markComplete(selectedImage.id, mode);
        setShowCongrats(true);
    }, [selectedImage, mode]);

    const handleReset = useCallback(() => {
        setResetKey(k => k + 1);
    }, []);

    const handleBack = () => {
        navigate('/puzzle');
    };

    const handlePlayAgain = () => {
        setShowCongrats(false);
        setResetKey(k => k + 1);
    };

    const handleNextPuzzle = () => {
        setShowCongrats(false);
        navigate('/puzzle');
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-void)' }}>
            {/* Minimal Header */}
            <header className="flex items-center justify-between px-3 py-2 border-b border-elevated">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-elevated hover:bg-muted transition-colors text-text"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                </button>

                <div className="flex items-center gap-2 text-sm">
                    <span className="text-subtle">{mode === 'jigsaw' ? '🧩' : '🔲'}</span>
                    <span className="text-text font-medium">{selectedImage.name}</span>
                    <span className="text-subtle">•</span>
                    <span className="text-subtle">{DIFFICULTY_CONFIGS[difficulty].label}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="px-3 py-2 rounded-lg bg-elevated hover:bg-muted transition-colors text-sm text-text"
                        title="Reset puzzle"
                    >
                        ↻
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                    >
                        {theme === 'light' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Puzzle Area - Full screen */}
            <main className="flex-1 flex flex-col items-center justify-center p-3 overflow-auto">
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
                    <div className="text-subtle animate-pulse">Loading puzzle...</div>
                )}
            </main>

            {/* Congratulations Modal */}
            {showCongrats && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowCongrats(false)}
                >
                    <div
                        className="bg-surface border border-elevated rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center transform animate-bounce-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-text mb-2">Congratulations!</h2>
                        <p className="text-subtle mb-6">
                            You completed the {mode === 'jigsaw' ? 'Jigsaw' : 'Sliding'} puzzle!
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleNextPuzzle}
                                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-void font-bold transition-all hover:shadow-lg"
                            >
                                Choose Another Puzzle
                            </button>
                            <button
                                onClick={handlePlayAgain}
                                className="w-full px-6 py-3 rounded-xl bg-elevated hover:bg-muted text-text font-medium transition-colors"
                            >
                                Play Again
                            </button>
                        </div>
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
