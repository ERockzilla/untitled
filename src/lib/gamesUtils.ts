// Games utility functions - shared across all games
import { supabase } from './supabase';
import type { GameResultInsert } from './database.types';

export interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    bestScore?: number;
    bestTime?: number; // in seconds
    currentStreak?: number;
    maxStreak?: number;
    lastPlayed?: string; // ISO date string
}

export interface GameResultOptions {
    score?: number;
    attempts?: number;
    timeSeconds?: number;
    isDaily?: boolean;
}

const STATS_PREFIX = 'game_stats_';
const MIGRATION_KEY = 'cloud_migration_done';

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

// ============================================
// CLOUD SYNC FUNCTIONS
// ============================================

/**
 * Record a game result to Supabase (for logged-in users)
 */
export async function recordCloudResult(
    userId: string,
    gameId: string,
    won: boolean,
    options: GameResultOptions = {}
): Promise<{ error: Error | null }> {
    if (!supabase) {
        return { error: new Error('Supabase not configured') };
    }

    const today = new Date().toISOString().split('T')[0];

    const result: GameResultInsert = {
        user_id: userId,
        game_type: gameId,
        won,
        score: options.score,
        attempts: options.attempts,
        time_seconds: options.timeSeconds,
        daily_challenge: options.isDaily ?? false,
        daily_date: options.isDaily ? today : null,
    };

    const { error } = await supabase
        .from('game_results')
        .insert(result);

    return { error: error ? new Error(error.message) : null };
}

/**
 * Load aggregated stats from Supabase for a user/game
 */
export async function loadCloudStats(
    userId: string,
    gameId: string
): Promise<{ stats: GameStats | null; error: Error | null }> {
    if (!supabase) {
        return { stats: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await supabase
        .from('game_results')
        .select('won, score, time_seconds')
        .eq('user_id', userId)
        .eq('game_type', gameId);

    if (error) {
        return { stats: null, error: new Error(error.message) };
    }

    if (!data || data.length === 0) {
        return {
            stats: { gamesPlayed: 0, gamesWon: 0 },
            error: null
        };
    }

    // Calculate stats from results
    const stats: GameStats = {
        gamesPlayed: data.length,
        gamesWon: data.filter(r => r.won).length,
        bestScore: Math.max(...data.filter(r => r.score != null).map(r => r.score!), 0) || undefined,
        bestTime: Math.min(...data.filter(r => r.won && r.time_seconds != null).map(r => r.time_seconds!)) || undefined,
    };

    // Get streak info from the database function
    const { data: streakData } = await supabase
        .rpc('get_user_streak', { p_user_id: userId, p_game_type: gameId });

    if (streakData && streakData.length > 0) {
        stats.currentStreak = streakData[0].current_streak;
        stats.maxStreak = streakData[0].max_streak;
    }

    return { stats, error: null };
}

/**
 * Check if local stats should be migrated to cloud
 */
export function needsMigration(): boolean {
    return localStorage.getItem(MIGRATION_KEY) !== 'true';
}

/**
 * Migrate local localStorage stats to Supabase on first login
 * This preserves user's existing progress when they create an account
 */
export async function migrateLocalToCloud(userId: string): Promise<{ error: Error | null }> {
    if (!supabase) {
        return { error: new Error('Supabase not configured') };
    }

    // Already migrated
    if (!needsMigration()) {
        return { error: null };
    }

    const gameIds = ['wordle', 'tetris', 'sudoku', 'wordsearch', 'puzzle'];
    const errors: string[] = [];

    for (const gameId of gameIds) {
        const localStats = loadGameStats(gameId);

        if (localStats.gamesPlayed > 0) {
            // Create synthetic game results to represent historical data
            // We can't perfectly reconstruct individual games, but we can preserve totals
            const results: GameResultInsert[] = [];

            // Add wins
            for (let i = 0; i < localStats.gamesWon; i++) {
                results.push({
                    user_id: userId,
                    game_type: gameId,
                    won: true,
                    score: i === 0 ? localStats.bestScore : undefined,
                    time_seconds: i === 0 ? localStats.bestTime : undefined,
                });
            }

            // Add losses
            const losses = localStats.gamesPlayed - localStats.gamesWon;
            for (let i = 0; i < losses; i++) {
                results.push({
                    user_id: userId,
                    game_type: gameId,
                    won: false,
                });
            }

            if (results.length > 0) {
                const { error } = await supabase
                    .from('game_results')
                    .insert(results);

                if (error) {
                    errors.push(`${gameId}: ${error.message}`);
                }
            }
        }
    }

    // Mark migration as complete even if there were some errors
    // to prevent repeated migration attempts
    localStorage.setItem(MIGRATION_KEY, 'true');

    if (errors.length > 0) {
        return { error: new Error(`Migration errors: ${errors.join(', ')}`) };
    }

    return { error: null };
}

/**
 * Combined function to record a game result both locally and to cloud
 * Use this when you have access to userId (from useAuth)
 */
export async function recordGameResultWithSync(
    gameId: string,
    won: boolean,
    userId: string | null,
    options: GameResultOptions = {}
): Promise<GameStats> {
    // Always save locally first (fast, works offline)
    const stats = recordGameResult(
        gameId,
        won,
        options.score,
        options.timeSeconds
    );

    // If logged in, also save to cloud (async, non-blocking)
    if (userId) {
        recordCloudResult(userId, gameId, won, options).catch(err => {
            console.error('Failed to sync to cloud:', err);
        });
    }

    return stats;
}
