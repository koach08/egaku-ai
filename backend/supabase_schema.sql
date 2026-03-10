-- AI Studio - Supabase Schema
-- Run this in the Supabase SQL Editor after creating the project

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    age_verified BOOLEAN DEFAULT FALSE,
    region_code TEXT DEFAULT 'US',
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'lite', 'basic', 'pro', 'unlimited', 'studio')),
    stripe_customer_id TEXT,
    local_license BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits
CREATE TABLE IF NOT EXISTS public.credits (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 50,
    lifetime_used INTEGER DEFAULT 0
);

-- Credit transactions log
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generations (image/video records)
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    negative_prompt TEXT DEFAULT '',
    model TEXT DEFAULT '',
    params_json JSONB DEFAULT '{}',
    nsfw_flag BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    video_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (content moderation)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.users(id),
    generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id);

-- Credits: can read own
CREATE POLICY credits_select_own ON public.credits FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions: can read own
CREATE POLICY credit_tx_select_own ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Generations: can read/delete own, anyone can read public
CREATE POLICY generations_select_own ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY generations_select_public ON public.generations FOR SELECT USING (is_public = TRUE);
CREATE POLICY generations_delete_own ON public.generations FOR DELETE USING (auth.uid() = user_id);

-- Reports: can create own
CREATE POLICY reports_insert_own ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- User custom models (CivitAI models registered per user)
CREATE TABLE IF NOT EXISTS public.user_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    civitai_model_id INTEGER NOT NULL,
    civitai_version_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    base_model TEXT DEFAULT '',
    preview_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, civitai_model_id)
);

CREATE INDEX IF NOT EXISTS idx_user_models_user_id ON public.user_models(user_id);

ALTER TABLE public.user_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_models_select_own ON public.user_models FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_models_insert_own ON public.user_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_models_delete_own ON public.user_models FOR DELETE USING (auth.uid() = user_id);

-- Gallery (community showcase of generations)
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    negative_prompt TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    steps INTEGER NOT NULL DEFAULT 0,
    cfg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    seed BIGINT NOT NULL DEFAULT -1,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    nsfw BOOLEAN NOT NULL DEFAULT FALSE,
    public BOOLEAN NOT NULL DEFAULT TRUE,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON public.gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_public ON public.gallery(public, nsfw);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_count ON public.gallery(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON public.gallery USING GIN(tags);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_select_public" ON public.gallery FOR SELECT USING (public = true);
CREATE POLICY "gallery_select_own" ON public.gallery FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gallery_insert_own" ON public.gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gallery_update_own" ON public.gallery FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gallery_delete_own" ON public.gallery FOR DELETE USING (auth.uid() = user_id);

-- Gallery Likes
CREATE TABLE IF NOT EXISTS public.gallery_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gallery_id UUID NOT NULL REFERENCES public.gallery(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, gallery_id)
);

ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY gallery_likes_select ON public.gallery_likes FOR SELECT USING (true);
CREATE POLICY gallery_likes_insert ON public.gallery_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY gallery_likes_delete ON public.gallery_likes FOR DELETE USING (auth.uid() = user_id);

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_select ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_insert ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Service role can do everything (backend uses service_role_key)
-- No additional policies needed for service role - it bypasses RLS
