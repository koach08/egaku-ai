-- Site-wide announcements / status updates
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'update', 'warning', 'error', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  link_label TEXT,
  active BOOLEAN DEFAULT true,
  show_on TEXT[] DEFAULT ARRAY['home', 'gallery']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active, created_at DESC);

-- RLS: anyone can read active announcements, only admins can write
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active announcements" ON announcements
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Insert initial announcement
INSERT INTO announcements (type, title, message, show_on) VALUES
  ('update', '新機能リリース', 'Photo Booth、Meme Generator、Logo Maker、Video Shorts、Prompt Battleなど新機能を追加しました！', ARRAY['home', 'gallery']);
