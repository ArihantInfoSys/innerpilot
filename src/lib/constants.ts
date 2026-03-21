import { EmotionConfig, DayClassConfig, EmotionName } from "./types";

export const EMOTIONS: EmotionConfig[] = [
  { name: "confidence", label: "Confidence", polarity: "positive", weight: 0.18, color: "#34d399", icon: "Shield" },
  { name: "focus", label: "Focus", polarity: "positive", weight: 0.16, color: "#22d3ee", icon: "Target" },
  { name: "motivation", label: "Motivation", polarity: "positive", weight: 0.14, color: "#fbbf24", icon: "Flame" },
  { name: "energy", label: "Energy", polarity: "positive", weight: 0.12, color: "#fb923c", icon: "Zap" },
  { name: "excitement", label: "Excitement", polarity: "positive", weight: 0.08, color: "#f472b6", icon: "Sparkles" },
  { name: "anxiety", label: "Anxiety", polarity: "negative", weight: 0.12, color: "#f87171", icon: "AlertTriangle" },
  { name: "frustration", label: "Frustration", polarity: "negative", weight: 0.10, color: "#fb7185", icon: "Frown" },
  { name: "fear", label: "Fear", polarity: "negative", weight: 0.10, color: "#a78bfa", icon: "Ghost" },
];

export const DAY_CLASSES: DayClassConfig[] = [
  { class: "peak", label: "Peak Performance", color: "#22c55e", minScore: 80, maxScore: 100, emoji: "🔥" },
  { class: "growth", label: "Growth Zone", color: "#84cc16", minScore: 65, maxScore: 79, emoji: "📈" },
  { class: "neutral", label: "Steady State", color: "#eab308", minScore: 45, maxScore: 64, emoji: "⚖️" },
  { class: "risk", label: "Risk Zone", color: "#f97316", minScore: 25, maxScore: 44, emoji: "⚠️" },
  { class: "crisis", label: "Crisis Mode", color: "#ef4444", minScore: 0, maxScore: 24, emoji: "🛑" },
];

export const EMOTION_MAP: Record<EmotionName, EmotionConfig> = Object.fromEntries(
  EMOTIONS.map((e) => [e.name, e])
) as Record<EmotionName, EmotionConfig>;

export const DEFAULT_EMOTION_VALUES = Object.fromEntries(
  EMOTIONS.map((e) => [e.name, 5])
) as Record<EmotionName, number>;
