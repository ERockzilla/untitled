// Database types for Supabase - matches the schema in the plan
// Updated for @supabase/supabase-js v2.90+

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
                Relationships: [];
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
                Relationships: [
                    {
                        foreignKeyName: "game_results_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "profiles";
                        referencedColumns: ["id"];
                    }
                ];
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
                Relationships: [];
            };
            daily_leaderboard: {
                Row: {
                    user_id: string;
                    username: string | null;
                    display_name: string | null;
                    game_type: string;
                    attempts: number | null;
                    score: number | null;
                    played_at: string;
                    rank: number;
                };
                Relationships: [];
            };
            alltime_leaderboard: {
                Row: {
                    user_id: string;
                    username: string | null;
                    display_name: string | null;
                    game_type: string;
                    total_wins: number;
                    total_played: number;
                    win_rate: number;
                    rank: number;
                };
                Relationships: [];
            };
        };
        Functions: {
            get_user_streak: {
                Args: { p_user_id: string; p_game_type: string };
                Returns: { current_streak: number; max_streak: number }[];
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type GameResult = Database['public']['Tables']['game_results']['Row'];
export type GameResultInsert = Database['public']['Tables']['game_results']['Insert'];
export type UserStreak = Database['public']['Views']['user_streaks']['Row'];
export type LeaderboardEntry = Database['public']['Views']['daily_leaderboard']['Row'];
