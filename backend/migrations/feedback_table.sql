-- User feedback collection table.
-- Run this once in the Supabase SQL editor before hitting /api/feedback.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  feature     text not null,                -- e.g. "photo_booth", "vid2vid", "home"
  category    text not null default 'general', -- bug | feature_request | praise | general
  message     text not null,
  rating      int check (rating between 1 and 5),
  page_url    text,
  user_agent  text,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_feature_idx    on public.feedback (feature);
create index if not exists feedback_user_idx       on public.feedback (user_id);
create index if not exists feedback_resolved_idx   on public.feedback (resolved);

-- RLS: anyone can insert (including anonymous); only admins read (backend uses
-- service-role key so RLS is bypassed server-side — this policy is for safety
-- in case the anon key is ever used directly from a client).
alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_anyone" on public.feedback;
create policy "feedback_insert_anyone"
  on public.feedback
  for insert
  with check (true);

drop policy if exists "feedback_select_admin" on public.feedback;
create policy "feedback_select_admin"
  on public.feedback
  for select
  using (
    auth.jwt() ->> 'email' in ('kshgks59@gmail.com', 'japanesebusinessman4@gmail.com')
  );
