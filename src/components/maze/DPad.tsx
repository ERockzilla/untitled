import React from 'react';

interface DPadProps {
    onDirectionChange: (direction: { x: number; y: number }) => void;
    size?: number;
}

export function DPad({ onDirectionChange, size = 140 }: DPadProps) {
    const buttonSize = size * 0.35;
    const centerOffset = (size - buttonSize) / 2;

    const handlePress = (x: number, y: number) => {
        onDirectionChange({ x, y });
    };

    const handleRelease = () => {
        onDirectionChange({ x: 0, y: 0 });
    };

    const buttonStyle = (active: boolean): React.CSSProperties => ({
        width: buttonSize,
        height: buttonSize,
        backgroundColor: active ? 'rgba(6, 182, 212, 0.8)' : 'rgba(6, 182, 212, 0.4)',
        border: '2px solid rgba(6, 182, 212, 0.6)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: buttonSize * 0.5,
        color: '#fff',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'pointer',
    });

    return (
        <div
            style={{
                position: 'relative',
                width: size,
                height: size,
                opacity: 0.9,
            }}
        >
            {/* Up */}
            <button
                style={{
                    ...buttonStyle(false),
                    position: 'absolute',
                    left: centerOffset,
                    top: 0,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress(0, -1); }}
                onTouchEnd={handleRelease}
                onMouseDown={() => handlePress(0, -1)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ▲
            </button>

            {/* Down */}
            <button
                style={{
                    ...buttonStyle(false),
                    position: 'absolute',
                    left: centerOffset,
                    bottom: 0,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress(0, 1); }}
                onTouchEnd={handleRelease}
                onMouseDown={() => handlePress(0, 1)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ▼
            </button>

            {/* Left */}
            <button
                style={{
                    ...buttonStyle(false),
                    position: 'absolute',
                    left: 0,
                    top: centerOffset,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress(-1, 0); }}
                onTouchEnd={handleRelease}
                onMouseDown={() => handlePress(-1, 0)}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
            >
                ◀
            </button>

            {/* Right */}
            <button
                style={{
                    ...buttonStyle(false),
                    position: 'absolute',
                    right: 0,
                    top: centerOffset,
                }}
                onTouchStart={(e) => { e.preventDefault(); handlePress(1, 0); }}
                onTouchEnd={handleRelease}
                onMouseDown={() => handlePress(1, 0)}
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
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
            />
        </div>
    );
}
