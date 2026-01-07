import { useState, useCallback } from 'react';
import { hapticFeedback } from '../../lib/useTouchControls';

interface TouchControlsProps {
    onMove: (direction: 'left' | 'right' | 'up' | 'down') => void;
    onAction1?: () => void; // e.g., rotate in Tetris
    onAction2?: () => void; // e.g., hard drop in Tetris
    onPause?: () => void;
    action1Label?: string;
    action2Label?: string;
    showDpad?: boolean;
    layout?: 'horizontal' | 'vertical';
    size?: 'small' | 'medium' | 'large';
}

export function TouchControls({
    onMove,
    onAction1,
    onAction2,
    onPause,
    action1Label = '↻',
    action2Label = '⬇',
    showDpad = true,
    layout = 'horizontal',
    size = 'medium',
}: TouchControlsProps) {
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [moveInterval, setMoveInterval] = useState<number | null>(null);

    // Sizes adjusted to meet 48px minimum touch target (accessibility best practice)
    const buttonSizes = {
        small: { dpad: 140, action: 52 },   // dpad buttons = 140 * 0.35 = 49px
        medium: { dpad: 150, action: 60 },  // dpad buttons = 150 * 0.35 = 52px
        large: { dpad: 170, action: 68 },   // dpad buttons = 170 * 0.35 = 60px
    };

    const { dpad: dpadSize, action: actionSize } = buttonSizes[size];
    const buttonSize = Math.max(48, dpadSize * 0.35); // Ensure 48px minimum
    const centerOffset = (dpadSize - buttonSize) / 2;

    // Handle button press with haptic feedback and continuous movement
    const handlePress = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
        hapticFeedback('light');
        setActiveButton(direction);
        onMove(direction);

        // Start continuous movement after initial delay
        const initialDelay = setTimeout(() => {
            const interval = setInterval(() => {
                onMove(direction);
            }, 80) as unknown as number;
            setMoveInterval(interval);
        }, 150);

        // Store timeout ID for cleanup
        setMoveInterval(initialDelay as unknown as number);
    }, [onMove]);

    const handleRelease = useCallback(() => {
        setActiveButton(null);
        if (moveInterval) {
            clearInterval(moveInterval);
            clearTimeout(moveInterval);
            setMoveInterval(null);
        }
    }, [moveInterval]);

    const handleAction = useCallback((action: (() => void) | undefined) => {
        if (action) {
            hapticFeedback('medium');
            action();
        }
    }, []);

    const getButtonStyle = (isActive: boolean) => ({
        width: buttonSize,
        height: buttonSize,
        backgroundColor: isActive
            ? 'rgba(6, 182, 212, 0.9)'
            : 'rgba(6, 182, 212, 0.4)',
        border: '2px solid rgba(6, 182, 212, 0.6)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: buttonSize * 0.45,
        color: '#fff',
        touchAction: 'none',
        userSelect: 'none' as const,
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        transform: isActive ? 'scale(0.95)' : 'scale(1)',
        boxShadow: isActive
            ? '0 0 20px rgba(6, 182, 212, 0.5), inset 0 0 10px rgba(255,255,255,0.2)'
            : '0 4px 15px rgba(0,0,0,0.3)',
    });

    const getActionButtonStyle = (isActive: boolean) => ({
        width: actionSize,
        height: actionSize,
        backgroundColor: isActive
            ? 'rgba(139, 92, 246, 0.9)'
            : 'rgba(139, 92, 246, 0.4)',
        border: '2px solid rgba(139, 92, 246, 0.6)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: actionSize * 0.4,
        color: '#fff',
        touchAction: 'none',
        userSelect: 'none' as const,
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        transform: isActive ? 'scale(0.9)' : 'scale(1)',
        boxShadow: isActive
            ? '0 0 20px rgba(139, 92, 246, 0.5)'
            : '0 4px 15px rgba(0,0,0,0.3)',
        fontWeight: 'bold',
    });

    return (
        <div
            className={`flex ${layout === 'horizontal' ? 'flex-row' : 'flex-col'} items-center justify-center gap-8 w-full px-4 py-2`}
            style={{ touchAction: 'none' }}
        >
            {/* D-Pad */}
            {showDpad && (
                <div
                    style={{
                        position: 'relative',
                        width: dpadSize,
                        height: dpadSize,
                        flexShrink: 0,
                    }}
                >
                    {/* Up */}
                    <button
                        style={{
                            ...getButtonStyle(activeButton === 'up'),
                            position: 'absolute',
                            left: centerOffset,
                            top: 0,
                        }}
                        onTouchStart={(e) => { e.preventDefault(); handlePress('up'); }}
                        onTouchEnd={handleRelease}
                        onTouchCancel={handleRelease}
                        onMouseDown={() => handlePress('up')}
                        onMouseUp={handleRelease}
                        onMouseLeave={handleRelease}
                    >
                        ▲
                    </button>

                    {/* Down */}
                    <button
                        style={{
                            ...getButtonStyle(activeButton === 'down'),
                            position: 'absolute',
                            left: centerOffset,
                            bottom: 0,
                        }}
                        onTouchStart={(e) => { e.preventDefault(); handlePress('down'); }}
                        onTouchEnd={handleRelease}
                        onTouchCancel={handleRelease}
                        onMouseDown={() => handlePress('down')}
                        onMouseUp={handleRelease}
                        onMouseLeave={handleRelease}
                    >
                        ▼
                    </button>

                    {/* Left */}
                    <button
                        style={{
                            ...getButtonStyle(activeButton === 'left'),
                            position: 'absolute',
                            left: 0,
                            top: centerOffset,
                        }}
                        onTouchStart={(e) => { e.preventDefault(); handlePress('left'); }}
                        onTouchEnd={handleRelease}
                        onTouchCancel={handleRelease}
                        onMouseDown={() => handlePress('left')}
                        onMouseUp={handleRelease}
                        onMouseLeave={handleRelease}
                    >
                        ◀
                    </button>

                    {/* Right */}
                    <button
                        style={{
                            ...getButtonStyle(activeButton === 'right'),
                            position: 'absolute',
                            right: 0,
                            top: centerOffset,
                        }}
                        onTouchStart={(e) => { e.preventDefault(); handlePress('right'); }}
                        onTouchEnd={handleRelease}
                        onTouchCancel={handleRelease}
                        onMouseDown={() => handlePress('right')}
                        onMouseUp={handleRelease}
                        onMouseLeave={handleRelease}
                    >
                        ▶
                    </button>

                    {/* Center decoration */}
                    <div
                        style={{
                            position: 'absolute',
                            left: centerOffset,
                            top: centerOffset,
                            width: buttonSize,
                            height: buttonSize,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.2)',
                        }}
                    />
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 items-center">
                {onAction1 && (
                    <button
                        style={getActionButtonStyle(activeButton === 'action1')}
                        onTouchStart={(e) => { e.preventDefault(); setActiveButton('action1'); handleAction(onAction1); }}
                        onTouchEnd={() => setActiveButton(null)}
                        onMouseDown={() => { setActiveButton('action1'); handleAction(onAction1); }}
                        onMouseUp={() => setActiveButton(null)}
                        onMouseLeave={() => setActiveButton(null)}
                    >
                        {action1Label}
                    </button>
                )}
                {onAction2 && (
                    <button
                        style={getActionButtonStyle(activeButton === 'action2')}
                        onTouchStart={(e) => { e.preventDefault(); setActiveButton('action2'); handleAction(onAction2); }}
                        onTouchEnd={() => setActiveButton(null)}
                        onMouseDown={() => { setActiveButton('action2'); handleAction(onAction2); }}
                        onMouseUp={() => setActiveButton(null)}
                        onMouseLeave={() => setActiveButton(null)}
                    >
                        {action2Label}
                    </button>
                )}
            </div>

            {/* Pause button (if provided) */}
            {onPause && (
                <button
                    className="absolute top-2 right-2 w-10 h-10 rounded-lg bg-black/30 text-white flex items-center justify-center"
                    onTouchStart={(e) => { e.preventDefault(); handleAction(onPause); }}
                    onClick={() => handleAction(onPause)}
                    style={{ touchAction: 'none' }}
                >
                    ⏸
                </button>
            )}
        </div>
    );
}
