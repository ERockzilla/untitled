import { useEffect, useRef } from 'react';

/**
 * Hook to auto-pause games when the browser tab/window loses focus.
 * Implements best practice from benchmark apps - games should pause when user switches away.
 */
export function useAutoPause(
    isPlaying: boolean,
    isPaused: boolean,
    setIsPaused: (paused: boolean) => void
) {
    // Track if we auto-paused (vs user manually paused)
    const wasAutoPaused = useRef(false);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isPlaying && !isPaused) {
                // Page is now hidden and game is playing - auto-pause
                wasAutoPaused.current = true;
                setIsPaused(true);
            } else if (!document.hidden && wasAutoPaused.current) {
                // Page is visible again and we auto-paused - could auto-resume
                // For now, keep paused and let user manually resume (UX best practice)
                wasAutoPaused.current = false;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isPlaying, isPaused, setIsPaused]);
}

/**
 * Hook to detect if user prefers reduced motion (accessibility).
 * Used to disable animations for users with vestibular disorders.
 */
export function usePrefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
