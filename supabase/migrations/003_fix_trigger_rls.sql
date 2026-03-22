-- Fix trigger_entries: ensure table exists and RLS allows inserts

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS trigger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
  trigger_label TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('work','relationship','health','finance','sleep','social','other')),
  intensity SMALLINT DEFAULT 5 CHECK (intensity BETWEEN 1 AND 10),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE trigger_entries ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists, recreate with explicit WITH CHECK for INSERT
DROP POLICY IF EXISTS "Users own trigger_entries" ON trigger_entries;

-- SELECT, UPDATE, DELETE: user can only access own rows
CREATE POLICY "Users can read own triggers"
  ON trigger_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own triggers"
  ON trigger_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own triggers"
  ON trigger_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own triggers"
  ON trigger_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_triggers_user ON trigger_entries(user_id, created_at DESC);

-- Also fix decision_gates with same pattern
DROP POLICY IF EXISTS "Users own decision_gates" ON decision_gates;

CREATE POLICY "Users can read own decisions"
  ON decision_gates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decisions"
  ON decision_gates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON decision_gates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON decision_gates FOR DELETE
  USING (auth.uid() = user_id);
