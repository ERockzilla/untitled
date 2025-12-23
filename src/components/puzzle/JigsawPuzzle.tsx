import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
    PuzzlePiece,
    PuzzleConfig,
} from '../../lib/puzzleUtils';
import {
    generateJigsawPieces,
    shuffleJigsawPieces,
    isJigsawComplete,
} from '../../lib/puzzleUtils';
import { useTheme } from '../../lib/ThemeContext';

interface JigsawPuzzleProps {
    imageUrl: string;
    config: PuzzleConfig;
    onComplete: () => void;
}

// Generate a complete polygon clip-path for a puzzle piece
function generatePuzzlePieceShape(
    edges: PuzzlePiece['edges'],
    width: number,
    height: number
): string {
    const tabRatio = 0.2;
    const neckRatio = 0.35;
    const tabW = width * tabRatio;
    const tabH = height * tabRatio;

    const points: string[] = [];

    points.push(`M 0 0`);

    // TOP EDGE
    if (edges.top === 0) {
        points.push(`L ${width} 0`);
    } else {
        const mid = width / 2;
        const neckW = width * neckRatio / 2;
        const tabDepth = tabH * edges.top;

        points.push(`L ${mid - neckW} 0`);
        points.push(`C ${mid - neckW} ${-tabDepth * 0.5}, ${mid - neckW * 0.5} ${-tabDepth}, ${mid} ${-tabDepth}`);
        points.push(`C ${mid + neckW * 0.5} ${-tabDepth}, ${mid + neckW} ${-tabDepth * 0.5}, ${mid + neckW} 0`);
        points.push(`L ${width} 0`);
    }

    // RIGHT EDGE
    if (edges.right === 0) {
        points.push(`L ${width} ${height}`);
    } else {
        const mid = height / 2;
        const neckH = height * neckRatio / 2;
        const tabDepth = tabW * edges.right;

        points.push(`L ${width} ${mid - neckH}`);
        points.push(`C ${width + tabDepth * 0.5} ${mid - neckH}, ${width + tabDepth} ${mid - neckH * 0.5}, ${width + tabDepth} ${mid}`);
        points.push(`C ${width + tabDepth} ${mid + neckH * 0.5}, ${width + tabDepth * 0.5} ${mid + neckH}, ${width} ${mid + neckH}`);
        points.push(`L ${width} ${height}`);
    }

    // BOTTOM EDGE
    if (edges.bottom === 0) {
        points.push(`L 0 ${height}`);
    } else {
        const mid = width / 2;
        const neckW = width * neckRatio / 2;
        const tabDepth = tabH * edges.bottom;

        points.push(`L ${mid + neckW} ${height}`);
        points.push(`C ${mid + neckW} ${height + tabDepth * 0.5}, ${mid + neckW * 0.5} ${height + tabDepth}, ${mid} ${height + tabDepth}`);
        points.push(`C ${mid - neckW * 0.5} ${height + tabDepth}, ${mid - neckW} ${height + tabDepth * 0.5}, ${mid - neckW} ${height}`);
        points.push(`L 0 ${height}`);
    }

    // LEFT EDGE
    if (edges.left === 0) {
        points.push(`L 0 0`);
    } else {
        const mid = height / 2;
        const neckH = height * neckRatio / 2;
        const tabDepth = tabW * edges.left;

        points.push(`L 0 ${mid + neckH}`);
        points.push(`C ${-tabDepth * 0.5} ${mid + neckH}, ${-tabDepth} ${mid + neckH * 0.5}, ${-tabDepth} ${mid}`);
        points.push(`C ${-tabDepth} ${mid - neckH * 0.5}, ${-tabDepth * 0.5} ${mid - neckH}, 0 ${mid - neckH}`);
        points.push(`L 0 0`);
    }

    points.push('Z');
    return points.join(' ');
}

