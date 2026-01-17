import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// 🎂 The DRock Console Easter Egg System 🎂
const showConsoleMessage = () => {
  const asciiArt = `
%c
██████╗ ██████╗  ██████╗  ██████╗██╗  ██╗
██╔══██╗██╔══██╗██╔═══██╗██╔════╝██║ ██╔╝
██║  ██║██████╔╝██║   ██║██║     █████╔╝ 
██║  ██║██╔══██╗██║   ██║██║     ██╔═██╗ 
██████╔╝██║  ██║╚██████╔╝╚██████╗██║  ██╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
        ✨ VISUAL WORKSPACE ✨
`;

  const welcomeMessage = `
%c🎉 Oh, you found the console! 🎉

Congrats, you absolute legend. You're clearly the type of person who 
looks under the couch cushions at someone else's house. We respect that.
`;

  const secretCommands = `
%c
┌──────────────────────────────────────────────────────────────┐
│  🕹️  SECRET CONSOLE COMMANDS                                  │
├──────────────────────────────────────────────────────────────┤
│  help()       - Show this menu again                         │
│  party()      - 🎊 Trigger party mode (confetti everywhere!) │
│  matrix()     - 💊 Enter the Matrix                          │
│  credits()    - 🎬 Roll the credits                          │
│  barrel()     - 🛢️  Do a barrel roll!                         │
│  disco()      - 🪩 Disco mode activated                       │
│  konami()     - 🎮 Hint: ↑↑↓↓←→←→BA                          │
│  secrets()    - 🔮 How many Easter eggs have you found?      │
│  coffee()     - ☕ The most important command                 │
│  love()       - ❤️  A special message                         │
└──────────────────────────────────────────────────────────────┘
`;

  const projectSummary = `
%c
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Made with ❤️, ☕, and questionable sleep schedules by ERock.
Version: 1.0.0 | Build: ${new Date().toISOString().split('T')[0]}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  const warningMessage = `
%c⚠️ LEGAL DISCLAIMER: 
If you're not DRock and you're reading this... well, now 
you know how cool someone else's sister is. Jealous? 
Thought so. 💅
`;

  const hiddenMessage = `
%c
    ╔═══════════════════════════════════════════════════╗
    ║  🥚 HIDDEN EASTER EGGS IN THIS SITE:              ║
    ║  • Type special words anywhere on the page        ║
    ║  • Click the logo multiple times                  ║
    ║  • Try the Konami Code                            ║
    ║  • Check the HTTP headers (Network tab)           ║
    ║  • Look for hidden pixels                         ║
    ║  • Wait... what time is it?                       ║
    ║  • Did someone say "pride"?                       ║
    ║  • The answer is always 42                        ║
    ╚═══════════════════════════════════════════════════╝
`;

  const isDRockDomain = window.location.hostname.startsWith('d.');
  const domainMessage = isDRockDomain
    ? `\n%c👑 VIP MODE ACTIVATED: Welcome to the DRock Lounge, Your Majesty! 👑\n`
    : `\n%c🏢 Standard Mode: You're on the normie version. Visit d.rocksystems.cloud for the real magic.\n`;

  // Print with styles
  console.log(asciiArt, 'color: #ff6b9d; font-weight: bold; font-size: 10px;');
  console.log(welcomeMessage, 'color: #4ecdc4; font-size: 14px;');
  console.log(secretCommands, 'color: #a29bfe; font-size: 11px; font-family: monospace;');
  console.log(projectSummary, 'color: #ffe66d; font-size: 12px; line-height: 1.5;');
  console.log(warningMessage, 'color: #ff6b6b; font-size: 11px; font-style: italic;');
  console.log(hiddenMessage, 'color: #00ff88; font-size: 10px; font-family: monospace;');
  console.log(
    domainMessage,
    isDRockDomain
      ? 'color: #ffd700; font-size: 16px; font-weight: bold; text-shadow: 0 0 10px gold;'
      : 'color: #888; font-size: 12px;'
  );

  // Fun little table for the nerds
  console.log('%c📊 Quick Stats:', 'color: #a29bfe; font-weight: bold; font-size: 14px;');
  console.table({
    '🎂 Project': 'Happy Birthday LED Protocol',
    '🎯 Purpose': 'Being the best sibling ever',
    '🔥 Coolness Factor': 'Over 9000',
    '💖 Love Level': 'Infinity',
    '🥚 Easter Eggs': '12+ hidden throughout',
    '☕ Coffee Consumed': '∞',
  });

  console.log('%cNow go click around and enjoy! 🚀',
    'color: #74b9ff; font-size: 12px; padding: 10px 0;');
};

