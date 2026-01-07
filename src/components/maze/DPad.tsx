import React, { useState } from 'react';
import { hapticFeedback } from '../../lib/useTouchControls';

interface DPadProps {
    onDirectionChange: (direction: { x: number; y: number }) => void;
    size?: number; // Minimum 140 to ensure 48px buttons
}

// Default size ensures 48px minimum touch targets (140 * 0.35 = 49px)
export function DPad({ onDirectionChange, size = 150 }: DPadProps) {
    const buttonSize = Math.max(48, size * 0.35); // Ensure 48px minimum
    const adjustedSize = buttonSize / 0.35; // Recalculate container size if needed
    const actualSize = Math.max(size, adjustedSize);
    const centerOffset = (actualSize - buttonSize) / 2;
    const [activeDirection, setActiveDirection] = useState<string | null>(null);

    const handlePress = (direction: string, x: number, y: number) => {
        hapticFeedback('light');
        setActiveDirection(direction);
        onDirectionChange({ x, y });
    };

    const handleRelease = () => {
        setActiveDirection(null);
        onDirectionChange({ x: 0, y: 0 });
    };

    const buttonStyle = (direction: string): React.CSSProperties => {
        const isActive = activeDirection === direction;
        return {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: isActive ? 'rgba(6, 182, 212, 0.9)' : 'rgba(6, 182, 212, 0.4)',
            border: '2px solid rgba(6, 182, 212, 0.6)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: buttonSize * 0.45,
            color: '#fff',
            touchAction: 'none',
            userSelect: 'none',
            cursor: 'pointer',
            transition: 'all 0.1s ease',
            transform: isActive ? 'scale(0.95)' : 'scale(1)',
            boxShadow: isActive
                ? '0 0 20px rgba(6, 182, 212, 0.6), inset 0 0 10px rgba(255,255,255,0.2)'
                : '0 4px 15px rgba(0,0,0,0.3)',
        };
    };

    return (
        <div
            style={{
                position: 'relative',
                width: actualSize,
                height: actualSize,
                opacity: 0.95,
            }}
        >
            {/* Up */}
            <button
                style={{
                    ...buttonStyle('up'),
                    position: 'absolute',
                    left: centerOffset,
                    top: 0,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress('up', 0, -1); }}
                onTouchEnd={handleRelease}
                onTouchCancel={handleRelease}
                onMouseDown={() => handlePress('up', 0, -1)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ▲
            </button>

            {/* Down */}
            <button
                style={{
                    ...buttonStyle('down'),
                    position: 'absolute',
                    left: centerOffset,
                    bottom: 0,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress('down', 0, 1); }}
                onTouchEnd={handleRelease}
                onTouchCancel={handleRelease}
                onMouseDown={() => handlePress('down', 0, 1)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ▼
            </button>

            {/* Left */}
            <button
                style={{
                    ...buttonStyle('left'),
                    position: 'absolute',
                    left: 0,
                    top: centerOffset,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress('left', -1, 0); }}
                onTouchEnd={handleRelease}
                onTouchCancel={handleRelease}
                onMouseDown={() => handlePress('left', -1, 0)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ◀
            </button>

            {/* Right */}
            <button
                style={{
                    ...buttonStyle('right'),
                    position: 'absolute',
                    right: 0,
                    top: centerOffset,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress('right', 1, 0); }}
                onTouchEnd={handleRelease}
                onTouchCancel={handleRelease}
                onMouseDown={() => handlePress('right', 1, 0)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ▶
            </button>

            {/* Center indicator */}
            <div
                style={{
                    position: 'absolute',
                    left: centerOffset,
                    top: centerOffset,
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                }}
            />
        </div>
    );
}

