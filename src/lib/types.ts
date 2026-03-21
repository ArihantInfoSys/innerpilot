export type EmotionName =
  | "anxiety"
  | "confidence"
  | "focus"
  | "frustration"
  | "motivation"
  | "energy"
  | "fear"
  | "excitement";

export type EmotionPolarity = "positive" | "negative";

export interface EmotionConfig {
  name: EmotionName;
  label: string;
  polarity: EmotionPolarity;
  weight: number;
  color: string;
  icon: string;
}

export type DayClass = "peak" | "growth" | "neutral" | "risk" | "crisis";

export interface DayClassConfig {
  class: DayClass;
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  emoji: string;
}

export interface EmotionValues {
  anxiety: number;
  confidence: number;
  focus: number;
  frustration: number;
  motivation: number;
  energy: number;
  fear: number;
  excitement: number;
}

export interface CheckinData extends EmotionValues {
  note?: string;
}

export interface CheckinRecord extends EmotionValues {
  id: string;
  user_id: string;
  checkin_date: string;
  composite_score: number;
  day_class: DayClass;
  note: string | null;
  checked_in_at: string;
}

export interface CoachingResponse {
  summary: string;
  actions: string[];
  focusAreas: string[];
  encouragement: string;
  pattern: string | null;
  dayClass: DayClass;
  compositeScore: number;
}

export interface CoachingRecord {
  id: string;
  checkin_id: string;
  user_id: string;
  day_class: DayClass;
  advice_text: string;
  focus_areas: string[];
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  tier: "free" | "pro";
  streak_count: number;
  last_checkin_date: string | null;
  created_at: string;
}

export interface EngagementRule {
  id: string;
  title: string;
  body: string;
  cta: string;
  ctaLink: string;
  priority: number;
  cooldownHours: number;
  condition: (ctx: EngagementContext) => boolean;
}

export interface EngagementContext {
  hasCheckedInToday: boolean;
  streakCount: number;
  isFirstCheckin: boolean;
  todayDayClass: DayClass | null;
  recentCheckins: CheckinRecord[];
  tier: "free" | "pro";
  totalCheckins: number;
}

// Decision Gate
export interface DecisionGate {
  id: string;
  user_id: string;
  question: string;
  context: string;
  emotional_score: number | null;
  recommendation: string;
  signal: 'green' | 'caution' | 'stop';
  acted_on: boolean | null;
  outcome_note: string | null;
  created_at: string;
}

// Trigger Entry
export interface TriggerEntry {
  id: string;
  user_id: string;
  checkin_id: string | null;
  trigger_label: string;
  category: 'work' | 'relationship' | 'health' | 'finance' | 'sleep' | 'social' | 'other';
  intensity: number;
  note: string | null;
  created_at: string;
}

// Evening Debrief
export interface EveningDebrief {
  id: string;
  user_id: string;
  checkin_id: string | null;
  debrief_date: string;
  decisions_made: string | null;
  outcomes: string | null;
  lesson_learned: string | null;
  tomorrow_intention: string | null;
  overall_rating: number | null;
  created_at: string;
}

// Coach Chat Message
export interface CoachMessage {
  id: string;
  user_id: string;
  role: 'user' | 'coach';
  content: string;
  session_date: string;
  created_at: string;
}

// Weekly Report
export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  avg_score: number | null;
  best_day: string | null;
  best_score: number | null;
  worst_day: string | null;
  worst_score: number | null;
  top_trigger: string | null;
  total_checkins: number;
  streak_at_end: number;
  insights: Record<string, unknown> | null;
  created_at: string;
}

// Extended Profile
export interface ProfileExtended extends Profile {
  custom_emotions: string[];
  preferred_role: 'trader' | 'founder' | 'professional' | 'student' | 'other';
  morning_reminder: boolean;
  evening_reminder: boolean;
  onboarding_complete: boolean;
}

// Decision Signal
export type DecisionSignal = 'green' | 'caution' | 'stop';

// Readiness Forecast
export interface ReadinessForecast {
  score: number;
  dayClass: DayClass;
  forecast: string;
  bestFor: string[];
  avoidToday: string[];
}