// Easter egg tracker
const easterEggState = {
  found: new Set<string>(),
  total: 12,
};

// Define global console commands as Easter eggs
const defineConsoleCommands = () => {
  // Help command
  (window as unknown as Record<string, unknown>).help = () => {
    console.log('%c🕹️ Available Commands:', 'color: #ff6b9d; font-size: 16px; font-weight: bold;');
    console.log('%cparty(), matrix(), credits(), barrel(), disco(), konami(), secrets(), coffee(), love()',
      'color: #4ecdc4; font-size: 12px;');
    return '💡 Type any command to activate!';
  };

  // Party mode
  (window as unknown as Record<string, unknown>).party = () => {
    easterEggState.found.add('party');
    document.body.classList.add('party-mode');
    console.log('%c🎊 PARTY MODE! 🎊', 'color: #ff6b9d; font-size: 24px; font-weight: bold;');

    // Create confetti
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'console-confetti';
        confetti.style.cssText = `
          position: fixed;
          top: -10px;
          left: ${Math.random() * 100}vw;
          width: ${Math.random() * 10 + 5}px;
          height: ${Math.random() * 10 + 5}px;
          background: ${['#ff6b9d', '#4ecdc4', '#ffe66d', '#a29bfe', '#ff6b6b'][Math.floor(Math.random() * 5)]};
          border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
          animation: confetti-fall 3s ease-out forwards;
          pointer-events: none;
          z-index: 99999;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
      }, i * 50);
    }

    setTimeout(() => document.body.classList.remove('party-mode'), 5000);
    return '🎉 The party has started!';
  };

  // Matrix mode
  (window as unknown as Record<string, unknown>).matrix = () => {
    easterEggState.found.add('matrix');
    console.log('%c💊 Wake up, Neo...', 'color: #00ff00; font-size: 16px; font-family: monospace;');
    document.body.style.filter = 'hue-rotate(90deg) saturate(2)';
    setTimeout(() => {
      document.body.style.filter = '';
    }, 5000);
    return 'Follow the white rabbit 🐇';
  };

  // Credits
  (window as unknown as Record<string, unknown>).credits = () => {
    easterEggState.found.add('credits');
    console.log(`
%c🎬 CREDITS 🎬

Directed by ................... ERock  
Produced by ................... ☕ & Late Nights
Written by .................... React & TypeScript
Special Thanks ................ DRock (the best sister)
Music by ...................... Lo-fi beats to code to
Catering ...................... DoorDash

No bugs were harmed in the making of this website.
(They were squashed mercilessly.)

%c❤️ Thank you for playing! ❤️
    `, 'color: #ffe66d; font-size: 12px;', 'color: #ff6b9d; font-size: 14px;');
    return '🎬 Roll credits!';
  };

  // Barrel roll
  (window as unknown as Record<string, unknown>).barrel = () => {
    easterEggState.found.add('barrel');
    console.log('%c🛢️ Do a barrel roll!', 'color: #ff6b6b; font-size: 16px;');
    document.documentElement.style.animation = 'barrel-roll 1s ease-in-out';
    setTimeout(() => {
      document.documentElement.style.animation = '';
    }, 1000);
    return 'Wheeeee! 🎢';
  };

  // Disco mode
  (window as unknown as Record<string, unknown>).disco = () => {
    easterEggState.found.add('disco');
    console.log('%c🪩 DISCO TIME! 🪩', 'color: #ff6b9d; font-size: 20px;');
    let hue = 0;
    const interval = setInterval(() => {
      hue = (hue + 30) % 360;
      document.body.style.filter = `hue-rotate(${hue}deg)`;
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      document.body.style.filter = '';
    }, 5000);
    return '🕺 Stayin\' alive! 💃';
  };

  // Konami hint
  (window as unknown as Record<string, unknown>).konami = () => {
    console.log('%c🎮 The Konami Code: ↑↑↓↓←→←→BA', 'color: #a29bfe; font-size: 14px;');
    console.log('%cTry entering it on any page!', 'color: #4ecdc4; font-size: 12px;');
    return 'Up up down down left right left right B A... 👾';
  };

  // Secrets counter
  (window as unknown as Record<string, unknown>).secrets = () => {
    const found = easterEggState.found.size;
    const total = easterEggState.total;
    const percentage = Math.round((found / total) * 100);

    console.log(`%c🔮 Easter Eggs Found: ${found}/${total} (${percentage}%)`,
      'color: #ffd700; font-size: 16px; font-weight: bold;');

    if (found === total) {
      console.log('%c🏆 COMPLETIONIST! You found them all! 🏆',
        'color: #00ff88; font-size: 18px;');
    } else {
      console.log('%cKeep exploring... 👀', 'color: #888; font-size: 12px;');
    }

    return `${found}/${total} Easter eggs discovered`;
  };

  // Coffee command
  (window as unknown as Record<string, unknown>).coffee = () => {
    easterEggState.found.add('coffee');
    console.log(`
%c
   ( (
    ) )
  ........
  |      |]
  \\      /
   \`----'
   
%c☕ Coffee is the developer's secret weapon.
%cFun fact: This entire site runs on caffeine.
    `, 'color: #8b4513; font-size: 12px; font-family: monospace;',
      'color: #ffe66d; font-size: 14px;',
      'color: #888; font-size: 11px;');
    return 'But first, coffee ☕';
  };

  // Love command
  (window as unknown as Record<string, unknown>).love = () => {
    easterEggState.found.add('love');
    console.log(`
%c
    ❤️ ❤️   ❤️ ❤️
  ❤️     ❤️     ❤️
  ❤️ Made with love ❤️
    ❤️  for DRock ❤️
      ❤️       ❤️
        ❤️   ❤️
          ❤️
%c
This project exists because family matters.
Happy Birthday to the best sister! 🎂
    `, 'color: #ff6b9d; font-size: 14px;',
      'color: #4ecdc4; font-size: 12px;');
    return '💖 Love you, DRock! 💖';
  };

  // Secret 42 command (The Answer)
  (window as unknown as Record<string, unknown>).theAnswer = () => {
    easterEggState.found.add('42');
    console.log('%c42', 'color: #00ff00; font-size: 40px; font-weight: bold;');
    console.log('%cThe Answer to the Ultimate Question of Life, the Universe, and Everything.',
      'color: #4ecdc4; font-size: 12px; font-style: italic;');
    return 'Don\'t Panic 🌌';
  };
};

