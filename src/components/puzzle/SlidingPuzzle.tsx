import { useState, useEffect, useCallback, useRef } from 'react';
import type {
    SlidingTile,
    PuzzleConfig,
} from '../../lib/puzzleUtils';
import {
    generateSlidingTiles,
    shuffleSlidingTiles,
    canSlide,
    slideTile,
    isSlidingComplete,
} from '../../lib/puzzleUtils';
import { useTheme } from '../../lib/ThemeContext';

interface SlidingPuzzleProps {
    imageUrl: string;
    config: PuzzleConfig;
    onComplete: () => void;
}

export function SlidingPuzzle({ imageUrl, config, onComplete }: SlidingPuzzleProps) {
    const { theme } = useTheme();
    const [tiles, setTiles] = useState<SlidingTile[]>([]);
    const [moveCount, setMoveCount] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isShuffling, setIsShuffling] = useState(true);
    const [containerWidth, setContainerWidth] = useState(500);
    const containerRef = useRef<HTMLDivElement>(null);

    const { cols, rows, pieceWidth, pieceHeight, imageWidth, imageHeight } = config;

    // Responsive sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = Math.min(containerRef.current.offsetWidth - 32, 500);
                setContainerWidth(Math.max(280, width));
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Scale factor to fit puzzle in container
    const DISPLAY_SIZE = containerWidth;
    const scale = Math.min(DISPLAY_SIZE / imageWidth, DISPLAY_SIZE / imageHeight);
    const displayPieceWidth = pieceWidth * scale;
    const displayPieceHeight = pieceHeight * scale;
    const boardWidth = imageWidth * scale;
    const boardHeight = imageHeight * scale;

    // Initialize and shuffle tiles
    useEffect(() => {
        const initialTiles = generateSlidingTiles(cols, rows);
        const shuffled = shuffleSlidingTiles(initialTiles, cols);
        setTiles(shuffled);
        setMoveCount(0);
        setIsShuffling(false);
        setImageLoaded(false);
    }, [cols, rows, imageUrl]);

    // Preload image
    useEffect(() => {
        const img = new Image();
        img.onload = () => setImageLoaded(true);
        img.src = imageUrl;
    }, [imageUrl]);

    // Check completion
    useEffect(() => {
        if (tiles.length > 0 && !isShuffling && isSlidingComplete(tiles)) {
            onComplete();
        }
    }, [tiles, isShuffling, onComplete]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const emptyTile = tiles.find(t => t.isEmpty);
            if (!emptyTile) return;

            const emptyPos = emptyTile.currentIndex;
            const emptyRow = Math.floor(emptyPos / cols);
            const emptyCol = emptyPos % cols;

            let targetPos = -1;

            switch (e.key) {
                case 'ArrowUp':
                    if (emptyRow < rows - 1) targetPos = emptyPos + cols;
                    break;
                case 'ArrowDown':
                    if (emptyRow > 0) targetPos = emptyPos - cols;
                    break;
                case 'ArrowLeft':
                    if (emptyCol < cols - 1) targetPos = emptyPos + 1;
                    break;
                case 'ArrowRight':
                    if (emptyCol > 0) targetPos = emptyPos - 1;
                    break;
            }

            if (targetPos >= 0) {
                const tileIdx = tiles.findIndex(t => t.currentIndex === targetPos);
                if (tileIdx >= 0 && canSlide(tiles, tileIdx, cols)) {
                    e.preventDefault();
                    setTiles(slideTile(tiles, tileIdx));
                    setMoveCount(m => m + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tiles, cols, rows]);

    const handleTileClick = useCallback((tileIdx: number) => {
        if (canSlide(tiles, tileIdx, cols)) {
            setTiles(slideTile(tiles, tileIdx));
            setMoveCount(m => m + 1);
        }
    }, [tiles, cols]);

    const handleReset = useCallback(() => {
        setIsShuffling(true);
        const initialTiles = generateSlidingTiles(cols, rows);
        const shuffled = shuffleSlidingTiles(initialTiles, cols);
        setTiles(shuffled);
        setMoveCount(0);
        setTimeout(() => setIsShuffling(false), 100);
    }, [cols, rows]);

    if (!imageLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-subtle animate-pulse">Loading puzzle...</div>
            </div>
        );
    }

    // Sort tiles by current position for rendering
    const sortedTiles = [...tiles].sort((a, b) => a.currentIndex - b.currentIndex);

    return (
        <div ref={containerRef} className="flex flex-col gap-4 h-full">
            {/* Instructions */}
            <div className="text-xs text-subtle text-center">
                Tap tiles to slide • Arrow keys on desktop
            </div>

            {/* Puzzle Board */}
            <div
                className="relative mx-auto rounded-lg overflow-hidden touch-none"
                style={{
                    width: boardWidth,
                    height: boardHeight,
                    backgroundColor: theme === 'light' ? 'rgba(200,195,185,0.5)' : 'rgba(0,0,0,0.3)',
                    boxShadow: theme === 'light'
                        ? '0 4px 16px rgba(0,0,0,0.15)'
                        : '0 4px 24px rgba(0,0,0,0.4)',
                }}
            >
                {sortedTiles.map((tile, idx) => {
                    if (tile.isEmpty) {
                        return (
                            <div
                                key={tile.id}
                                className="absolute animate-pulse"
                                style={{
                                    left: (idx % cols) * displayPieceWidth,
                                    top: Math.floor(idx / cols) * displayPieceHeight,
                                    width: displayPieceWidth,
                                    height: displayPieceHeight,
                                    backgroundColor: 'rgba(30, 30, 35, 0.85)',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), inset 0 0 4px rgba(100,200,255,0.3)',
                                    border: '2px dashed rgba(100,200,255,0.4)',
                                }}
                            />
                        );
                    }

                    const originalRow = Math.floor(tile.correctIndex / cols);
                    const originalCol = tile.correctIndex % cols;
                    const currentRow = Math.floor(tile.currentIndex / cols);
                    const currentCol = tile.currentIndex % cols;

                    const canMove = canSlide(tiles, tiles.indexOf(tile), cols);

                    return (
                        <div
                            key={tile.id}
                            className={`absolute transition-all duration-200 ease-out puzzle-draggable ${canMove ? 'cursor-pointer active:scale-95' : 'cursor-default'
                                }`}
                            style={{
                                left: currentCol * displayPieceWidth,
                                top: currentRow * displayPieceHeight,
                                width: displayPieceWidth,
                                height: displayPieceHeight,
                            }}
                            onClick={() => handleTileClick(tiles.indexOf(tile))}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                handleTileClick(tiles.indexOf(tile));
                            }}
                        >
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundImage: `url(${imageUrl})`,
                                    backgroundSize: `${boardWidth}px ${boardHeight}px`,
                                    backgroundPosition: `-${originalCol * displayPieceWidth}px -${originalRow * displayPieceHeight}px`,
                                    boxShadow: canMove
                                        ? '0 0 10px rgba(6, 182, 212, 0.4), inset 0 0 0 2px rgba(6, 182, 212, 0.3)'
                                        : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Controls & Stats */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="text-sm text-subtle">
                    Moves: <span className="text-text font-mono">{moveCount}</span>
                </div>

                <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg bg-elevated hover:bg-muted active:bg-cyan-500/20 text-sm transition-colors"
                >
                    Shuffle
                </button>
            </div>

            {/* Progress hint */}
            <div className="text-center text-xs text-subtle">
                {(() => {
                    const correctCount = tiles.filter(t => t.currentIndex === t.correctIndex).length;
                    const total = tiles.length;
                    return `${correctCount} / ${total} tiles in place`;
                })()}
            </div>
        </div>
    );
}
