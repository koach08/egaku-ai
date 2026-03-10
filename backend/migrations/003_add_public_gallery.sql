-- Add public gallery fields to generations table
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Index for explore page queries
CREATE INDEX IF NOT EXISTS idx_generations_public ON public.generations(is_public, created_at DESC)
  WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_generations_public_likes ON public.generations(is_public, likes DESC)
  WHERE is_public = TRUE;

-- Allow anyone to read public generations (for explore page)
CREATE POLICY generations_select_public ON public.generations
  FOR SELECT USING (is_public = TRUE);