// Add keyframe animations to document
const addEasterEggStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    
    @keyframes barrel-roll {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .party-mode {
      animation: party-pulse 0.3s infinite alternate;
    }
    
    @keyframes party-pulse {
      0% { filter: brightness(1); }
      100% { filter: brightness(1.1) hue-rotate(10deg); }
    }
  `;
  document.head.appendChild(style);
};

// Keyboard Easter egg detector
const setupKeyboardEasterEggs = () => {
  let buffer = '';
  const triggers: Record<string, () => void> = {
    'matrix': () => (window as unknown as Record<string, () => void>).matrix(),
    'barrel': () => (window as unknown as Record<string, () => void>).barrel(),
    'party': () => (window as unknown as Record<string, () => void>).party(),
    'disco': () => (window as unknown as Record<string, () => void>).disco(),
    'credits': () => (window as unknown as Record<string, () => void>).credits(),
    'coffee': () => (window as unknown as Record<string, () => void>).coffee(),
    'love': () => (window as unknown as Record<string, () => void>).love(),
    'pride': () => {
      easterEggState.found.add('pride');
      document.body.style.background = 'linear-gradient(180deg, #ff0000 16.66%, #ff8000 16.66%, #ff8000 33.33%, #ffff00 33.33%, #ffff00 50%, #00ff00 50%, #00ff00 66.66%, #0000ff 66.66%, #0000ff 83.33%, #8000ff 83.33%)';
      console.log('%c🏳️‍🌈 Happy Pride! 🏳️‍🌈', 'font-size: 24px;');
      setTimeout(() => { document.body.style.background = ''; }, 5000);
    },
    '42': () => (window as unknown as Record<string, () => void>).theAnswer(),
  };

  document.addEventListener('keypress', (e) => {
    buffer += e.key.toLowerCase();
    if (buffer.length > 20) buffer = buffer.slice(-20);

    for (const [trigger, action] of Object.entries(triggers)) {
      if (buffer.includes(trigger)) {
        action();
        buffer = '';
        break;
      }
    }
  });
};

// Initialize everything
addEasterEggStyles();
showConsoleMessage();
defineConsoleCommands();
setupKeyboardEasterEggs();

import { ThemeProvider } from './lib/ThemeContext';
import { AuthProvider } from './lib/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
