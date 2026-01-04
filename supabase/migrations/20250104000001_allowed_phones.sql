-- Allowed phones whitelist (replaces invite codes for now)
CREATE TABLE allowed_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE allowed_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed phones viewable by anyone for signup check"
  ON allowed_phones FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert Lucas as admin
INSERT INTO allowed_phones (phone, name, is_admin) VALUES
  ('+5521991686899', 'Lucas Sarmento', true);
