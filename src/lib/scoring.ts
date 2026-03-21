import { EmotionValues, DayClass } from "./types";
import { EMOTIONS, DAY_CLASSES } from "./constants";

export function calculateCompositeScore(values: EmotionValues): number {
  let score = 0;

  for (const emotion of EMOTIONS) {
    const raw = values[emotion.name];
    const normalized =
      emotion.polarity === "positive"
        ? (raw - 1) / 9
        : (10 - raw) / 9;
    score += normalized * emotion.weight;
  }

  return Math.round(score * 1000) / 10; // 0-100 with one decimal
}

export function classifyDay(score: number): DayClass {
  for (const dc of DAY_CLASSES) {
    if (score >= dc.minScore && score <= dc.maxScore) {
      return dc.class;
    }
  }
  return "neutral";
}

export function getDayClassConfig(dayClass: DayClass) {
  return DAY_CLASSES.find((dc) => dc.class === dayClass) ?? DAY_CLASSES[2];
}
