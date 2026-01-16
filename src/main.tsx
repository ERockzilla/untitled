import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';

// 🎂 The DRock Console Easter Egg 🎂
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

  const projectSummary = `
%c
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Made with ❤️ by ERock.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  const warningMessage = `
%c⚠️ LEGAL DISCLAIMER: 
If you're not DRock and you're reading this... well, now 
you know how cool someone else's sister is. Jealous? 
Thought so. 💅
`;

  const isDRockDomain = window.location.hostname.startsWith('d.');
  const domainMessage = isDRockDomain
    ? `\n%c👑 VIP MODE ACTIVATED: Welcome to the DRock Lounge, Your Majesty! 👑\n`
    : `\n%c🏢 Standard Mode: You're on the normie version. Visit d.rocksystems.cloud for the real magic.\n`;

  // Print with styles
  console.log(asciiArt, 'color: #ff6b9d; font-weight: bold; font-size: 10px;');
  console.log(welcomeMessage, 'color: #4ecdc4; font-size: 14px;');
  console.log(projectSummary, 'color: #ffe66d; font-size: 12px; line-height: 1.5;');
  console.log(warningMessage, 'color: #ff6b6b; font-size: 11px; font-style: italic;');
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
    '💖 Love Level': 'Infinity'
  });

  console.log('Now go click around and enjoy! Or don\'t. 🚀',
    'color: #74b9ff; font-size: 12px; padding: 10px 0;');
};

import { ThemeProvider } from './lib/ThemeContext';
import { AuthProvider } from './lib/AuthContext';

// Fire the console message when the app loads
showConsoleMessage();

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
