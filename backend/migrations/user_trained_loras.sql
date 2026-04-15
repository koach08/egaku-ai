-- User-trained LoRA models.
-- Each row represents one LoRA training job: submitted → training → completed/failed.
-- Run this once in the Supabase SQL editor before enabling LoRA training.

create table if not exists public.user_trained_loras (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  trigger_word    text not null,
  status          text not null default 'training', -- training | completed | failed
  progress        int  not null default 0,          -- 0-100
  images_zip_url  text,                             -- Supabase Storage URL of the training zip
  image_count     int,
  steps           int not null default 1000,
  is_style        boolean not null default false,
  nsfw            boolean not null default false,
  fal_request_id  text,                             -- fal.ai queue job id for polling
  lora_url        text,                             -- final diffusers LoRA URL (safetensors/json)
  config_url      text,                             -- accompanying config JSON
  error_message   text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists user_trained_loras_user_idx    on public.user_trained_loras (user_id, created_at desc);
create index if not exists user_trained_loras_status_idx  on public.user_trained_loras (status);
create index if not exists user_trained_loras_request_idx on public.user_trained_loras (fal_request_id);

alter table public.user_trained_loras enable row level security;

drop policy if exists "trained_loras_insert_own" on public.user_trained_loras;
create policy "trained_loras_insert_own"
  on public.user_trained_loras
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "trained_loras_select_own" on public.user_trained_loras;
create policy "trained_loras_select_own"
  on public.user_trained_loras
  for select
  using (auth.uid() = user_id);

drop policy if exists "trained_loras_update_own" on public.user_trained_loras;
create policy "trained_loras_update_own"
  on public.user_trained_loras
  for update
  using (auth.uid() = user_id);

drop policy if exists "trained_loras_delete_own" on public.user_trained_loras;
create policy "trained_loras_delete_own"
  on public.user_trained_loras
  for delete
  using (auth.uid() = user_id);

-- Plan limits: how many LoRA models each plan can train (one-time, not monthly)
-- Enforced server-side — this is just documentation here:
--   free:       0
--   lite:       1
--   basic:      3
--   pro:        10
--   unlimited:  25
--   studio:     100
