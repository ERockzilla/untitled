import { useState, useEffect, useCallback } from 'react';

const DEFAULT_TEXT = `╔══════════════════════════════════════════════════════════════════╗
║                         SCRATCHPAD                               ║
║                                                                  ║
║  You found the hidden notepad.                                   ║
║                                                                  ║
║  This space persists in your browser's localStorage.             ║
║  Write anything. Notes, code, thoughts, n^e thing.               ║
║                                                                  ║
║  Ctrl+S saves. Auto-saves on blur.                               ║
║  No one else can see this.                                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

`;

const STORAGE_KEY = 'scratchpad_content';
const STORAGE_TIMESTAMP_KEY = 'scratchpad_last_saved';

export function Scratchpad() {
    const [content, setContent] = useState<string>('');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [showSaveIndicator, setShowSaveIndicator] = useState(false);

    // Load content from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);

        if (saved !== null) {
            setContent(saved);
        } else {
            setContent(DEFAULT_TEXT);
        }

        if (timestamp) {
            setLastSaved(timestamp);
        }
    }, []);

    // Save function
    const save = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, content);
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, now);
        setLastSaved(now);
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 1500);
    }, [content]);

    // Keyboard shortcut for save (Ctrl+S)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [save]);

    // Auto-save on blur
    const handleBlur = () => {
        save();
    };

    // Format timestamp for display
    const formatTimestamp = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString();
    };

    // Clear content
    const handleClear = () => {
        if (confirm('Clear all content? This cannot be undone.')) {
            setContent(DEFAULT_TEXT);
            save();
        }
    };

    // Word and character count
    const charCount = content.length;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lineCount = content.split('\n').length;

    return (
        <div style={styles.container}>
            {/* Save indicator */}
            <div style={{
                ...styles.saveIndicator,
                opacity: showSaveIndicator ? 1 : 0,
            }}>
                saved
            </div>

            {/* Textarea */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                style={styles.textarea}
                spellCheck={false}
                autoFocus
                placeholder="Type here..."
            />

            {/* Status bar */}
            <div style={styles.statusBar}>
                <span style={styles.statusItem}>
                    {lineCount} lines · {wordCount} words · {charCount} chars
                </span>
                <span style={styles.statusItem}>
                    {lastSaved ? `saved ${formatTimestamp(lastSaved)}` : 'not saved'}
                </span>
                <button onClick={handleClear} style={styles.clearButton}>
                    clear
                </button>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
    },
    saveIndicator: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '6px 12px',
        backgroundColor: '#1a1a2e',
        color: '#4ade80',
        borderRadius: '4px',
        fontSize: '12px',
        letterSpacing: '0.5px',
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        border: '1px solid #2a2a3e',
    },
    textarea: {
        flex: 1,
        backgroundColor: 'transparent',
        color: '#e0e0e0',
        border: 'none',
        outline: 'none',
        resize: 'none',
        padding: '24px',
        fontSize: '14px',
        lineHeight: '1.6',
        fontFamily: 'inherit',
        caretColor: '#4ade80',
    },
    statusBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 24px',
        backgroundColor: '#111',
        borderTop: '1px solid #1a1a1a',
        fontSize: '11px',
        color: '#666',
        gap: '16px',
    },
    statusItem: {
        letterSpacing: '0.3px',
    },
    clearButton: {
        background: 'none',
        border: '1px solid #333',
        color: '#666',
        padding: '4px 10px',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '11px',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
    },
};

export default Scratchpad;
