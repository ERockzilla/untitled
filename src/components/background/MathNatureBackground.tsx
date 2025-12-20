import { useEffect, useRef } from 'react';

interface MatrixBackgroundProps {
    className?: string;
    opacity?: number;
    speed?: number;
}

// Mathematical symbols
const SYMBOLS = [
    'π', 'φ', 'e', '∞', '∑', '∫', '∂', '∇', 'Δ', 'λ', 'θ', 'ω', 'α', 'β',
    'γ', 'ψ', '√', '∈', '≤', '≥', '≈', '∀', '∃', '+', '−', '×', '÷',
    '0', '1', '1', '2', '3', '5', '8', '13', // Fibonacci numbers more common
];

type PatternType = 'vertical' | 'diagonal' | 'fibonacci' | 'sine' | 'spiral';

interface Stream {
    x: number;
    y: number;
    speed: number;
    symbols: string[];
    opacity: number;
    pattern: PatternType;
    phase: number;      // For wave patterns
    angle: number;      // For diagonal/spiral
    radius: number;     // For spiral
    centerX: number;    // For spiral
    centerY: number;    // For spiral
    t: number;          // Parameter for curves
}

// Golden ratio
const PHI = 1.618033988749895;

export function MathNatureBackground({
    className = '',
    opacity = 0.15,
    speed = 1,
}: MatrixBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamsRef = useRef<Stream[]>([]);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const patterns: PatternType[] = ['vertical', 'vertical', 'diagonal', 'fibonacci', 'sine', 'spiral'];

        // Generate a stream of symbols
        const generateSymbols = (length: number): string[] => {
            return Array.from({ length }, () =>
                SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
            );
        };

        // Create a new stream
        const createStream = (): Stream => {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            const streamLength = 6 + Math.floor(Math.random() * 10);

            let x = Math.random() * canvas.width;
            let y = -100 - Math.random() * 300;
            let angle = 0;

            if (pattern === 'diagonal') {
                angle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + Math.random() * Math.PI / 6); // 30-60 degrees
                x = angle > 0 ? Math.random() * canvas.width * 0.3 : canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
            } else if (pattern === 'spiral') {
                x = canvas.width / 2;
                y = canvas.height / 2;
            }

            return {
                x,
                y,
                speed: (0.4 + Math.random() * 1.2) * speed,
                symbols: generateSymbols(streamLength),
                opacity: 0.5 + Math.random() * 0.5,
                pattern,
                phase: Math.random() * Math.PI * 2,
                angle,
                radius: 20 + Math.random() * 50,
                centerX: canvas.width * (0.2 + Math.random() * 0.6),
                centerY: canvas.height * (0.2 + Math.random() * 0.6),
                t: 0,
            };
        };

        // Initialize streams
        const initStreams = () => {
            const streamCount = Math.floor((canvas.width * canvas.height) / 15000); // Density based on screen size
            streamsRef.current = [];

            for (let i = 0; i < Math.min(streamCount, 80); i++) {
                const stream = createStream();
                // Spread initial positions across screen
                if (stream.pattern !== 'spiral') {
                    stream.y = Math.random() * (canvas.height + 200) - 200;
                }
                stream.t = Math.random() * 10;
                streamsRef.current.push(stream);
            }
        };

        // Set canvas size
        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStreams();
        };

        // Calculate position based on pattern
        const getPosition = (stream: Stream, index: number): { x: number; y: number } => {
            const fontSize = 16;
            const spacing = fontSize * 1.2;

            switch (stream.pattern) {
                case 'vertical':
                    return {
                        x: stream.x,
                        y: stream.y + index * spacing,
                    };

                case 'diagonal':
                    return {
                        x: stream.x + Math.sin(stream.angle) * index * spacing,
                        y: stream.y + Math.cos(stream.angle) * index * spacing,
                    };

                case 'fibonacci': {
                    // Fibonacci spiral path
                    const n = stream.t + index * 0.3;
                    const r = Math.pow(PHI, n / Math.PI) * 5;
                    return {
                        x: stream.centerX + Math.cos(n) * r,
                        y: stream.centerY + Math.sin(n) * r,
                    };
                }

                case 'sine': {
                    // Sine wave pattern
                    const amplitude = 30 + Math.sin(stream.phase) * 20;
                    const frequency = 0.02;
                    const yPos = stream.y + index * spacing;
                    return {
                        x: stream.x + Math.sin(yPos * frequency + stream.phase) * amplitude,
                        y: yPos,
                    };
                }

                case 'spiral': {
                    // Archimedean spiral
                    const theta = stream.t + index * 0.5;
                    const r = stream.radius + theta * 3;
                    return {
                        x: stream.centerX + Math.cos(theta) * r,
                        y: stream.centerY + Math.sin(theta) * r,
                    };
                }

                default:
                    return { x: stream.x, y: stream.y + index * spacing };
            }
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const fontSize = 16;
            ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            streamsRef.current.forEach((stream, streamIdx) => {
                // Draw symbols in the stream
                stream.symbols.forEach((symbol, i) => {
                    const pos = getPosition(stream, i);

                    // Skip if way off screen
                    if (pos.x < -50 || pos.x > canvas.width + 50 ||
                        pos.y < -50 || pos.y > canvas.height + 50) return;

                    // Fade effect: head is brightest
                    const headFade = i === 0 ? 1.2 : 1;
                    const trailFade = 1 - (i / stream.symbols.length) * 0.7;
                    const alpha = stream.opacity * opacity * trailFade * headFade;

                    // Color based on pattern type
                    let hue: number;
                    switch (stream.pattern) {
                        case 'fibonacci':
                            hue = 45; // Gold for phi/fibonacci
                            break;
                        case 'spiral':
                            hue = 280; // Purple for spirals
                            break;
                        case 'sine':
                            hue = 180; // Cyan for waves
                            break;
                        case 'diagonal':
                            hue = 120; // Green for diagonals
                            break;
                        default:
                            hue = 150; // Teal for vertical
                    }

                    // Head of stream is brighter/whiter
                    const saturation = i === 0 ? 50 : 80;
                    const lightness = i === 0 ? 80 : 55;

                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    ctx.fillText(symbol, pos.x, pos.y);

                    // Add subtle glow for head
                    if (i === 0 && alpha > 0.1) {
                        ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha * 0.5})`;
                        ctx.shadowBlur = 8;
                        ctx.fillText(symbol, pos.x, pos.y);
                        ctx.shadowBlur = 0;
                    }
                });

                // Update stream position
                switch (stream.pattern) {
                    case 'vertical':
                    case 'sine':
                        stream.y += stream.speed;
                        break;
                    case 'diagonal':
                        stream.x += Math.sin(stream.angle) * stream.speed;
                        stream.y += Math.cos(stream.angle) * stream.speed;
                        break;
                    case 'fibonacci':
                    case 'spiral':
                        stream.t += stream.speed * 0.02;
                        break;
                }

                // Check if stream is complete/off screen
                let needsReset = false;
                const lastPos = getPosition(stream, stream.symbols.length - 1);

                if (stream.pattern === 'fibonacci' || stream.pattern === 'spiral') {
                    // Reset spirals when they get too big
                    needsReset = stream.t > 20;
                } else {
                    // Reset linear patterns when fully off screen
                    needsReset = lastPos.y > canvas.height + 100 ||
                        lastPos.x < -100 ||
                        lastPos.x > canvas.width + 100;
                }

                if (needsReset) {
                    const newStream = createStream();
                    streamsRef.current[streamIdx] = newStream;
                }

                // Occasionally mutate a symbol
                if (Math.random() < 0.01) {
                    const idx = Math.floor(Math.random() * stream.symbols.length);
                    stream.symbols[idx] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        animate();

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [opacity, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-none ${className}`}
            style={{
                zIndex: -1,
                background: 'transparent',
            }}
            aria-hidden="true"
        />
    );
}
