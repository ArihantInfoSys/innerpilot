-- InnerPilot Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checkins table
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  anxiety SMALLINT NOT NULL CHECK (anxiety BETWEEN 1 AND 10),
  confidence SMALLINT NOT NULL CHECK (confidence BETWEEN 1 AND 10),
  focus SMALLINT NOT NULL CHECK (focus BETWEEN 1 AND 10),
  frustration SMALLINT NOT NULL CHECK (frustration BETWEEN 1 AND 10),
  motivation SMALLINT NOT NULL CHECK (motivation BETWEEN 1 AND 10),
  energy SMALLINT NOT NULL CHECK (energy BETWEEN 1 AND 10),
  fear SMALLINT NOT NULL CHECK (fear BETWEEN 1 AND 10),
  excitement SMALLINT NOT NULL CHECK (excitement BETWEEN 1 AND 10),
  composite_score NUMERIC(4,1) NOT NULL,
  day_class TEXT NOT NULL CHECK (day_class IN ('peak', 'growth', 'neutral', 'risk', 'crisis')),
  note TEXT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Coaching responses table
CREATE TABLE IF NOT EXISTS coaching_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_class TEXT NOT NULL,
  advice_text TEXT NOT NULL,
  focus_areas TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_checkin ON coaching_responses(checkin_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_responses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Checkins policies
CREATE POLICY "Users can view own checkins" ON checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coaching policies
CREATE POLICY "Users can view own coaching" ON coaching_responses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coaching" ON coaching_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
