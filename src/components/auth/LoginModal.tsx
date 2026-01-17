import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../lib/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { signIn, signUp, isConfigured } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, displayName);
                if (error) {
                    setError(error.message);
                } else {
                    setSuccess('Check your email for a confirmation link!');
                    // Don't close modal yet - let user see the message
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    onClose();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isConfigured) {
        return (
            <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={handleBackdropClick}
            >
                <div className="bg-surface border border-elevated rounded-2xl p-6 max-w-sm w-full">
                    <h2 className="text-xl font-bold text-text text-center mb-4">
                        Authentication Unavailable
                    </h2>
                    <p className="text-subtle text-center mb-4">
                        Cloud features are not configured. Your game progress will be saved locally.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-elevated rounded-lg text-text font-bold hover:bg-muted transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-surface border border-elevated rounded-2xl p-6 max-w-sm w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Benefits */}
                <div className="mb-6 p-4 bg-elevated/50 rounded-xl">
                    <p className="text-sm text-subtle mb-2">Sign in to:</p>
                    <ul className="text-sm text-text space-y-1">
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Sync progress across devices
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Compete on leaderboards
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Track streaks & achievements
                        </li>
                    </ul>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-elevated border border-muted rounded-lg text-text placeholder-subtle focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-subtle mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-3 bg-elevated border border-muted rounded-lg text-text placeholder-subtle focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-subtle mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-elevated border border-muted rounded-lg text-text placeholder-subtle focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                {/* Toggle sign up / sign in */}
                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setSuccess('');
                        }}
                        className="text-sm text-subtle hover:text-accent transition-colors"
                    >
                        {isSignUp
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Sign up"}
                    </button>
                </div>

                {/* Skip option */}
                <div className="mt-4 pt-4 border-t border-elevated text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-subtle hover:text-text transition-colors"
                    >
                        Continue without signing in
                    </button>
                </div>
            </div>
        </div>
    );
}
