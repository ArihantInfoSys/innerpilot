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
