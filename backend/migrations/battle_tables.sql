-- Battles: each row is one 1v1 prompt battle
create table if not exists public.battles (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references auth.users(id) on delete cascade,
  opponent_id     uuid references auth.users(id) on delete set null,
  theme           text not null,  -- e.g. "Dragon in a library"
  prompt_a        text not null,
  image_a_url     text not null,
  prompt_b        text,
  image_b_url     text,
  model_a         text not null default 'fal_flux_dev',
  model_b         text,
  status          text not null default 'waiting_opponent', -- waiting_opponent | voting | completed | cancelled
  votes_a         int not null default 0,
  votes_b         int not null default 0,
  winner          char(1),        -- 'A' | 'B' | 'T' (tie) | null
  nsfw            boolean not null default false,
  created_at      timestamptz not null default now(),
  voting_ends_at  timestamptz,    -- set when status transitions to 'voting'
  closed_at       timestamptz
);

create index if not exists battles_status_idx on public.battles (status, created_at desc);
create index if not exists battles_creator_idx on public.battles (creator_id);
create index if not exists battles_opponent_idx on public.battles (opponent_id);
create index if not exists battles_voting_ends_idx on public.battles (voting_ends_at) where status = 'voting';

-- Votes: one row per user per battle (unique constraint)
create table if not exists public.battle_votes (
  id          uuid primary key default gen_random_uuid(),
  battle_id   uuid not null references public.battles(id) on delete cascade,
  voter_id    uuid not null references auth.users(id) on delete cascade,
  voted_for   char(1) not null check (voted_for in ('A', 'B')),
  created_at  timestamptz not null default now(),
  unique (battle_id, voter_id)
);

create index if not exists battle_votes_battle_idx on public.battle_votes (battle_id);

-- Per-user battle stats
create table if not exists public.battle_stats (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  wins          int not null default 0,
  losses        int not null default 0,
  ties          int not null default 0,
  battles_total int not null default 0,
  total_votes_received int not null default 0,
  elo           int not null default 1200,
  updated_at    timestamptz not null default now()
);

alter table public.battles       enable row level security;
alter table public.battle_votes  enable row level security;
alter table public.battle_stats  enable row level security;

drop policy if exists battles_select_public on public.battles;
create policy battles_select_public on public.battles for select using (true);

drop policy if exists battle_votes_select_public on public.battle_votes;
create policy battle_votes_select_public on public.battle_votes for select using (true);

drop policy if exists battle_stats_select_public on public.battle_stats;
create policy battle_stats_select_public on public.battle_stats for select using (true);

-- All writes go through backend service role, not from client.
