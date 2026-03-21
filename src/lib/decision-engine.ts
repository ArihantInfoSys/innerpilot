import { EmotionValues, DecisionSignal, ReadinessForecast, DayClass } from './types';
import { calculateCompositeScore, classifyDay } from './scoring';

export interface DecisionResult {
  signal: DecisionSignal;
  score: number;
  recommendation: string;
  reasoning: string[];
  bestActions: string[];
  avoidActions: string[];
}

export function evaluateDecision(
  question: string,
  context: string,
  emotions: EmotionValues
): DecisionResult {
  const score = calculateCompositeScore(emotions);
  const dayClass = classifyDay(score);

  // Check specific danger signals
  const highAnxiety = emotions.anxiety >= 7;
  const highFear = emotions.fear >= 7;
  const highFrustration = emotions.frustration >= 7;
  const lowFocus = emotions.focus <= 3;
  const lowConfidence = emotions.confidence <= 3;
  const highConfidence = emotions.confidence >= 8;
  const highEnergy = emotions.energy >= 7;
  const highExcitement = emotions.excitement >= 8;

  let signal: DecisionSignal;
  let recommendation: string;
  const reasoning: string[] = [];
  const bestActions: string[] = [];
  const avoidActions: string[] = [];

  // STOP signals
  if (score < 30) {
    signal = 'stop';
    recommendation = 'Stand down. Your emotional state is not suited for important decisions right now.';
    reasoning.push('Your overall performance score is critically low');
  } else if (highAnxiety && highFear) {
    signal = 'stop';
    recommendation = 'Not now. Fear and anxiety are clouding your judgment.';
    reasoning.push('Both anxiety and fear are elevated — fight-or-flight mode active');
  } else if (highFrustration && lowFocus) {
    signal = 'stop';
    recommendation = 'Pause. Frustration is fragmenting your focus.';
    reasoning.push('High frustration + low focus = reactive decisions');
  } else if (lowConfidence && highAnxiety) {
    signal = 'stop';
    recommendation = 'Wait. Self-doubt combined with anxiety leads to avoidance or impulsive choices.';
    reasoning.push('Low confidence + high anxiety = poor decision framework');
  }
  // CAUTION signals
  else if (score < 50) {
    signal = 'caution';
    recommendation = 'Proceed carefully. Your state is mixed — take smaller steps.';
    reasoning.push('Moderate score suggests some emotional interference');
  } else if (highExcitement && highConfidence && emotions.focus <= 5) {
    signal = 'caution';
    recommendation = 'Watch for overconfidence. High excitement may cloud risk assessment.';
    reasoning.push('Excitement + confidence without strong focus = potential blind spots');
  } else if (highAnxiety && emotions.confidence >= 5) {
    signal = 'caution';
    recommendation = 'You can proceed but acknowledge the anxiety. Set a stop-loss on the decision.';
    reasoning.push('Anxiety is elevated but confidence is holding — monitor closely');
  } else if (highFrustration) {
    signal = 'caution';
    recommendation = 'Frustration is present. Avoid reactive decisions — take 10 minutes first.';
    reasoning.push('Frustration can lead to "revenge" decisions');
  }
  // GREEN signals
  else {
    signal = 'green';
    recommendation = 'Green light. Your emotional state supports clear decision-making.';
    reasoning.push('Strong composite score with balanced emotions');
  }

  // Context-specific reasoning
  if (highEnergy && highConfidence) {
    reasoning.push('High energy + confidence — good for bold moves');
    bestActions.push('Pitch meetings', 'Negotiations', 'Strategic planning');
  }
  if (emotions.focus >= 7) {
    reasoning.push('Sharp focus — deep analytical work is favored');
    bestActions.push('Data analysis', 'Code reviews', 'Research');
  }
  if (emotions.motivation >= 7) {
    bestActions.push('Starting new projects', 'Outreach', 'Creative work');
  }
  if (emotions.energy <= 3) {
    avoidActions.push('High-stakes meetings', 'Complex negotiations');
  }
  if (highAnxiety) {
    avoidActions.push('Trading decisions', 'Confrontations');
  }
  if (highFrustration) {
    avoidActions.push('Sending important emails', 'Team feedback sessions');
  }
  if (lowFocus) {
    avoidActions.push('Detail-oriented work', 'Contract reviews');
  }

  // Ensure we have defaults
  if (bestActions.length === 0) bestActions.push('Routine tasks', 'Planning', 'Learning');
  if (avoidActions.length === 0) avoidActions.push('No major concerns detected');

  return { signal, score, recommendation, reasoning, bestActions, avoidActions };
}

export function generateReadinessForecast(emotions: EmotionValues): ReadinessForecast {
  const score = calculateCompositeScore(emotions);
  const dayClass = classifyDay(score);

  let forecast: string;
  let bestFor: string[] = [];
  let avoidToday: string[] = [];

  switch (dayClass) {
    case 'peak':
      forecast = 'Outstanding readiness. You\'re in the zone — capitalize on this state.';
      bestFor = ['Big decisions', 'Pitching', 'Trading', 'Leadership', 'Creative breakthroughs'];
      avoidToday = ['Wasting time on admin', 'Procrastinating'];
      break;
    case 'growth':
      forecast = 'Solid readiness. Good conditions for productive work and moderate decisions.';
      bestFor = ['Focused work', 'Team meetings', 'Moderate trades', 'Planning'];
      avoidToday = ['Overcommitting', 'All-or-nothing bets'];
      break;
    case 'neutral':
      forecast = 'Mixed readiness. Handle routine tasks and prepare for better days.';
      bestFor = ['Administrative work', 'Research', 'Learning', 'Organizing'];
      avoidToday = ['Major decisions', 'High-stakes trades', 'Difficult conversations'];
      break;
    case 'risk':
      forecast = 'Low readiness. Focus on recovery and minimal commitments.';
      bestFor = ['Rest', 'Light exercise', 'Journaling', 'Simple tasks'];
      avoidToday = ['Trading', 'Important emails', 'Negotiations', 'Deadlines'];
      break;
    case 'crisis':
      forecast = 'Critical state. Protect yourself. No big moves today.';
      bestFor = ['Self-care', 'Walking', 'Breathing exercises', 'Reaching out to someone'];
      avoidToday = ['All major decisions', 'Financial moves', 'Confrontations'];
      break;
  }

  return { score, dayClass, forecast, bestFor, avoidToday };
}
