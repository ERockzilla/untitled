// Database types for Supabase - matches the schema in the plan

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    display_name: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    display_name?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    display_name?: string | null;
                    created_at?: string;
                };
            };
            game_results: {
                Row: {
                    id: string;
                    user_id: string;
                    game_type: string;
                    won: boolean;
                    score: number | null;
                    attempts: number | null;
                    time_seconds: number | null;
                    played_at: string;
                    daily_challenge: boolean;
                    daily_date: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    game_type: string;
                    won: boolean;
                    score?: number | null;
                    attempts?: number | null;
                    time_seconds?: number | null;
                    played_at?: string;
                    daily_challenge?: boolean;
                    daily_date?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    game_type?: string;
                    won?: boolean;
                    score?: number | null;
                    attempts?: number | null;
                    time_seconds?: number | null;
                    played_at?: string;
                    daily_challenge?: boolean;
                    daily_date?: string | null;
                };
            };
        };
        Views: {
            user_streaks: {
                Row: {
                    user_id: string;
                    game_type: string;
                    total_wins: number;
                    total_played: number;
                    username: string | null;
                    display_name: string | null;
                };
            };
            daily_leaderboard: {
                Row: {
                    user_id: string;
                    username: string | null;
                    display_name: string | null;
                    game_type: string;
                    attempts: number | null;
                    played_at: string;
                    rank: number;
                };
            };
        };
    };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type GameResult = Database['public']['Tables']['game_results']['Row'];
export type GameResultInsert = Database['public']['Tables']['game_results']['Insert'];
export type UserStreak = Database['public']['Views']['user_streaks']['Row'];
export type LeaderboardEntry = Database['public']['Views']['daily_leaderboard']['Row'];
