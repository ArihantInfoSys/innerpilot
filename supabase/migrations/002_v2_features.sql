-- Decision Gate logs
CREATE TABLE IF NOT EXISTS decision_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  context TEXT DEFAULT 'general',
  emotional_score NUMERIC(4,1),
  recommendation TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('green','caution','stop')),
  acted_on BOOLEAN DEFAULT NULL,
  outcome_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE decision_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own decision_gates" ON decision_gates FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_decision_gates_user ON decision_gates(user_id, created_at DESC);

-- Trigger journal
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
ALTER TABLE trigger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own trigger_entries" ON trigger_entries FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_triggers_user ON trigger_entries(user_id, created_at DESC);

-- Evening debrief
CREATE TABLE IF NOT EXISTS evening_debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
  debrief_date DATE DEFAULT CURRENT_DATE,
  decisions_made TEXT,
  outcomes TEXT,
  lesson_learned TEXT,
  tomorrow_intention TEXT,
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, debrief_date)
);
ALTER TABLE evening_debriefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own evening_debriefs" ON evening_debriefs FOR ALL USING (auth.uid() = user_id);

-- AI chat messages
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','coach')),
  content TEXT NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own coach_messages" ON coach_messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_coach_messages_user ON coach_messages(user_id, session_date, created_at);

-- Weekly reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  avg_score NUMERIC(4,1),
  best_day DATE,
  best_score NUMERIC(4,1),
  worst_day DATE,
  worst_score NUMERIC(4,1),
  top_trigger TEXT,
  total_checkins INTEGER,
  streak_at_end INTEGER,
  insights JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own weekly_reports" ON weekly_reports FOR ALL USING (auth.uid() = user_id);

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_emotions TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_role TEXT DEFAULT 'professional' CHECK (preferred_role IN ('trader','founder','professional','student','other'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS morning_reminder BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS evening_reminder BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Add morning_score to checkins for morning readiness
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_morning BOOLEAN DEFAULT false;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS readiness_forecast TEXT;
