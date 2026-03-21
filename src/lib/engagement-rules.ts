import { EngagementRule } from "./types";

export const ENGAGEMENT_RULES: EngagementRule[] = [
  {
    id: "first_checkin",
    title: "Welcome to InnerPilot",
    body: "Your journey to emotional mastery starts now. Track daily, grow consistently.",
    cta: "Let's Go",
    ctaLink: "/checkin",
    priority: 1,
    cooldownHours: 8760, // basically once ever
    condition: (ctx) => ctx.isFirstCheckin,
  },
  {
    id: "no_checkin_today",
    title: "Check In Today",
    body: "A 60-second check-in can shift your entire day. Don't skip it.",
    cta: "Check In Now",
    ctaLink: "/checkin",
    priority: 2,
    cooldownHours: 12,
    condition: (ctx) => !ctx.hasCheckedInToday && ctx.totalCheckins > 0,
  },
  {
    id: "peak_celebration",
    title: "Peak Performance Day!",
    body: "You're operating at your best. What made today different? Noting it helps you repeat it.",
    cta: "View Dashboard",
    ctaLink: "/dashboard",
    priority: 3,
    cooldownHours: 20,
    condition: (ctx) => ctx.todayDayClass === "peak",
  },
  {
    id: "streak_3",
    title: "3-Day Streak!",
    body: "Three days of tracking — consistency is building. Keep the chain going.",
    cta: "Continue",
    ctaLink: "/dashboard",
    priority: 4,
    cooldownHours: 168,
    condition: (ctx) => ctx.streakCount === 3,
  },
  {
    id: "streak_7",
    title: "7-Day Streak!",
    body: "One full week of emotional tracking. You're building a powerful habit.",
    cta: "View Trends",
    ctaLink: "/history",
    priority: 4,
    cooldownHours: 168,
    condition: (ctx) => ctx.streakCount === 7,
  },
  {
    id: "streak_14",
    title: "14-Day Streak!",
    body: "Two weeks strong. Consistency is your superpower.",
    cta: "View Trends",
    ctaLink: "/history",
    priority: 4,
    cooldownHours: 168,
    condition: (ctx) => ctx.streakCount === 14,
  },
  {
    id: "streak_30",
    title: "30-Day Streak!",
    body: "One month of emotional mastery. You're in the top 1% of self-awareness.",
    cta: "View Trends",
    ctaLink: "/history",
    priority: 4,
    cooldownHours: 720,
    condition: (ctx) => ctx.streakCount === 30,
  },
  {
    id: "high_anxiety_2days",
    title: "Elevated Anxiety Detected",
    body: "Anxiety has been high for 2 days. Consider: is there a specific trigger you can address today?",
    cta: "Check In",
    ctaLink: "/checkin",
    priority: 5,
    cooldownHours: 48,
    condition: (ctx) => {
      if (ctx.recentCheckins.length < 2) return false;
      const last2 = ctx.recentCheckins.slice(0, 2);
      return last2.every((c) => c.anxiety >= 7);
    },
  },
  {
    id: "declining_trend",
    title: "Trend Alert",
    body: "Your score has been dipping over the last 3 days. This is normal — but today is a good day to recalibrate.",
    cta: "View Trends",
    ctaLink: "/history",
    priority: 6,
    cooldownHours: 72,
    condition: (ctx) => {
      if (ctx.recentCheckins.length < 3) return false;
      const scores = ctx.recentCheckins.slice(0, 3).map((c) => c.composite_score);
      return scores[0] - scores[2] >= 15;
    },
  },
  {
    id: "pro_upsell",
    title: "Unlock Full Insights",
    body: "You've built a strong tracking habit. Unlock unlimited history and advanced insights with InnerPilot Pro.",
    cta: "Learn More",
    ctaLink: "/settings",
    priority: 10,
    cooldownHours: 168,
    condition: (ctx) => ctx.tier === "free" && ctx.totalCheckins >= 7,
  },
];

export function getActiveEngagement(rules: EngagementRule[], context: any): EngagementRule | null {
  const now = Date.now();

  const eligible = rules
    .filter((rule) => {
      const lastShown = getLastShown(rule.id);
      if (lastShown && now - lastShown < rule.cooldownHours * 3600000) return false;
      return rule.condition(context);
    })
    .sort((a, b) => a.priority - b.priority);

  return eligible[0] ?? null;
}

function getLastShown(ruleId: string): number | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(`engagement_${ruleId}`);
  return val ? parseInt(val, 10) : null;
}

export function markShown(ruleId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`engagement_${ruleId}`, Date.now().toString());
}
