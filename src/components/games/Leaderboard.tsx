import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

interface LeaderboardEntry {
    user_id: string;
    username: string | null;
    display_name: string | null;
    attempts: number | null;
    score: number | null;
    played_at: string;
    rank: number;
}

interface AllTimeEntry {
    user_id: string;
    username: string | null;
    display_name: string | null;
    total_wins: number;
    total_played: number;
    win_rate: number;
    rank: number;
}

interface LeaderboardProps {
    gameType: string;
    onClose: () => void;
}

type TabType = 'daily' | 'alltime';

export function Leaderboard({ gameType, onClose }: LeaderboardProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('daily');
    const [dailyEntries, setDailyEntries] = useState<LeaderboardEntry[]>([]);
    const [allTimeEntries, setAllTimeEntries] = useState<AllTimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch leaderboard data
    useEffect(() => {
        if (!isSupabaseConfigured() || !supabase) {
            setLoading(false);
            setError('Leaderboards require cloud connection');
            return;
        }

        const fetchLeaderboards = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch daily leaderboard
                const { data: daily, error: dailyError } = await supabase!
                    .from('daily_leaderboard')
                    .select('*')
                    .eq('game_type', gameType)
                    .order('rank')
                    .limit(50);

                if (dailyError) throw dailyError;
                setDailyEntries(daily || []);

                // Fetch all-time leaderboard
                const { data: allTime, error: allTimeError } = await supabase!
                    .from('alltime_leaderboard')
                    .select('*')
                    .eq('game_type', gameType)
                    .order('rank')
                    .limit(50);

                if (allTimeError) throw allTimeError;
                setAllTimeEntries(allTime || []);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
                setError('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboards();

        // Set up real-time subscription for daily leaderboard updates
        const channel = supabase!
            .channel('leaderboard-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_results',
                    filter: `game_type=eq.${gameType}`,
                },
                () => {
                    // Refetch when new results come in
                    fetchLeaderboards();
                }
            )
            .subscribe();

        return () => {
            supabase!.removeChannel(channel);
        };
    }, [gameType]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getDisplayName = (entry: { username: string | null; display_name: string | null; user_id: string }) => {
        return entry.display_name || entry.username || `User ${entry.user_id.slice(0, 6)}`;
    };

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'text-yellow-400 font-bold';
            case 2:
                return 'text-gray-300 font-bold';
            case 3:
                return 'text-amber-600 font-bold';
            default:
                return 'text-subtle';
        }
    };

    const getRankEmoji = (rank: number) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return '';
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-surface border border-elevated rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-elevated">
                    <h2 className="text-xl font-bold text-text">Leaderboard</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-elevated hover:bg-muted transition-colors flex items-center justify-center text-subtle hover:text-text"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-elevated">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'daily'
                                ? 'text-accent border-b-2 border-accent'
                                : 'text-subtle hover:text-text'
                            }`}
                    >
                        Today's Challenge
                    </button>
                    <button
                        onClick={() => setActiveTab('alltime')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'alltime'
                                ? 'text-accent border-b-2 border-accent'
                                : 'text-subtle hover:text-text'
                            }`}
                    >
                        All Time
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-subtle mb-4">{error}</p>
                            {!isSupabaseConfigured() && (
                                <p className="text-xs text-subtle">
                                    Configure Supabase to enable leaderboards
                                </p>
                            )}
                        </div>
                    ) : activeTab === 'daily' ? (
                        dailyEntries.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-subtle mb-2">No entries yet today!</p>
                                <p className="text-xs text-subtle">
                                    Be the first to complete today's challenge
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {dailyEntries.map((entry) => (
                                    <div
                                        key={entry.user_id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${user?.id === entry.user_id
                                                ? 'bg-accent/10 border border-accent/30'
                                                : 'bg-elevated'
                                            }`}
                                    >
                                        <div className={`w-8 text-center ${getRankStyle(entry.rank)}`}>
                                            {getRankEmoji(entry.rank) || `#${entry.rank}`}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-text truncate">
                                                {getDisplayName(entry)}
                                                {user?.id === entry.user_id && (
                                                    <span className="ml-2 text-xs text-accent">(you)</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-subtle">
                                                {formatDate(entry.played_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-text">
                                                {entry.attempts}/6
                                            </p>
                                            <p className="text-xs text-subtle">guesses</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        allTimeEntries.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-subtle mb-2">No players yet!</p>
                                <p className="text-xs text-subtle">
                                    Sign in and play to appear on the leaderboard
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {allTimeEntries.map((entry) => (
                                    <div
                                        key={entry.user_id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${user?.id === entry.user_id
                                                ? 'bg-accent/10 border border-accent/30'
                                                : 'bg-elevated'
                                            }`}
                                    >
                                        <div className={`w-8 text-center ${getRankStyle(entry.rank)}`}>
                                            {getRankEmoji(entry.rank) || `#${entry.rank}`}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-text truncate">
                                                {getDisplayName(entry)}
                                                {user?.id === entry.user_id && (
                                                    <span className="ml-2 text-xs text-accent">(you)</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-subtle">
                                                {entry.total_played} games played
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-text">
                                                {entry.total_wins} wins
                                            </p>
                                            <p className="text-xs text-subtle">
                                                {entry.win_rate}% rate
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                {!user && (
                    <div className="p-4 border-t border-elevated bg-elevated/50">
                        <p className="text-sm text-center text-subtle">
                            Sign in to appear on the leaderboard!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
