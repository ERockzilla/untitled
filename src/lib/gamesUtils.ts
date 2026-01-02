// Games utility functions - shared across all games

export interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    bestScore?: number;
    bestTime?: number; // in seconds
    currentStreak?: number;
    maxStreak?: number;
    lastPlayed?: string; // ISO date string
}

const STATS_PREFIX = 'game_stats_';

/**
 * Load game statistics from localStorage
 */
export function loadGameStats(gameId: string): GameStats {
    try {
        const saved = localStorage.getItem(STATS_PREFIX + gameId);
        return saved ? JSON.parse(saved) : {
            gamesPlayed: 0,
            gamesWon: 0,
        };
    } catch {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
        };
    }
}

/**
 * Save game statistics to localStorage
 */
export function saveGameStats(gameId: string, stats: GameStats): void {
    localStorage.setItem(STATS_PREFIX + gameId, JSON.stringify(stats));
}

/**
 * Record a game completion
 */
export function recordGameResult(
    gameId: string,
    won: boolean,
    score?: number,
    timeSeconds?: number
): GameStats {
    const stats = loadGameStats(gameId);
    const today = new Date().toISOString().split('T')[0];

    stats.gamesPlayed++;
    if (won) {
        stats.gamesWon++;

        // Update streak
        if (stats.lastPlayed === today) {
            // Already played today, don't update streak
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (stats.lastPlayed === yesterdayStr) {
                stats.currentStreak = (stats.currentStreak || 0) + 1;
            } else {
                stats.currentStreak = 1;
            }

            stats.maxStreak = Math.max(stats.maxStreak || 0, stats.currentStreak);
        }

        // Update best score (higher is better)
        if (score !== undefined) {
            stats.bestScore = Math.max(stats.bestScore || 0, score);
        }

        // Update best time (lower is better)
        if (timeSeconds !== undefined) {
            stats.bestTime = stats.bestTime
                ? Math.min(stats.bestTime, timeSeconds)
                : timeSeconds;
        }
    } else {
        // Lost - reset streak
        stats.currentStreak = 0;
    }

    stats.lastPlayed = today;
    saveGameStats(gameId, stats);
    return stats;
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get win percentage
 */
export function getWinPercentage(stats: GameStats): number {
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}
