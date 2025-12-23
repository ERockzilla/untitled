import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MazeRunner } from '../components/maze/MazeRunner';
import { MazeRunner3D } from '../components/maze/MazeRunner3D';
import type { CharacterType, Difficulty } from '../lib/mazeUtils';
import { saveScore, formatTime, MAZE_CONFIGS, CHARACTERS } from '../lib/mazeUtils';

export function MazePlay() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get params from URL
    const size = parseInt(searchParams.get('size') || '12');
    const character = (searchParams.get('character') as CharacterType) || 'ball';
    const controlMode = (searchParams.get('controls') as 'tilt' | 'touch') || 'tilt';
    const difficulty = (searchParams.get('difficulty') as Difficulty) || 'medium';
    const viewMode = (searchParams.get('view') as '2d' | '3d') || '2d';

    const [showVictory, setShowVictory] = useState(false);
    const [completionTime, setCompletionTime] = useState(0);

    const handleComplete = useCallback((time: number) => {
        setCompletionTime(time);
        setShowVictory(true);
        saveScore(difficulty, time);
    }, [difficulty]);

    const handleBack = useCallback(() => {
        navigate('/maze');
    }, [navigate]);

    const handlePlayAgain = () => {
        setShowVictory(false);
        // Force re-mount by navigating to same page
        const params = new URLSearchParams({
            size: size.toString(),
            character,
            controls: controlMode,
            difficulty,
            view: viewMode,
        });
        navigate(`/maze/play?${params.toString()}&t=${Date.now()}`, { replace: true });
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-void)' }}>
            {viewMode === '3d' ? (
                <MazeRunner3D
                    size={size}
                    character={character}
                    controlMode={controlMode}
                    loopFactor={MAZE_CONFIGS[difficulty].loopFactor}
                    onComplete={handleComplete}
                    onBack={handleBack}
                />
            ) : (
                <MazeRunner
                    size={size}
                    character={character}
                    controlMode={controlMode}
                    loopFactor={MAZE_CONFIGS[difficulty].loopFactor}
                    onComplete={handleComplete}
                    onBack={handleBack}
                />
            )}

            {/* Victory Modal */}
            {showVictory && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowVictory(false)}
                >
                    <div
                        className="bg-surface border border-elevated rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center transform animate-bounce-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-text mb-2">Maze Complete!</h2>
                        <div className="text-4xl font-mono font-bold text-cyan-400 mb-2">
                            {formatTime(completionTime)}
                        </div>
                        <p className="text-subtle mb-6">
                            {MAZE_CONFIGS[difficulty].description} maze with {CHARACTERS[character].emoji}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handlePlayAgain}
                                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-void font-bold transition-all hover:shadow-lg"
                            >
                                🔄 New Maze
                            </button>
                            <button
                                onClick={handleBack}
                                className="w-full px-6 py-3 rounded-xl bg-elevated hover:bg-muted text-text font-medium transition-colors"
                            >
                                📋 Change Settings
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
