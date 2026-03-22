import { EmotionValues, DayClass, CoachingResponse } from "./types";
import { calculateCompositeScore, classifyDay } from "./scoring";

/* ─── Trigger Context for Coaching ─── */
export interface TriggerContext {
  topCategory: string | null;
  topCategoryCount: number;
  avgIntensity: number;
  totalTriggers: number;
  highIntensityCount: number; // triggers with intensity >= 8
  recentLabels: string[]; // last 3 trigger labels
}

type Pattern = {
  name: string;
  label: string;
  condition: (v: EmotionValues) => boolean;
  action: string;
};

const PATTERNS: Pattern[] = [
  {
    name: "imposter",
    label: "Imposter Pattern",
    condition: (v) => v.anxiety >= 7 && v.confidence <= 3,
    action: "Write down 3 concrete wins from the last 7 days. Evidence defeats doubt.",
  },
  {
    name: "burnout",
    label: "Burnout Pattern",
    condition: (v) => v.frustration >= 7 && v.motivation <= 3,
    action: "Identify the single task draining you most and delegate or defer it.",
  },
  {
    name: "freeze",
    label: "Freeze Pattern",
    condition: (v) => v.fear >= 7 && v.energy <= 3,
    action: "Set a 10-minute timer and do the smallest possible next step on your top task.",
  },
  {
    name: "adrenaline",
    label: "Adrenaline Pattern",
    condition: (v) => v.anxiety >= 7 && v.excitement >= 7,
    action: "Your energy is high but scattered. Pick ONE priority and give it 90 minutes of focused time.",
  },
  {
    name: "depletion",
    label: "Depletion Pattern",
    condition: (v) => v.focus <= 3 && v.energy <= 3,
    action: "Physical energy is the foundation. Prioritize sleep, hydration, and a 20-minute walk.",
  },
];

const TEMPLATES: Record<DayClass, { summary: string; actions: string[]; encouragement: string }> = {
  peak: {
    summary: "You are operating at high capacity today. This is the state to leverage for your most important decisions.",
    actions: [
      "Prioritize your highest-stakes work right now",
      "Document what led to this state — make it repeatable",
      "Set an ambitious micro-goal for the next 2 hours",
    ],
    encouragement: "Channel this momentum — days like this compound.",
  },
  growth: {
    summary: "You are in a solid growth zone. Small adjustments can push you toward peak performance.",
    actions: [
      "Address your weakest positive emotion with one specific action",
      "Take one calculated risk you've been postponing",
      "Review your top priority with fresh eyes",
    ],
    encouragement: "Consistency in this zone builds lasting resilience.",
  },
  neutral: {
    summary: "You are in a steady state. This is a good day for maintenance tasks and reflection.",
    actions: [
      "Do a 5-minute breathing exercise to center yourself",
      "Tackle one small win to build momentum",
      "Review your weekly goals and adjust if needed",
    ],
    encouragement: "Neutral days are underrated — they are where discipline is built.",
  },
  risk: {
    summary: "Your emotional state suggests today is not ideal for high-stakes decisions.",
    actions: [
      "Pause before any irreversible decisions",
      "Reach out to one trusted person today",
      "Focus on low-risk, high-completion tasks",
    ],
    encouragement: "Recognizing a risk day IS the first step to managing it.",
  },
  crisis: {
    summary: "Your readings indicate significant emotional strain. Prioritize self-care today.",
    actions: [
      "Step away from screens for 15 minutes",
      "Write down three things within your control right now",
      "Postpone non-urgent deadlines if possible",
    ],
    encouragement: "This state is temporary. You have navigated difficult days before.",
  },
};

