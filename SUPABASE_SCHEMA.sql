-- EGAKU AI - Supabase Database Schema
-- Run this in Supabase SQL Editor to create the required tables

-- ============================================================
-- Users table (extends auth.users with app-specific fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  display_name TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  age_verified BOOLEAN DEFAULT FALSE,
  region_code TEXT DEFAULT 'US',
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- ============================================================
-- Credits
-- ============================================================
CREATE TABLE IF NOT EXISTS credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INT DEFAULT 50,
  lifetime_used INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'generation',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);

-- ============================================================
-- Generations (user's private generation history)
-- ============================================================
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'txt2img',
  prompt TEXT NOT NULL DEFAULT '',
  negative_prompt TEXT DEFAULT '',
  model TEXT DEFAULT '',
  params_json JSONB DEFAULT '{}',
  status TEXT DEFAULT 'queued',
  image_url TEXT,
  video_url TEXT,
  credits_used INT DEFAULT 1,
  nsfw BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);

-- ============================================================
-- Gallery (public showcase with likes, tags, remix)
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  negative_prompt TEXT DEFAULT '',
  model TEXT DEFAULT '',
  steps INT DEFAULT 0,
  cfg DOUBLE PRECISION DEFAULT 0.0,
  seed BIGINT DEFAULT -1,
  width INT DEFAULT 0,
  height INT DEFAULT 0,
  image_url TEXT,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  nsfw BOOLEAN DEFAULT FALSE,
  public BOOLEAN DEFAULT TRUE,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_likes ON gallery(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_user ON gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_nsfw ON gallery(nsfw);
CREATE INDEX IF NOT EXISTS idx_gallery_public ON gallery(public);
CREATE INDEX IF NOT EXISTS idx_gallery_tags ON gallery USING GIN(tags);

-- ============================================================
-- Gallery Likes
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_id UUID NOT NULL REFERENCES gallery(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gallery_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_gallery ON gallery_likes(gallery_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON gallery_likes(user_id);

-- ============================================================
-- User Follows
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ============================================================
-- Enable RLS (Row Level Security)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: Users
-- ============================================================
CREATE POLICY "Users public read" ON users
  FOR SELECT USING (TRUE);

CREATE POLICY "Users own update" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- RLS Policies: Credits
-- ============================================================
CREATE POLICY "Credits own read" ON credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Credit transactions own read" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: Generations
-- ============================================================
CREATE POLICY "Generations own read" ON generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Generations own insert" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Generations own delete" ON generations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: Gallery
-- ============================================================
CREATE POLICY "Gallery public read" ON gallery
  FOR SELECT USING (public = TRUE);

CREATE POLICY "Gallery own read" ON gallery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gallery owner insert" ON gallery
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gallery owner update" ON gallery
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gallery owner delete" ON gallery
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: Likes
-- ============================================================
CREATE POLICY "Likes read all" ON gallery_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "Likes own insert" ON gallery_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Likes own delete" ON gallery_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: Follows
-- ============================================================
CREATE POLICY "Follows read all" ON follows
  FOR SELECT USING (TRUE);

CREATE POLICY "Follows own insert" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Follows own delete" ON follows
  FOR DELETE USING (auth.uid() = follower_id);
