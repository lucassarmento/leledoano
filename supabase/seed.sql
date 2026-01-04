-- Seed file for initial data
-- This runs automatically after migrations during `supabase db reset`

-- Create initial invite codes for testing
INSERT INTO invite_codes (code) VALUES
  ('ADMIN1'),
  ('LELE24'),
  ('TESTE1');
