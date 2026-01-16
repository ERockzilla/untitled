import { useState, useEffect, useCallback } from 'react';
import { getDailyWord, getRandomWord } from '../../lib/wordleWords';
import { launchConfetti, showAchievement, screenShake } from '../../lib/useEasterEggs';
import { hapticFeedback } from '../../lib/useTouchControls';

interface WordleProps {
    mode?: 'daily' | 'random';
    onComplete?: (won: boolean, attempts: number) => void;
}

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

interface GuessLetter {
    letter: string;
    state: LetterState;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

function evaluateGuess(guess: string, target: string): LetterState[] {
    const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
    const targetLetters = target.split('');
    const guessLetters = guess.split('');

    // First pass: mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = 'correct';
            targetLetters[i] = ''; // Mark as used
            guessLetters[i] = ''; // Mark as matched
        }
    }

    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessLetters[i] !== '') {
            const targetIndex = targetLetters.indexOf(guessLetters[i]);
            if (targetIndex !== -1) {
                result[i] = 'present';
                targetLetters[targetIndex] = ''; // Mark as used
            }
        }
    }

    return result;
}

export function Wordle({ mode = 'random', onComplete }: WordleProps) {
    const [targetWord, setTargetWord] = useState('');
    const [guesses, setGuesses] = useState<GuessLetter[][]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [keyboardState, setKeyboardState] = useState<Record<string, LetterState>>({});
    const [shake, setShake] = useState(false);
    const [message, setMessage] = useState('');
    const [revealRow, setRevealRow] = useState(-1);

    // Color-blind mode for accessibility (stores in localStorage)
    const [colorBlindMode, setColorBlindMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('wordle_colorblind') === 'true';
        }
        return false;
    });

    // Save color-blind preference
    const toggleColorBlind = useCallback(() => {
        setColorBlindMode(prev => {
            const newValue = !prev;
            localStorage.setItem('wordle_colorblind', String(newValue));
            return newValue;
        });
    }, []);

    // Initialize game
    const newGame = useCallback((gameMode: 'daily' | 'random') => {
        const word = gameMode === 'daily' ? getDailyWord() : getRandomWord();
        setTargetWord(word);
        setGuesses([]);
        setCurrentGuess('');
        setGameState('playing');
        setKeyboardState({});
        setMessage('');
        setRevealRow(-1);
    }, []);

    useEffect(() => {
        newGame(mode);
    }, [mode, newGame]);

    // Update keyboard state after guess
    const updateKeyboard = useCallback((guess: string, states: LetterState[]) => {
        setKeyboardState(prev => {
            const newState = { ...prev };
            for (let i = 0; i < guess.length; i++) {
                const letter = guess[i];
                const state = states[i];
                // Only upgrade state (absent -> present -> correct)
                if (!newState[letter] ||
                    (newState[letter] === 'absent' && state !== 'absent') ||
                    (newState[letter] === 'present' && state === 'correct')) {
                    newState[letter] = state;
                }
            }
            return newState;
        });
    }, []);

    // Submit guess
    const submitGuess = useCallback(() => {
        if (currentGuess.length !== WORD_LENGTH) {
            setMessage('Not enough letters');
            setShake(true);
            setTimeout(() => setShake(false), 300);
            return;
        }

        const states = evaluateGuess(currentGuess, targetWord);
        const newGuess: GuessLetter[] = currentGuess.split('').map((letter, i) => ({
            letter,
            state: states[i],
        }));

        setGuesses(prev => [...prev, newGuess]);
        setRevealRow(guesses.length);
        setCurrentGuess('');
        setMessage('');

        // Update keyboard after animation
        setTimeout(() => {
            updateKeyboard(currentGuess, states);
            setRevealRow(-1);

            // Check win/lose with celebrations!
            if (currentGuess === targetWord) {
                setGameState('won');
                hapticFeedback('heavy');
                launchConfetti({ particleCount: 200, spread: 100 });

                // Different achievements based on attempts
                const attempts = guesses.length + 1;
                if (attempts === 1) {
                    showAchievement('GENIUS!', 'First try!', '🧠');
                } else if (attempts === 2) {
                    showAchievement('Magnificent!', 'Got it in 2!', '🌟');
                } else if (attempts <= 4) {
                    showAchievement('Great!', `Solved in ${attempts} tries!`, '✨');
                } else {
                    showAchievement('Phew!', 'Close one!', '😅');
                }

                onComplete?.(true, attempts);
            } else if (guesses.length + 1 >= MAX_GUESSES) {
                setGameState('lost');
                screenShake('medium');
                setMessage(`The word was ${targetWord}`);
                onComplete?.(false, MAX_GUESSES);
            }
        }, WORD_LENGTH * 300 + 200);
    }, [currentGuess, targetWord, guesses.length, updateKeyboard, onComplete]);

    // Handle keyboard input
    const handleKey = useCallback((key: string) => {
        if (gameState !== 'playing') return;

        if (key === 'ENTER') {
            submitGuess();
        } else if (key === '⌫' || key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
            setMessage('');
        } else if (key.length === 1 && key.match(/[A-Z]/i) && currentGuess.length < WORD_LENGTH) {
            setCurrentGuess(prev => prev + key.toUpperCase());
            setMessage('');
        }
    }, [currentGuess, gameState, submitGuess]);

    // Physical keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) return;
            handleKey(e.key.toUpperCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKey]);

    // Get background color for letter state
    const getStateColor = (state: LetterState): string => {
        switch (state) {
            case 'correct': return 'bg-green-500';
            case 'present': return 'bg-yellow-500';
            case 'absent': return 'bg-gray-600';
            default: return 'bg-transparent';
        }
    };

    // Render board rows
    const renderBoard = () => {
        const rows = [];

        for (let i = 0; i < MAX_GUESSES; i++) {
            const guess = guesses[i];
            const isCurrentRow = i === guesses.length;
            const isRevealing = i === revealRow;

            const cells = [];
            for (let j = 0; j < WORD_LENGTH; j++) {
                let letter = '';
                let state: LetterState = 'empty';

                if (guess) {
                    letter = guess[j].letter;
                    state = guess[j].state;
                } else if (isCurrentRow && j < currentGuess.length) {
                    letter = currentGuess[j];
                    state = 'tbd';
                }

                cells.push(
                    <div
                        key={j}
                        className={`
              w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative
              text-2xl font-bold uppercase rounded-lg
              transition-all duration-300
              ${state === 'empty' ? 'border-2 border-muted' : ''}
              ${state === 'tbd' ? 'border-2 border-subtle bg-elevated' : ''}
              ${state !== 'empty' && state !== 'tbd' ? `${getStateColor(state)} text-white` : 'text-text'}
              ${isCurrentRow && shake ? 'animate-shake' : ''}
            `}
                        style={{
                            animationDelay: isRevealing ? `${j * 300}ms` : '0ms',
                            transform: isRevealing ? 'rotateX(0deg)' : undefined,
                        }}
                    >
                        {letter}
                        {/* Color-blind accessibility symbols */}
                        {colorBlindMode && state !== 'empty' && state !== 'tbd' && (
                            <span className="absolute bottom-0.5 right-1 text-[10px] opacity-70">
                                {state === 'correct' ? '✓' : state === 'present' ? '○' : '✗'}
                            </span>
                        )}
                    </div>
                );
            }

            rows.push(
                <div key={i} className="flex gap-1.5 justify-center">
                    {cells}
                </div>
            );
        }

        return rows;
    };

    // Render keyboard
    const renderKeyboard = () => {
        return KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map(key => {
                    const state = keyboardState[key];
                    const isWide = key === 'ENTER' || key === '⌫';

                    return (
                        <button
                            key={key}
                            onClick={() => handleKey(key)}
                            className={`
                ${isWide ? 'px-3 sm:px-4' : 'w-8 sm:w-10'} 
                h-12 sm:h-14 rounded-lg font-bold text-sm sm:text-base
                transition-colors
                ${state ? `${getStateColor(state)} text-white` : 'bg-elevated text-text hover:bg-muted'}
              `}
                        >
                            {key}
                        </button>
                    );
                })}
            </div>
        ));
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Message */}
            <div className="h-8 flex items-center justify-center">
                {message && (
                    <div className="px-4 py-2 bg-elevated rounded-lg text-text text-sm font-medium">
                        {message}
                    </div>
                )}
            </div>

            {/* Board */}
            <div className="flex flex-col gap-1.5">
                {renderBoard()}
            </div>

            {/* Win/Lose overlay buttons */}
            {gameState !== 'playing' && (
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => newGame(mode)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg text-white font-bold hover:scale-105 transition-transform"
                    >
                        Play Again
                    </button>
                    {mode === 'random' && (
                        <button
                            onClick={() => newGame('daily')}
                            className="px-6 py-3 bg-elevated rounded-lg text-text font-bold hover:bg-muted transition-colors"
                        >
                            Try Daily
                        </button>
                    )}
                </div>
            )}

            {/* Keyboard */}
            <div className="flex flex-col gap-1.5 mt-4">
                {renderKeyboard()}
            </div>

            {/* Color-blind mode toggle */}
            <button
                onClick={toggleColorBlind}
                className={`mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${colorBlindMode
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-elevated text-subtle hover:bg-muted'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Color-blind mode {colorBlindMode ? 'ON' : 'OFF'}
            </button>

            {/* Shake animation */}
            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
}
