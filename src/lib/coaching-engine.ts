import { EmotionValues, DayClass, CoachingResponse } from "./types";
import { calculateCompositeScore, classifyDay } from "./scoring";

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

export function generateCoaching(values: EmotionValues): CoachingResponse {
  const compositeScore = calculateCompositeScore(values);
  const dayClass = classifyDay(compositeScore);
  const template = TEMPLATES[dayClass];
  const patterns = detectPatterns(values);
  const focusAreas = identifyFocusAreas(values);

  const actions = [...template.actions];
  if (patterns.length > 0) {
    actions[0] = patterns[0].action;
  }

  return {
    summary: template.summary,
    actions,
    focusAreas,
    encouragement: template.encouragement,
    pattern: patterns.length > 0 ? patterns[0].label : null,
    dayClass,
    compositeScore,
  };
}
