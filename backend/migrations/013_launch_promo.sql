-- Launch promotion: 50% off first month with code LAUNCH50
-- Track which users used which promo codes

CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY,
  description TEXT,
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_uses INT,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL REFERENCES promo_codes(code),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(code, user_id)
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check active promo codes" ON promo_codes
  FOR SELECT USING (active = true);

CREATE POLICY "Users see their own redemptions" ON promo_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Seed launch promo
INSERT INTO promo_codes (code, description, discount_percent, max_uses, expires_at) VALUES
  ('LAUNCH50', '初月50%OFF - ローンチ記念', 50, 100, NOW() + INTERVAL '60 days'),
  ('WELCOME20', '初月20%OFF', 20, NULL, NULL)
ON CONFLICT (code) DO NOTHING;
