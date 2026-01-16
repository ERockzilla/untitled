import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';

interface UserMenuProps {
    onLoginClick: () => void;
}

export function UserMenu({ onLoginClick }: UserMenuProps) {
    const { user, profile, loading, isConfigured, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="w-9 h-9 rounded-lg bg-elevated animate-pulse" />
        );
    }

    // Not logged in - show sign in button
    if (!user) {
        return (
            <button
                onClick={onLoginClick}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
            </button>
        );
    }

    // Logged in - show user menu
    const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-elevated hover:bg-muted transition-colors"
            >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                </div>
                <span className="hidden sm:inline text-sm text-text font-medium max-w-24 truncate">
                    {displayName}
                </span>
                <svg
                    className={`w-4 h-4 text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-elevated rounded-xl shadow-xl overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-elevated">
                        <p className="text-sm font-medium text-text truncate">{displayName}</p>
                        <p className="text-xs text-subtle truncate">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                        {!isConfigured && (
                            <div className="px-4 py-2 text-xs text-yellow-500 bg-yellow-500/10">
                                Cloud sync unavailable
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-subtle hover:text-text hover:bg-elevated transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
