import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';

interface CalibrationData {
    neutralBeta: number;
    neutralGamma: number;
    sensitivity: number;
    deadzone: number;
    timestamp: number;
}

const CALIBRATION_KEY = 'maze_tilt_calibration';

// Save calibration to localStorage
export function saveCalibration(data: CalibrationData): void {
    try {
        localStorage.setItem(CALIBRATION_KEY, JSON.stringify(data));
    } catch {
        // Ignore storage errors
    }
}

// Load calibration from localStorage
export function loadCalibration(): CalibrationData | null {
    try {
        const saved = localStorage.getItem(CALIBRATION_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            // Check if calibration is less than 24 hours old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
        return null;
    } catch {
        return null;
    }
}

export function TiltCalibration() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Get params from URL (passed from MazeSelection)
    const size = searchParams.get('size') || '10';
    const character = searchParams.get('character') || 'ball';
    const difficulty = searchParams.get('difficulty') || 'easy';

    // Permission and calibration state
    const [permissionStatus, setPermissionStatus] = useState<'checking' | 'prompt' | 'granted' | 'denied'>('checking');
    const [calibrationStep, setCalibrationStep] = useState<'permission' | 'ready' | 'calibrating' | 'sensitivity' | 'complete'>('permission');

    // Motion data
    const [currentBeta, setCurrentBeta] = useState(0);
    const [currentGamma, setCurrentGamma] = useState(0);
    const [neutralBeta, setNeutralBeta] = useState(45); // Default: phone held at 45 degrees
    const [neutralGamma, setNeutralGamma] = useState(0);
    const [sensitivity, setSensitivity] = useState(1.0);
    const [deadzone, setDeadzone] = useState(5); // Degrees of deadzone

    // Calibration sampling
    const samplesRef = useRef<{ beta: number; gamma: number }[]>([]);
    const [samplingProgress, setSamplingProgress] = useState(0);
    const [isCalibrating, setIsCalibrating] = useState(false);

    // Test ball position
    const [testBallPos, setTestBallPos] = useState({ x: 50, y: 50 });

    // Check for existing calibration on mount
    useEffect(() => {
        const existing = loadCalibration();
        if (existing) {
            setNeutralBeta(existing.neutralBeta);
            setNeutralGamma(existing.neutralGamma);
            setSensitivity(existing.sensitivity);
            setDeadzone(existing.deadzone);
        }
    }, []);

    // Check motion permission - Permission should already be granted from MazeSelection
    useEffect(() => {
        const checkPermission = async () => {
            // Check if DeviceOrientationEvent is available
            if (typeof DeviceOrientationEvent === 'undefined') {
                setPermissionStatus('denied');
                return;
            }

            // Check if permission API exists (iOS 13+)
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                // Permission was already granted in MazeSelection, go straight to ready
                setPermissionStatus('granted');
                setCalibrationStep('ready');
            } else {
                // Android/older iOS - permission not required
                setPermissionStatus('granted');
                setCalibrationStep('ready');
            }
        };

        checkPermission();
    }, []);

    // Request permission
    const requestPermission = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const result = await (DeviceOrientationEvent as any).requestPermission();
                if (result === 'granted') {
                    setPermissionStatus('granted');
                    setCalibrationStep('ready');
                } else {
                    setPermissionStatus('denied');
                }
            } catch {
                setPermissionStatus('denied');
            }
        } else {
            setPermissionStatus('granted');
            setCalibrationStep('ready');
        }
    };

    // Listen for device orientation
    useEffect(() => {
        if (permissionStatus !== 'granted') return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            const beta = e.beta || 0;
            const gamma = e.gamma || 0;
            setCurrentBeta(beta);
            setCurrentGamma(gamma);

            // During calibration, collect samples
            if (isCalibrating) {
                samplesRef.current.push({ beta, gamma });
                setSamplingProgress(Math.min(100, (samplesRef.current.length / 30) * 100));
            }

            // During sensitivity testing, move test ball
            if (calibrationStep === 'sensitivity') {
                const adjustedBeta = beta - neutralBeta;
                const adjustedGamma = gamma - neutralGamma;

                // Apply deadzone
                const effectiveBeta = Math.abs(adjustedBeta) > deadzone
                    ? (adjustedBeta - Math.sign(adjustedBeta) * deadzone)
                    : 0;
                const effectiveGamma = Math.abs(adjustedGamma) > deadzone
                    ? (adjustedGamma - Math.sign(adjustedGamma) * deadzone)
                    : 0;

                // Apply sensitivity and clamp to bounds
                setTestBallPos(pos => ({
                    x: Math.max(10, Math.min(90, pos.x + effectiveGamma * sensitivity * 0.1)),
                    y: Math.max(10, Math.min(90, pos.y + effectiveBeta * sensitivity * 0.1)),
                }));
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [permissionStatus, isCalibrating, calibrationStep, neutralBeta, neutralGamma, sensitivity, deadzone]);

    // Start calibration sampling
    const startCalibration = useCallback(() => {
        samplesRef.current = [];
        setSamplingProgress(0);
        setIsCalibrating(true);
        setCalibrationStep('calibrating');

        // Collect samples for 1.5 seconds
        setTimeout(() => {
            setIsCalibrating(false);

            if (samplesRef.current.length > 0) {
                // Average the collected samples
                const avgBeta = samplesRef.current.reduce((sum, s) => sum + s.beta, 0) / samplesRef.current.length;
                const avgGamma = samplesRef.current.reduce((sum, s) => sum + s.gamma, 0) / samplesRef.current.length;

                setNeutralBeta(avgBeta);
                setNeutralGamma(avgGamma);
                setCalibrationStep('sensitivity');
                setTestBallPos({ x: 50, y: 50 }); // Reset test ball
            }
        }, 1500);
    }, []);

    // Save and proceed
    const handleComplete = () => {
        const calibration: CalibrationData = {
            neutralBeta,
            neutralGamma,
            sensitivity,
            deadzone,
            timestamp: Date.now(),
        };
        saveCalibration(calibration);

        // Navigate to maze with tilt controls
        const params = new URLSearchParams({
            size,
            character,
            controls: 'tilt',
            difficulty,
            view: '2d',
        });
        navigate(`/maze/play?${params.toString()}`);
    };

    // Skip calibration and use defaults
    const handleSkip = () => {
        const params = new URLSearchParams({
            size,
            character,
            controls: 'tilt',
            difficulty,
            view: '2d',
        });
        navigate(`/maze/play?${params.toString()}`);
    };

    // Go back
    const handleBack = () => {
        navigate('/maze');
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-void)' }}>
            {/* Header */}
            <header className="border-b border-elevated">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--color-accent, #06b6d4)' }}>
                        📱 Motion Calibration
                    </h1>
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                    >
                        {theme === 'light' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
                <div className="max-w-md mx-auto space-y-6">

                    {/* Step 1: Permission */}
                    {calibrationStep === 'permission' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-elevated/50 border border-elevated text-center">
                                <div className="text-5xl mb-4">📱</div>
                                <h2 className="text-xl font-bold text-text mb-2">Motion Controls</h2>
                                <p className="text-subtle mb-6">
                                    To use tilt controls, we need permission to access your device's motion sensors.
                                </p>

                                {permissionStatus === 'checking' && (
                                    <div className="text-cyan-400 animate-pulse">Checking permissions...</div>
                                )}

                                {permissionStatus === 'prompt' && (
                                    <button
                                        onClick={requestPermission}
                                        className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-400 text-void shadow-lg hover:shadow-xl transition-all"
                                    >
                                        🎯 Allow Motion Access
                                    </button>
                                )}

                                {permissionStatus === 'denied' && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                                            <p className="font-medium">Motion access denied</p>
                                            <p className="text-sm mt-1">
                                                Please enable motion access in your browser settings, then reload.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="w-full py-3 rounded-xl font-medium bg-elevated hover:bg-muted text-text transition-colors"
                                        >
                                            🔄 Reload Page
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBack}
                                className="w-full py-3 rounded-xl font-medium bg-elevated hover:bg-muted text-text transition-colors"
                            >
                                ← Back to Options
                            </button>
                        </div>
                    )}

                    {/* Step 2: Ready to Calibrate */}
                    {calibrationStep === 'ready' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-elevated/50 border border-elevated text-center">
                                <div className="text-5xl mb-4">✓</div>
                                <h2 className="text-xl font-bold text-text mb-2">Motion Access Granted!</h2>
                                <p className="text-subtle mb-2">
                                    Hold your phone in a comfortable playing position, then calibrate.
                                </p>

                                {/* Live tilt preview */}
                                <div className="mt-4 p-4 rounded-lg bg-void/50 text-left">
                                    <div className="text-xs text-subtle mb-2">Current Orientation:</div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="p-2 rounded bg-elevated">
                                            <span className="text-subtle">Tilt: </span>
                                            <span className="text-cyan-400 font-mono">{currentBeta.toFixed(1)}°</span>
                                        </div>
                                        <div className="p-2 rounded bg-elevated">
                                            <span className="text-subtle">Roll: </span>
                                            <span className="text-cyan-400 font-mono">{currentGamma.toFixed(1)}°</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                                <p className="font-medium">💡 Calibration Tip</p>
                                <p className="mt-1">
                                    Hold your device steady at the angle you want to be "neutral" (no movement).
                                    This becomes your rest position during the maze.
                                </p>
                            </div>

                            <button
                                onClick={startCalibration}
                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-400 text-void shadow-lg hover:shadow-xl transition-all"
                            >
                                🎯 Calibrate Now
                            </button>

                            <button
                                onClick={handleSkip}
                                className="w-full py-3 rounded-xl font-medium bg-elevated hover:bg-muted text-text transition-colors"
                            >
                                Skip Calibration →
                            </button>
                        </div>
                    )}

                    {/* Step 3: Calibrating (sampling) */}
                    {calibrationStep === 'calibrating' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-elevated/50 border border-elevated text-center">
                                <div className="text-5xl mb-4 animate-pulse">📐</div>
                                <h2 className="text-xl font-bold text-text mb-2">Hold Still...</h2>
                                <p className="text-subtle mb-4">
                                    Keep your device steady while we calibrate.
                                </p>

                                {/* Progress bar */}
                                <div className="w-full h-3 rounded-full bg-void overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-100"
                                        style={{ width: `${samplingProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-subtle mt-2">Sampling motion data...</p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Sensitivity Testing */}
                    {calibrationStep === 'sensitivity' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center">
                                <p className="font-medium">✓ Calibration Complete!</p>
                                <p className="text-sm mt-1">
                                    Neutral: Tilt {neutralBeta.toFixed(1)}° / Roll {neutralGamma.toFixed(1)}°
                                </p>
                            </div>

                            {/* Test area */}
                            <div className="p-4 rounded-xl bg-elevated/50 border border-elevated">
                                <h3 className="text-sm font-semibold text-subtle mb-3">Test Your Controls</h3>
                                <p className="text-xs text-subtle mb-4">
                                    Tilt your device to move the ball below. Adjust sensitivity if needed.
                                </p>

                                {/* Test pad */}
                                <div
                                    className="relative w-full aspect-square rounded-lg bg-void overflow-hidden mb-4"
                                    style={{
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                        {[...Array(9)].map((_, i) => (
                                            <div key={i} className="border border-elevated/30" />
                                        ))}
                                    </div>

                                    {/* Center marker */}
                                    <div
                                        className="absolute w-4 h-4 rounded-full border-2 border-cyan-500/50"
                                        style={{ left: 'calc(50% - 8px)', top: 'calc(50% - 8px)' }}
                                    />

                                    {/* Test ball */}
                                    <div
                                        className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg transition-all duration-75"
                                        style={{
                                            left: `calc(${testBallPos.x}% - 16px)`,
                                            top: `calc(${testBallPos.y}% - 16px)`,
                                            boxShadow: '0 0 15px rgba(6, 182, 212, 0.6)',
                                        }}
                                    />
                                </div>

                                {/* Sensitivity slider */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-subtle">Sensitivity</span>
                                        <span className="text-cyan-400 font-mono">{sensitivity.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.3"
                                        max="2.5"
                                        step="0.1"
                                        value={sensitivity}
                                        onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                                        className="w-full h-2 rounded-full bg-elevated appearance-none cursor-pointer accent-cyan-500"
                                    />
                                    <div className="flex justify-between text-xs text-subtle">
                                        <span>Slower</span>
                                        <span>Faster</span>
                                    </div>
                                </div>

                                {/* Deadzone slider */}
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-subtle">Dead Zone</span>
                                        <span className="text-cyan-400 font-mono">{deadzone}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="15"
                                        step="1"
                                        value={deadzone}
                                        onChange={(e) => setDeadzone(parseInt(e.target.value))}
                                        className="w-full h-2 rounded-full bg-elevated appearance-none cursor-pointer accent-cyan-500"
                                    />
                                    <div className="flex justify-between text-xs text-subtle">
                                        <span>None (jittery)</span>
                                        <span>Large (stable)</span>
                                    </div>
                                </div>

                                {/* Recalibrate button */}
                                <button
                                    onClick={() => {
                                        setCalibrationStep('ready');
                                        setTestBallPos({ x: 50, y: 50 });
                                    }}
                                    className="w-full mt-4 py-2 rounded-lg bg-elevated hover:bg-muted text-sm text-text transition-colors"
                                >
                                    🔄 Recalibrate
                                </button>
                            </div>

                            <button
                                onClick={handleComplete}
                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-400 text-void shadow-lg hover:shadow-xl transition-all"
                            >
                                🌀 Start Maze!
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
