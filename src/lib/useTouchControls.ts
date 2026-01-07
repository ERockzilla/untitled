import { useRef, useCallback, useEffect } from 'react';

interface TouchControlsOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onTap?: (x: number, y: number) => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
    threshold?: number; // Minimum swipe distance
    longPressDelay?: number;
}

interface TouchState {
    startX: number;
    startY: number;
    startTime: number;
    lastTapTime: number;
}

export function useTouchControls(
    elementRef: React.RefObject<HTMLElement | null>,
    options: TouchControlsOptions
) {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        onTap,
        onDoubleTap,
        onLongPress,
        threshold = 50,
        longPressDelay = 500,
    } = options;

    const touchState = useRef<TouchState>({
        startX: 0,
        startY: 0,
        startTime: 0,
        lastTapTime: 0,
    });
    const longPressTimeout = useRef<number | null>(null);

    const clearLongPress = useCallback(() => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        touchState.current = {
            ...touchState.current,
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
        };

        // Set up long press detection
        if (onLongPress) {
            longPressTimeout.current = window.setTimeout(() => {
                onLongPress();
                // Vibrate for haptic feedback if available
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            }, longPressDelay);
        }
    }, [onLongPress, longPressDelay]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        // Cancel long press if finger moves
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchState.current.startX);
        const dy = Math.abs(touch.clientY - touchState.current.startY);

        if (dx > 10 || dy > 10) {
            clearLongPress();
        }
    }, [clearLongPress]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        clearLongPress();

        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchState.current.startX;
        const dy = touch.clientY - touchState.current.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const elapsed = Date.now() - touchState.current.startTime;

        // Check for swipes (must be fast enough - under 300ms)
        if (elapsed < 300) {
            if (absDx > threshold && absDx > absDy) {
                // Horizontal swipe
                if (dx > 0) {
                    onSwipeRight?.();
                } else {
                    onSwipeLeft?.();
                }
                // Haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
                return;
            } else if (absDy > threshold && absDy > absDx) {
                // Vertical swipe
                if (dy > 0) {
                    onSwipeDown?.();
                } else {
                    onSwipeUp?.();
                }
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
                return;
            }
        }

        // Check for tap (small movement, quick touch)
        if (absDx < 10 && absDy < 10 && elapsed < 200) {
            const now = Date.now();
            const timeSinceLastTap = now - touchState.current.lastTapTime;

            if (timeSinceLastTap < 300 && onDoubleTap) {
                onDoubleTap();
                touchState.current.lastTapTime = 0;
            } else {
                onTap?.(touch.clientX, touch.clientY);
                touchState.current.lastTapTime = now;
            }
        }
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, threshold, clearLongPress]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            clearLongPress();
        };
    }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPress]);
}

// Utility to detect mobile
export function useIsMobile(): boolean {
    if (typeof window === 'undefined') return false;

    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return hasTouchScreen && isSmallScreen;
}

// Haptic feedback utility
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (!('vibrate' in navigator)) return;

    switch (type) {
        case 'light':
            navigator.vibrate(10);
            break;
        case 'medium':
            navigator.vibrate(25);
            break;
        case 'heavy':
            navigator.vibrate([50, 30, 50]);
            break;
    }
}
