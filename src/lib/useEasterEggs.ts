import { useState, useEffect, useCallback, useRef } from 'react';

// Konami Code: ↑↑↓↓←→←→BA
const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

interface EasterEggState {
    konamiActivated: boolean;
    rainbowMode: boolean;
    partyMode: boolean;
    secretsUnlocked: number;
}

export function useKonamiCode(onActivate: () => void) {
    const inputSequence = useRef<string[]>([]);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Reset timeout - code must be entered within 5 seconds
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                inputSequence.current = [];
            }, 5000);

            inputSequence.current.push(e.key.toLowerCase());

            // Keep only the last N keys (length of Konami code)
            if (inputSequence.current.length > KONAMI_CODE.length) {
                inputSequence.current.shift();
            }

            // Check if sequence matches
            const normalizedInput = inputSequence.current.map(k => k.toLowerCase());
            const normalizedCode = KONAMI_CODE.map(k => k.toLowerCase());

            if (normalizedInput.length === normalizedCode.length &&
                normalizedInput.every((key, i) => key === normalizedCode[i])) {
                onActivate();
                inputSequence.current = [];
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [onActivate]);
}

// Confetti cannon effect
export function launchConfetti(options?: {
    particleCount?: number;
    spread?: number;
    origin?: { x: number; y: number };
}) {
    const count = options?.particleCount || 100;
    const spread = options?.spread || 70;
    const originX = options?.origin?.x ?? 0.5;
    const originY = options?.origin?.y ?? 0.5;

    // Create confetti container if it doesn't exist
    let container = document.getElementById('confetti-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'confetti-container';
        container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
        document.body.appendChild(container);
    }

    const colors = ['#f43f5e', '#06b6d4', '#8b5cf6', '#22c55e', '#eab308', '#f97316'];

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const startX = window.innerWidth * originX;
        const startY = window.innerHeight * originY;

        confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${startX}px;
      top: ${startY}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      opacity: 1;
      transform: rotate(${Math.random() * 360}deg);
    `;

        container.appendChild(confetti);

        // Animate the confetti
        const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180) - Math.PI / 2;
        const velocity = Math.random() * 500 + 200;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        const gravity = 800;
        const rotationSpeed = (Math.random() - 0.5) * 720;

        let x = 0;
        let y = 0;
        let rotation = 0;
        let opacity = 1;
        let startTime: number | null = null;

        function animate(timestamp: number) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) / 1000;

            x = vx * elapsed;
            y = vy * elapsed + 0.5 * gravity * elapsed * elapsed;
            rotation = rotationSpeed * elapsed;
            opacity = Math.max(0, 1 - elapsed / 2);

            confetti.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            confetti.style.opacity = String(opacity);

            if (opacity > 0 && elapsed < 3) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        }

        requestAnimationFrame(animate);
    }

    // Clean up container after animation
    setTimeout(() => {
        if (container && container.children.length === 0) {
            container.remove();
        }
    }, 4000);
}

// Screen shake effect
export function screenShake(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    const root = document.documentElement;
    const duration = intensity === 'heavy' ? 500 : 300;

    root.style.animation = `shake-${intensity} ${duration}ms ease-in-out`;

    // Add keyframes if not present
    if (!document.getElementById('shake-styles')) {
        const style = document.createElement('style');
        style.id = 'shake-styles';
        style.textContent = `
      @keyframes shake-light {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }
      @keyframes shake-medium {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      @keyframes shake-heavy {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-10px, -5px); }
        20% { transform: translate(10px, 5px); }
        30% { transform: translate(-10px, 5px); }
        40% { transform: translate(10px, -5px); }
        50% { transform: translate(-5px, 10px); }
        60% { transform: translate(5px, -10px); }
        70% { transform: translate(-5px, -5px); }
        80% { transform: translate(5px, 5px); }
        90% { transform: translate(-3px, -3px); }
      }
    `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        root.style.animation = '';
    }, duration);
}

// Achievement toast notification
export function showAchievement(title: string, description: string, emoji: string = '🏆') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('achievement-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'achievement-container';
        container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(6, 182, 212, 0.95));
      backdrop-filter: blur(10px);
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
      font-family: system-ui, sans-serif;
      transform: translateX(120%);
      animation: slideIn 0.5s ease-out forwards;
      max-width: 300px;
    ">
      <span style="font-size: 28px;">${emoji}</span>
      <div>
        <div style="font-weight: bold; font-size: 14px;">${title}</div>
        <div style="font-size: 12px; opacity: 0.9;">${description}</div>
      </div>
    </div>
  `;

    // Add animation style if not present
    if (!document.getElementById('achievement-styles')) {
        const style = document.createElement('style');
        style.id = 'achievement-styles';
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(120%); }
        to { transform: translateX(0); }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);

    // Haptic feedback
    if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
    }

    // Remove after delay
    setTimeout(() => {
        const inner = toast.firstElementChild as HTMLElement;
        if (inner) {
            inner.style.animation = 'slideOut 0.5s ease-in forwards';
        }
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Streak fire effect for UI elements
export function useStreakEffect(streak: number) {
    const [flames, setFlames] = useState(false);

    useEffect(() => {
        if (streak >= 3) {
            setFlames(true);
        } else {
            setFlames(false);
        }
    }, [streak]);

    const flameStyle = flames ? {
        animation: 'flame-glow 0.5s ease-in-out infinite alternate',
        filter: `drop-shadow(0 0 ${Math.min(streak * 2, 20)}px #f97316)`,
    } : {};

    return { flames, flameStyle };
}

// Combined easter egg hook
export function useEasterEggs() {
    const [state, setState] = useState<EasterEggState>({
        konamiActivated: false,
        rainbowMode: false,
        partyMode: false,
        secretsUnlocked: 0,
    });

    const activateKonami = useCallback(() => {
        setState(prev => ({
            ...prev,
            konamiActivated: true,
            secretsUnlocked: prev.secretsUnlocked + 1,
        }));

        launchConfetti({ particleCount: 200, spread: 100 });
        screenShake('heavy');
        showAchievement('🎮 KONAMI CODE!', 'You unlocked retro mode!', '👾');

        // Add retro theme class
        document.body.classList.add('retro-mode');
    }, []);

    const toggleRainbowMode = useCallback(() => {
        setState(prev => ({ ...prev, rainbowMode: !prev.rainbowMode }));
        if (!state.rainbowMode) {
            showAchievement('🌈 Rainbow Mode', 'Everything is colorful now!', '✨');
        }
        document.body.classList.toggle('rainbow-mode');
    }, [state.rainbowMode]);

    const triggerPartyMode = useCallback(() => {
        setState(prev => ({ ...prev, partyMode: true }));
        launchConfetti({ particleCount: 50 });

        // Party for 5 seconds
        const interval = setInterval(() => {
            launchConfetti({
                particleCount: 20,
                origin: { x: Math.random(), y: Math.random() * 0.5 }
            });
        }, 300);

        setTimeout(() => {
            clearInterval(interval);
            setState(prev => ({ ...prev, partyMode: false }));
        }, 5000);
    }, []);

    // Set up Konami code listener
    useKonamiCode(activateKonami);

    return {
        ...state,
        activateKonami,
        toggleRainbowMode,
        triggerPartyMode,
        launchConfetti,
        screenShake,
        showAchievement,
    };
}
