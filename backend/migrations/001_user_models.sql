-- Migration: Add user_models table for CivitAI custom models
-- Run this in Supabase SQL Editor if the table doesn't exist yet

CREATE TABLE IF NOT EXISTS public.user_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    civitai_model_id INTEGER NOT NULL,
    civitai_version_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    base_model TEXT DEFAULT '',
    preview_url TEXT,
    model_type TEXT NOT NULL DEFAULT 'LORA',
    safetensors_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, civitai_model_id)
);

CREATE INDEX IF NOT EXISTS idx_user_models_user_id ON public.user_models(user_id);

ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS user_models_select_own ON public.user_models;
DROP POLICY IF EXISTS user_models_insert_own ON public.user_models;
DROP POLICY IF EXISTS user_models_delete_own ON public.user_models;

CREATE POLICY user_models_select_own ON public.user_models FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_models_insert_own ON public.user_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_models_delete_own ON public.user_models FOR DELETE USING (auth.uid() = user_id);
