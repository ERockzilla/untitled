import { useState, useEffect, useCallback } from 'react';

interface OnboardingHint {
    icon: string;
    title: string;
    description: string;
}

interface OnboardingOverlayProps {
    gameId: string;
    hints: readonly OnboardingHint[];
    onDismiss?: () => void;
}

/**
 * First-time onboarding overlay that shows how to play.
 * Stores "seen" state in localStorage so it only shows once per game.
 */
export function OnboardingOverlay({ gameId, hints, onDismiss }: OnboardingOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentHint, setCurrentHint] = useState(0);

    const storageKey = `onboarding_seen_${gameId}`;

    useEffect(() => {
        // Check if user has seen this onboarding
        const hasSeen = localStorage.getItem(storageKey);
        if (!hasSeen) {
            setIsVisible(true);
        }
    }, [storageKey]);

    const dismiss = useCallback(() => {
        localStorage.setItem(storageKey, 'true');
        setIsVisible(false);
        onDismiss?.();
    }, [storageKey, onDismiss]);

    const nextHint = useCallback(() => {
        if (currentHint < hints.length - 1) {
            setCurrentHint(c => c + 1);
        } else {
            dismiss();
        }
    }, [currentHint, hints.length, dismiss]);

    if (!isVisible || hints.length === 0) return null;

    const hint = hints[currentHint];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-elevated rounded-2xl p-6 shadow-2xl border border-muted animate-scale-in">
                {/* Progress dots */}
                {hints.length > 1 && (
                    <div className="flex justify-center gap-2 mb-4">
                        {hints.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${i === currentHint ? 'bg-accent' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Icon */}
                <div className="text-5xl text-center mb-4">{hint.icon}</div>

                {/* Title */}
                <h3 className="text-xl font-bold text-text text-center mb-2">
                    {hint.title}
                </h3>

                {/* Description */}
                <p className="text-subtle text-center mb-6">
                    {hint.description}
                </p>

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={dismiss}
                        className="flex-1 px-4 py-3 rounded-xl bg-surface text-subtle hover:bg-muted transition-colors text-sm font-medium"
                    >
                        Skip
                    </button>
                    <button
                        onClick={nextHint}
                        className="flex-1 px-4 py-3 rounded-xl bg-accent text-void hover:bg-accent/90 transition-colors text-sm font-medium"
                    >
                        {currentHint < hints.length - 1 ? 'Next' : 'Got it!'}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
        </div>
    );
}

/**
 * Predefined onboarding hints for each game
 */
export const GAME_HINTS = {
    tetris: [
        {
            icon: '👆',
            title: 'Tap to Rotate',
            description: 'Tap anywhere on the screen to rotate the falling piece.',
        },
        {
            icon: '👈👉',
            title: 'Swipe to Move',
            description: 'Swipe left or right to move the piece horizontally.',
        },
        {
            icon: '👇',
            title: 'Swipe Down to Drop',
            description: 'Swipe down quickly to hard drop the piece instantly.',
        },
        {
            icon: '👆',
            title: 'Swipe Up to Hold',
            description: 'Swipe up to save the current piece for later.',
        },
    ],
    sudoku: [
        {
            icon: '👆',
            title: 'Tap to Select',
            description: 'Tap any empty cell to select it, then tap a number to fill it in.',
        },
        {
            icon: '📝',
            title: 'Notes Mode',
            description: 'Toggle Notes mode to add pencil marks for possible numbers.',
        },
    ],
    wordsearch: [
        {
            icon: '👆',
            title: 'Drag to Find Words',
            description: 'Touch and drag your finger across letters to highlight words.',
        },
        {
            icon: '📋',
            title: 'Find All Words',
            description: 'Find all the hidden words to complete the puzzle!',
        },
    ],
    wordle: [
        {
            icon: '⌨️',
            title: 'Type Your Guess',
            description: 'Use the keyboard to type a 5-letter word guess.',
        },
        {
            icon: '🟩',
            title: 'Green = Correct',
            description: 'Green means the letter is in the correct position.',
        },
        {
            icon: '🟨',
            title: 'Yellow = Wrong Spot',
            description: 'Yellow means the letter is in the word but wrong position.',
        },
    ],
    puzzle: [
        {
            icon: '👆',
            title: 'Drag Pieces',
            description: 'Touch and drag puzzle pieces to the board.',
        },
        {
            icon: '🔄',
            title: 'Two-Finger Rotate',
            description: 'Use two fingers to rotate the selected piece.',
        },
    ],
    maze: [
        {
            icon: '📱',
            title: 'Tilt to Move',
            description: 'Calibrate and tilt your device to guide the ball.',
        },
        {
            icon: '🎮',
            title: 'Or Use D-Pad',
            description: 'Use the on-screen controls for precise movement.',
        },
    ],
} as const;
