import React, { useRef } from 'react';

interface JoystickProps {
    onMove: (x: number, y: number) => void;
    size?: number;
}

export function Joystick({ onMove, size = 120 }: JoystickProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const centerRef = useRef({ x: 0, y: 0 });

    const maxDistance = size / 2 - 20;

    const updatePosition = (clientX: number, clientY: number) => {
        if (!containerRef.current || !knobRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;

        // Clamp to max distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }

        // Update knob position
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

        // Normalize to -1 to 1
        const normalizedX = dx / maxDistance;
        const normalizedY = dy / maxDistance;
        onMove(normalizedX, normalizedY);
    };

    const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
        isDragging.current = true;
        const pos = 'touches' in e ? e.touches[0] : e;

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            centerRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }

        updatePosition(pos.clientX, pos.clientY);
    };

    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const pos = 'touches' in e ? e.touches[0] : e;
        updatePosition(pos.clientX, pos.clientY);
    };

    const handleEnd = () => {
        isDragging.current = false;
        if (knobRef.current) {
            knobRef.current.style.transform = 'translate(0px, 0px)';
        }
        onMove(0, 0);
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                border: '2px solid rgba(6, 182, 212, 0.4)',
                position: 'relative',
                touchAction: 'none',
            }}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            {/* Knob */}
            <div
                ref={knobRef}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 40,
                    height: 40,
                    marginLeft: -20,
                    marginTop: -20,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 182, 212, 0.8)',
                    border: '2px solid rgba(103, 232, 249, 0.8)',
                    boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
                    transition: 'none',
                }}
            />

            {/* Center dot */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    marginTop: -4,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 182, 212, 0.3)',
                }}
            />
        </div>
    );
}
