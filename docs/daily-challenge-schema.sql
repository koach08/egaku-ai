-- Daily Challenge tables for Supabase
-- Run this in Supabase SQL Editor

-- Submissions table
CREATE TABLE IF NOT EXISTS daily_challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  challenge_date DATE NOT NULL,
  theme TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Votes table
CREATE TABLE IF NOT EXISTS daily_challenge_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  submission_id UUID NOT NULL REFERENCES daily_challenge_submissions(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(voter_id, submission_id)
);

-- RPC function to increment votes atomically
CREATE OR REPLACE FUNCTION increment_daily_challenge_votes(sub_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE daily_challenge_submissions
  SET votes = votes + 1
  WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_submissions_date ON daily_challenge_submissions(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_votes_voter ON daily_challenge_votes(voter_id);

-- RLS policies
ALTER TABLE daily_challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read submissions
CREATE POLICY "Anyone can view submissions"
  ON daily_challenge_submissions FOR SELECT
  USING (true);

-- Authenticated users can insert their own
CREATE POLICY "Users can submit"
  ON daily_challenge_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read votes
CREATE POLICY "Anyone can view votes"
  ON daily_challenge_votes FOR SELECT
  USING (true);

-- Authenticated users can insert votes
CREATE POLICY "Users can vote"
  ON daily_challenge_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);
