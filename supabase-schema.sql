-- Supabase Schema for Games App
-- Run this SQL in your Supabase project's SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Stores user profile information linked to auth.users

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. GAME RESULTS TABLE
-- ============================================
-- Stores individual game results for all game types

create table if not exists public.game_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_type text not null, -- 'wordle', 'tetris', 'sudoku', 'wordsearch', 'puzzle'
  won boolean not null,
  score integer,
  attempts integer, -- for wordle: number of guesses (1-6)
  time_seconds integer,
  played_at timestamp with time zone default now(),
  daily_challenge boolean default false,
  daily_date date -- for daily challenges, stores the date
);

-- Indexes for efficient queries
create index if not exists game_results_game_type_idx 
  on public.game_results(game_type, played_at desc);
create index if not exists game_results_user_idx 
  on public.game_results(user_id, game_type);
create index if not exists game_results_daily_idx 
  on public.game_results(game_type, daily_date, won) 
  where daily_challenge = true;

-- Enable Row Level Security
alter table public.game_results enable row level security;

-- Policies for game_results
create policy "Users can insert own results"
  on public.game_results for insert with check (auth.uid() = user_id);

create policy "Results are viewable by everyone"
  on public.game_results for select using (true);

-- ============================================
-- 3. USER STATS VIEW
-- ============================================
-- Aggregated stats per user per game type

create or replace view public.user_game_stats as
select 
  gr.user_id,
  gr.game_type,
  count(*) as games_played,
  count(*) filter (where gr.won) as games_won,
  max(gr.score) as best_score,
  min(gr.time_seconds) filter (where gr.won) as best_time,
  p.username,
  p.display_name,
  p.avatar_url
from public.game_results gr
join public.profiles p on gr.user_id = p.id
group by gr.user_id, gr.game_type, p.username, p.display_name, p.avatar_url;

-- ============================================
-- 4. DAILY LEADERBOARD VIEW
-- ============================================
-- Ranked leaderboard for today's daily challenge

create or replace view public.daily_leaderboard as
select 
  gr.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  gr.game_type,
  gr.attempts,
  gr.score,
  gr.time_seconds,
  gr.played_at,
  row_number() over (
    partition by gr.game_type 
    order by 
      gr.attempts asc nulls last,
      gr.time_seconds asc nulls last,
      gr.played_at asc
  ) as rank
from public.game_results gr
join public.profiles p on gr.user_id = p.id
where gr.daily_challenge = true 
  and gr.daily_date = current_date
  and gr.won = true;

-- ============================================
-- 5. ALL-TIME LEADERBOARD VIEW
-- ============================================
-- Top players by total wins

create or replace view public.alltime_leaderboard as
select 
  gr.user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  gr.game_type,
  count(*) filter (where gr.won) as total_wins,
  count(*) as total_played,
  round(100.0 * count(*) filter (where gr.won) / count(*), 1) as win_rate,
  row_number() over (
    partition by gr.game_type 
    order by count(*) filter (where gr.won) desc
  ) as rank
from public.game_results gr
join public.profiles p on gr.user_id = p.id
group by gr.user_id, gr.game_type, p.username, p.display_name, p.avatar_url;

-- ============================================
-- 6. STREAK CALCULATION FUNCTION
-- ============================================
-- Calculate current and max streak for a user/game

create or replace function public.get_user_streak(
  p_user_id uuid,
  p_game_type text
)
returns table (
  current_streak integer,
  max_streak integer
) as $$
declare
  v_current_streak integer := 0;
  v_max_streak integer := 0;
  v_prev_date date;
  v_curr_date date;
  v_streak integer := 0;
begin
  -- Calculate streaks from daily wins
  for v_curr_date in
    select distinct daily_date
    from public.game_results
    where user_id = p_user_id
      and game_type = p_game_type
      and daily_challenge = true
      and won = true
    order by daily_date desc
  loop
    if v_prev_date is null then
      v_streak := 1;
      -- Check if this is today or yesterday for current streak
      if v_curr_date >= current_date - interval '1 day' then
        v_current_streak := 1;
      end if;
    elsif v_prev_date - v_curr_date = 1 then
      v_streak := v_streak + 1;
      if v_current_streak > 0 then
        v_current_streak := v_streak;
      end if;
    else
      v_max_streak := greatest(v_max_streak, v_streak);
      v_streak := 1;
      if v_current_streak > 0 then
        v_current_streak := 0; -- Streak broken
      end if;
    end if;
    v_prev_date := v_curr_date;
  end loop;
  
  v_max_streak := greatest(v_max_streak, v_streak);
  
  return query select v_current_streak, v_max_streak;
end;
$$ language plpgsql stable;

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================
-- Enable realtime subscriptions for leaderboards

alter publication supabase_realtime add table public.game_results;

-- ============================================
-- DONE!
-- ============================================
-- After running this SQL:
-- 1. Go to Authentication > Providers and enable Email
-- 2. Set your site URL in Authentication > URL Configuration
-- 3. Copy your API keys from Settings > API to your .env.local file
