-- Content reports: users can flag gallery items for policy violations
-- (deepfake, CSAM, copyright, non-consensual imagery, etc.)

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, reviewed, actioned, dismissed
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can submit reports" ON content_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users see own reports" ON content_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Service role (admin) can do everything
CREATE POLICY "Service role full access" ON content_reports
  FOR ALL TO service_role
  USING (true);

-- Index for admin review
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_gallery ON content_reports(gallery_id);