export function JigsawPuzzle({ imageUrl, config, onComplete }: JigsawPuzzleProps) {
    const { theme } = useTheme();
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
    const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [containerWidth, setContainerWidth] = useState(480);
    const containerRef = useRef<HTMLDivElement>(null);

    const { cols, rows, pieceWidth, pieceHeight, imageWidth, imageHeight } = config;

    // Responsive sizing
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = Math.min(containerRef.current.offsetWidth - 32, 480);
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
    const tabOverflow = Math.max(displayPieceWidth, displayPieceHeight) * 0.2;

    const clipPathId = useMemo(() => `puzzle-${Date.now()}`, []);

    // Initialize pieces
    useEffect(() => {
        const newPieces = shuffleJigsawPieces(generateJigsawPieces(config));
        setPieces(newPieces);
        setSelectedPiece(null);
        setImageLoaded(false);
    }, [config, imageUrl]);

    // Preload image - handle cached images that won't fire onload
    useEffect(() => {
        const img = new Image();
        img.onload = () => setImageLoaded(true);
        img.onerror = () => {
            console.error('Failed to load puzzle image:', imageUrl);
            // Still allow the puzzle to render even if image fails
            setImageLoaded(true);
        };
        img.src = imageUrl;

        // If the image is already cached, onload may have fired synchronously
        // or might not fire at all in some browsers, so check complete status
        if (img.complete && img.naturalWidth > 0) {
            setImageLoaded(true);
        }
    }, [imageUrl]);

    // Keyboard handler for rotation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedPiece === null) return;

            const pieceIdx = pieces.findIndex(p => p.id === selectedPiece);
            if (pieceIdx === -1) return;

            // Don't allow rotating locked pieces
            if (pieces[pieceIdx].isLocked) return;

            let newRotation = pieces[pieceIdx].rotation;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                newRotation = (newRotation - 90 + 360) % 360;
                e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                newRotation = (newRotation + 90) % 360;
                e.preventDefault();
            }

            if (newRotation !== pieces[pieceIdx].rotation) {
                const newPieces = [...pieces];
                newPieces[pieceIdx] = { ...newPieces[pieceIdx], rotation: newRotation };
                setPieces(newPieces);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPiece, pieces]);

    // Check completion
    useEffect(() => {
        if (pieces.length > 0 && isJigsawComplete(pieces)) {
            onComplete();
        }
    }, [pieces, onComplete]);

    // Rotate selected piece (for mobile button)
    const rotateSelected = useCallback((direction: 1 | -1) => {
        if (selectedPiece === null) return;

        const pieceIdx = pieces.findIndex(p => p.id === selectedPiece);
        if (pieceIdx === -1) return;

        // Don't allow rotating locked pieces
        if (pieces[pieceIdx].isLocked) return;

        const newRotation = (pieces[pieceIdx].rotation + direction * 90 + 360) % 360;
        const newPieces = [...pieces];
        newPieces[pieceIdx] = { ...newPieces[pieceIdx], rotation: newRotation };
        setPieces(newPieces);
    }, [selectedPiece, pieces]);

    const handlePieceClick = useCallback((pieceId: number, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setSelectedPiece(pieceId === selectedPiece ? null : pieceId);
    }, [selectedPiece]);

    // Unified drag start for mouse and touch
    const handleDragStart = useCallback((pieceId: number, clientX: number, clientY: number, target: HTMLElement) => {
        const piece = pieces.find(p => p.id === pieceId);
        // Allow dragging if piece exists and is not locked (can drag both placed and unplaced pieces)
        if (!piece || piece.isLocked) return;

        setDraggedPiece(pieceId);
        setSelectedPiece(pieceId);

        const rect = target.getBoundingClientRect();
        setDragOffset({
            x: clientX - rect.left,
            y: clientY - rect.top,
        });
        setDragPos({ x: clientX, y: clientY });
    }, [pieces]);

    const handleMouseDown = useCallback((pieceId: number, e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(pieceId, e.clientX, e.clientY, e.currentTarget as HTMLElement);
    }, [handleDragStart]);

    const handleTouchStart = useCallback((pieceId: number, e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;

        const piece = pieces.find(p => p.id === pieceId);
        // Allow dragging if piece exists and is not locked
        if (!piece || piece.isLocked) return;

        // Prevent scrolling immediately when touching a puzzle piece
        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches[0];
        handleDragStart(pieceId, touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
    }, [handleDragStart, pieces]);

    // Unified move handler
    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (draggedPiece !== null) {
            setDragPos({ x: clientX, y: clientY });
        }
    }, [draggedPiece]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        handleMove(e.clientX, e.clientY);
    }, [handleMove]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length !== 1 || draggedPiece === null) return;
        e.preventDefault(); // Prevent scrolling while dragging
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    }, [handleMove, draggedPiece]);

    // Unified drop handler
    const handleDrop = useCallback((clientX: number, clientY: number) => {
        if (draggedPiece === null || !containerRef.current) return;

        const piece = pieces.find(p => p.id === draggedPiece);
        if (!piece || piece.isLocked) {
            setDraggedPiece(null);
            return;
        }

        const boardEl = containerRef.current.querySelector('.puzzle-board');
        if (!boardEl) {
            setDraggedPiece(null);
            return;
        }

        const boardRect = boardEl.getBoundingClientRect();
        const dropX = clientX - boardRect.left - tabOverflow;
        const dropY = clientY - boardRect.top - tabOverflow;

        // Check if drop is within the board area
        if (dropX >= -tabOverflow && dropX < boardWidth + tabOverflow &&
            dropY >= -tabOverflow && dropY < boardHeight + tabOverflow) {

            const targetCol = Math.floor((dropX + displayPieceWidth / 2) / displayPieceWidth);
            const targetRow = Math.floor((dropY + displayPieceHeight / 2) / displayPieceHeight);

            const clampedCol = Math.max(0, Math.min(cols - 1, targetCol));
            const clampedRow = Math.max(0, Math.min(rows - 1, targetRow));

            // Check if this is the correct position (correct location + correct rotation)
            const isCorrect =
                clampedRow === piece.correctRow &&
                clampedCol === piece.correctCol &&
                piece.rotation === 0;

            // Check if spot is taken by another piece
            const existingPiece = pieces.find(
                p => p.id !== piece.id && p.isPlaced && p.currentRow === clampedRow && p.currentCol === clampedCol
            );

            // If spot has a LOCKED piece, can't place here
            if (existingPiece?.isLocked) {
                // Reject - can't place on a locked piece
                setDraggedPiece(null);
                return;
            }

            // Place the piece (swap if there's an unlocked piece there)
            const newPieces = pieces.map(p => {
                if (p.id === draggedPiece) {
                    // Place the dragged piece
                    return {
                        ...p,
                        isPlaced: true,
                        isLocked: isCorrect,
                        currentRow: clampedRow,
                        currentCol: clampedCol,
                    };
                }
                if (existingPiece && p.id === existingPiece.id) {
                    // Send the existing unlocked piece back to tray (swap positions)
                    return {
                        ...p,
                        isPlaced: false,
                        currentRow: -1,
                        currentCol: -1,
                    };
                }
                return p;
            });
            setPieces(newPieces);
        } else {
            // Dropped outside board - return piece to tray
            const newPieces = pieces.map(p =>
                p.id === draggedPiece
                    ? { ...p, isPlaced: false, currentRow: -1, currentCol: -1 }
                    : p
            );
            setPieces(newPieces);
        }

        setDraggedPiece(null);
    }, [draggedPiece, pieces, boardWidth, boardHeight, displayPieceWidth, displayPieceHeight, cols, rows, tabOverflow]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        handleDrop(e.clientX, e.clientY);
    }, [handleDrop]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (e.changedTouches.length !== 1) return;
        const touch = e.changedTouches[0];
        handleDrop(touch.clientX, touch.clientY);
    }, [handleDrop]);

    const unplacedPieces = pieces.filter(p => !p.isPlaced);
    const placedPieces = pieces.filter(p => p.isPlaced);

    // Render a puzzle piece with clip-path
    // borderColor: undefined = default white border, string = custom color
    const renderPiece = (piece: PuzzlePiece, displayWidth: number, displayHeight: number, forDrag = false, borderColor?: string) => {
        const clipId = `clip-${clipPathId}-${piece.id}${forDrag ? '-drag' : ''}`;
        const pathD = generatePuzzlePieceShape(piece.edges, 100, 100);
        const boundsWidth = 140;
        const boundsHeight = 140;

        // Default stroke for tray pieces
        const strokeColor = borderColor ?? 'rgba(255,255,255,0.4)';
        const strokeWidth = borderColor ? 3 : 1.5;

        return (
            <div
                className="relative"
                style={{
                    width: displayWidth * 1.4,
                    height: displayHeight * 1.4,
                    transform: `rotate(${piece.rotation}deg)`,
                    transformOrigin: 'center',
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`-20 -20 ${boundsWidth} ${boundsHeight}`}
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <clipPath id={clipId}>
                            <path d={pathD} />
                        </clipPath>
                    </defs>

                    <g clipPath={`url(#${clipId})`}>
                        <image
                            href={imageUrl}
                            x={-piece.correctCol * 100}
                            y={-piece.correctRow * 100}
                            width={cols * 100}
                            height={rows * 100}
                            preserveAspectRatio="none"
                        />
                    </g>

                    <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                    />
                </svg>
            </div>
        );
    };

    // Get border color for a placed piece based on its status
    const getPieceBorderColor = (piece: PuzzlePiece): string | undefined => {
        if (piece.isLocked) {
            // Correct position and rotation - no visible border
            return 'transparent';
        }

        const isCorrectRotation = piece.rotation === 0;
        const isCorrectPosition = piece.currentRow === piece.correctRow && piece.currentCol === piece.correctCol;

        if (isCorrectRotation && !isCorrectPosition) {
            // Correct rotation but wrong position - yellow
            return '#fbbf24'; // Tailwind yellow-400
        }

        // Wrong rotation (regardless of position) - red
        return '#ef4444'; // Tailwind red-500
    };

    if (!imageLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-subtle animate-pulse">Loading puzzle...</div>
            </div>
        );
    }

    // Tray piece size - larger on mobile for easier touch
    const isMobile = containerWidth < 400;
    const trayScale = isMobile ? 0.8 : 0.65;

    return (
        <div
            ref={containerRef}
            className="flex flex-col gap-3 h-full select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setDraggedPiece(null)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => setDraggedPiece(null)}
        >
            {/* Instructions & Rotation Controls */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs text-subtle">
                    Drag to place • <span className="text-red-400">Red</span> = no good • <span className="text-yellow-400">Yellow</span> = orientation good
                </span>
            </div>

            {/* Rotation buttons for mobile */}
            {selectedPiece !== null && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => rotateSelected(-1)}
                        className="p-2 rounded-lg bg-elevated hover:bg-muted active:bg-cyan-500/20 transition-colors"
                        title="Rotate Left"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <span className="text-sm text-cyan-400 font-mono min-w-[60px] text-center">
                        {pieces.find(p => p.id === selectedPiece)?.rotation}°
                    </span>
                    <button
                        onClick={() => rotateSelected(1)}
                        className="p-2 rounded-lg bg-elevated hover:bg-muted active:bg-cyan-500/20 transition-colors"
                        title="Rotate Right"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Puzzle Board */}
            <div
                className="puzzle-board relative mx-auto rounded-lg"
                style={{
                    width: boardWidth + tabOverflow * 2,
                    height: boardHeight + tabOverflow * 2,
                    padding: tabOverflow,
                }}
            >
                <div
                    className="absolute rounded-lg"
                    style={{
                        left: tabOverflow,
                        top: tabOverflow,
                        width: boardWidth,
                        height: boardHeight,
                        backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.03)',
                        boxShadow: theme === 'light'
                            ? 'inset 0 0 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.1)'
                            : 'inset 0 0 30px rgba(0,0,0,0.4)',
                    }}
                >
                    <svg className="absolute inset-0" width={boardWidth} height={boardHeight}>
                        {Array.from({ length: cols + 1 }).map((_, i) => (
                            <line
                                key={`v${i}`}
                                x1={i * displayPieceWidth}
                                y1={0}
                                x2={i * displayPieceWidth}
                                y2={boardHeight}
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                        ))}
                        {Array.from({ length: rows + 1 }).map((_, i) => (
                            <line
                                key={`h${i}`}
                                x1={0}
                                y1={i * displayPieceHeight}
                                x2={boardWidth}
                                y2={i * displayPieceHeight}
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                        ))}
                    </svg>
                </div>

                {placedPieces.map(piece => {
                    const borderColor = getPieceBorderColor(piece);
                    const isDragging = draggedPiece === piece.id;
                    const isSelected = selectedPiece === piece.id;
                    const canDrag = !piece.isLocked;

                    return (
                        <div
                            key={piece.id}
                            className={`absolute transition-all duration-200 ${canDrag ? 'cursor-grab active:cursor-grabbing puzzle-draggable' : 'cursor-default'} ${isDragging ? 'opacity-30' : ''} ${isSelected && canDrag ? 'z-10' : ''}`}
                            style={{
                                left: tabOverflow + piece.currentCol * displayPieceWidth - displayPieceWidth * 0.2,
                                top: tabOverflow + piece.currentRow * displayPieceHeight - displayPieceHeight * 0.2,
                                width: displayPieceWidth * 1.4,
                                height: displayPieceHeight * 1.4,
                                filter: isSelected && canDrag
                                    ? 'drop-shadow(0 4px 12px rgba(6, 182, 212, 0.4))'
                                    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                            }}
                            onClick={(e) => canDrag && handlePieceClick(piece.id, e)}
                            onMouseDown={(e) => canDrag && handleMouseDown(piece.id, e)}
                            onTouchStart={(e) => canDrag && handleTouchStart(piece.id, e)}
                        >
                            {renderPiece(piece, displayPieceWidth, displayPieceHeight, false, borderColor)}
                        </div>
                    );
                })}
            </div>

            {/* Piece Tray */}
            <div
                className="flex-1 min-h-[120px] p-3 rounded-lg overflow-auto"
                style={{ backgroundColor: theme === 'light' ? 'rgba(245, 243, 238, 0.95)' : 'rgba(0,0,0,0.2)' }}
            >
                <div className="flex flex-wrap gap-2 justify-center">
                    {unplacedPieces.map(piece => {
                        const isSelected = selectedPiece === piece.id;
                        const isDragging = draggedPiece === piece.id;

                        const trayPieceWidth = displayPieceWidth * trayScale;
                        const trayPieceHeight = displayPieceHeight * trayScale;

                        return (
                            <div
                                key={piece.id}
                                className={`cursor-grab active:cursor-grabbing transition-all duration-150 puzzle-draggable ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent z-10 scale-110' : ''
                                    } ${isDragging ? 'opacity-30' : ''}`}
                                style={{
                                    width: trayPieceWidth * 1.4,
                                    height: trayPieceHeight * 1.4,
                                    filter: isSelected ? 'drop-shadow(0 4px 12px rgba(6, 182, 212, 0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                                }}
                                onClick={(e) => handlePieceClick(piece.id, e)}
                                onMouseDown={(e) => handleMouseDown(piece.id, e)}
                                onTouchStart={(e) => handleTouchStart(piece.id, e)}
                            >
                                <div style={{ width: '100%', height: '100%' }}>
                                    {renderPiece(piece, trayPieceWidth, trayPieceHeight)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {unplacedPieces.length === 0 && (
                    <div className="text-center text-subtle py-4">🎉 All pieces placed!</div>
                )}
            </div>

            {/* Dragged piece overlay */}
            {draggedPiece !== null && (
                <div
                    className="fixed pointer-events-none z-50"
                    style={{
                        left: dragPos.x - dragOffset.x,
                        top: dragPos.y - dragOffset.y,
                        width: displayPieceWidth * 1.4 * trayScale,
                        height: displayPieceHeight * 1.4 * trayScale,
                        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))',
                    }}
                >
                    {(() => {
                        const piece = pieces.find(p => p.id === draggedPiece);
                        if (!piece) return null;
                        return (
                            <div style={{ width: '100%', height: '100%', transform: 'scale(1.1)', opacity: 0.9 }}>
                                {renderPiece(piece, displayPieceWidth * trayScale, displayPieceHeight * trayScale, true)}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Progress */}
            <div className="text-center text-sm text-subtle">
                {pieces.filter(p => p.isLocked).length} / {pieces.length} pieces locked
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
        </div>
    );
}
