
import React from 'react';

interface GameIntroProps {
    title: string;
    description: string;
    onStart: () => void;
}

export function GameIntro({ title, description, onStart }: GameIntroProps) {
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-elevated border border-muted p-8 rounded-2xl max-w-md text-center shadow-2xl animate-fade-in">
                <h2 className="text-3xl font-bold mb-4 text-gradient">{title}</h2>
                <p className="text-subtle mb-6 text-lg leading-relaxed">
                    {description}
                </p>
                <button
                    onClick={onStart}
                    className="px-8 py-3 bg-accent text-void font-bold rounded-lg hover:bg-accent-muted transition-all hover:scale-105 active:scale-95"
                >
                    Start Game
                </button>
            </div>
        </div>
    );
}