/* ─── Trigger-Aware Coaching Advice ─── */
const TRIGGER_COACHING: Record<string, { action: string; warning: string }> = {
  work: {
    action: "Your work triggers are recurring — set a micro-boundary today: one firm 'no' or one task delegated. Cortisol spikes from work stress take 4 hours to normalize.",
    warning: "Work-related stress is your dominant trigger. Avoid major career decisions until your emotional baseline stabilizes.",
  },
  relationship: {
    action: "Relationship triggers are active — before your next difficult conversation, write down what you need vs. what you're reacting to. Emotional clarity prevents regrettable words.",
    warning: "Interpersonal stress is heightened. Practice the 24-hour rule: no important relationship conversations while emotionally activated.",
  },
  health: {
    action: "Health anxiety is recurring — ground yourself: place both feet on the floor, breathe 4-7-8 (inhale 4s, hold 7s, exhale 8s). Your body needs a signal of safety.",
    warning: "Health-related worry loops are active. Limit health-related internet searches today — they amplify anxiety, not resolve it.",
  },
  finance: {
    action: "Financial triggers are elevated — write down exactly one financial action you CAN control today. Certainty in small actions calms the threat-detection brain.",
    warning: "Financial stress impairs rational thinking. Avoid impulsive spending or investment decisions during this period.",
  },
  sleep: {
    action: "Sleep disruption is feeding your emotional instability — tonight, try the military sleep technique: relax face, drop shoulders, breathe out, clear mind for 10 seconds.",
    warning: "Poor sleep amplifies every other trigger by 60%. Make tonight's sleep your #1 priority over everything else.",
  },
  social: {
    action: "Social triggers suggest your boundaries need attention — practice saying 'I need to think about that' before committing to anything today.",
    warning: "Social stress is draining your reserves. It's okay to decline one social obligation today — rest is not selfish.",
  },
  other: {
    action: "Unnamed triggers are surfacing — spend 5 minutes journaling: 'What am I actually feeling right now?' Specificity transforms vague dread into manageable emotions.",
    warning: "Unclassified stress often hides deeper patterns. Consider naming your triggers more specifically to unlock better self-awareness.",
  },
};

function detectPatterns(values: EmotionValues): Pattern[] {
  return PATTERNS.filter((p) => p.condition(values));
}

function identifyFocusAreas(values: EmotionValues): string[] {
  const areas: string[] = [];
  const negatives = ["anxiety", "frustration", "fear"] as const;
  const positives = ["confidence", "focus", "motivation", "energy", "excitement"] as const;

  for (const name of negatives) {
    if (values[name] >= 7) areas.push(`High ${name}`);
  }
  for (const name of positives) {
    if (values[name] <= 3) areas.push(`Low ${name}`);
  }
  return areas;
}

export function generateCoaching(
  values: EmotionValues,
  triggerCtx?: TriggerContext
): CoachingResponse {
  const compositeScore = calculateCompositeScore(values);
  const dayClass = classifyDay(compositeScore);
  const template = TEMPLATES[dayClass];
  const patterns = detectPatterns(values);
  const focusAreas = identifyFocusAreas(values);

  const actions = [...template.actions];

  // Pattern-based action override
  if (patterns.length > 0) {
    actions[0] = patterns[0].action;
  }

  // ─── Trigger-Aware Enhancements ───
  let summary = template.summary;

  if (triggerCtx && triggerCtx.totalTriggers > 0) {
    const cat = triggerCtx.topCategory || "other";
    const triggerAdvice = TRIGGER_COACHING[cat] || TRIGGER_COACHING.other;

    // Inject trigger-specific action
    if (triggerCtx.highIntensityCount >= 2) {
      // Replace the last action with urgent trigger advice
      actions[actions.length - 1] = triggerAdvice.action;
      // Add trigger focus area
      focusAreas.push(`Recurring ${cat} triggers (${triggerCtx.topCategoryCount}x this week)`);
    } else if (triggerCtx.totalTriggers >= 3) {
      // Add as extra guidance
      actions.push(triggerAdvice.action);
      focusAreas.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)} triggers active`);
    }

    // Modify summary to include trigger awareness
    if (triggerCtx.avgIntensity >= 7) {
      summary += ` Caution: ${triggerAdvice.warning}`;
    } else if (triggerCtx.totalTriggers >= 2) {
      const labels = triggerCtx.recentLabels.slice(0, 2).join(", ");
      summary += ` Your recent triggers (${labels}) suggest staying mindful of ${cat}-related stressors today.`;
    }
  }

  return {
    summary,
    actions,
    focusAreas,
    encouragement: template.encouragement,
    pattern: patterns.length > 0 ? patterns[0].label : null,
    dayClass,
    compositeScore,
  };
}
