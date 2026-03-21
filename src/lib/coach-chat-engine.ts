import { CheckinRecord } from './types';

interface ChatContext {
  todayCheckin: CheckinRecord | null;
  recentMessages: { role: string; content: string }[];
  userMessage: string;
}

const COACH_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Welcome back. I'm here to help you navigate today's decisions with clarity. What's on your mind?",
    "Good to see you. Let's make today count. What would you like to work through?",
    "I'm here. Whether it's a decision, a feeling, or a pattern \u2014 let's talk it through.",
  ],
  anxiety: [
    "I hear you. Anxiety often signals that something matters to you. Let's separate the signal from the noise. What specifically is driving the anxiety?",
    "Anxiety is your mind running scenarios. The key is to ground yourself in what you can actually control right now. What's one thing within your control?",
    "When anxiety spikes, your brain narrows focus to threats. Let's widen the lens \u2014 what's actually going well right now, even if small?",
  ],
  frustration: [
    "Frustration usually means your expectations aren't matching reality. Which part \u2014 the situation, people, or yourself?",
    "I get it. Frustration can either fuel you or burn you. Let's channel it. What outcome would actually satisfy you here?",
    "The frustration is data. It's telling you something needs to change. Is it the approach, the timeline, or the goal itself?",
  ],
  confidence_low: [
    "Low confidence is often just insufficient evidence. What's one recent win you're not giving yourself credit for?",
    "Self-doubt is loudest right before growth. You've handled hard things before. What got you through last time?",
    "Confidence isn't about feeling certain \u2014 it's about acting despite uncertainty. What's the smallest step forward?",
  ],
  decision: [
    "Good \u2014 bringing decisions to the surface is the first step. What are your actual options? Let's lay them out clearly.",
    "Before we decide: what would you do if fear wasn't a factor? That answer often reveals your real preference.",
    "Every decision has a 'cost of inaction' too. What happens if you don't decide today?",
  ],
  trading: [
    "The market doesn't care about your feelings, but your feelings absolutely affect your market decisions. What's your current risk tolerance honestly?",
    "Before any trade: are you acting on analysis or emotion? If you can't articulate the thesis in one sentence, step back.",
    "The best traders I've seen have one thing in common: they know when NOT to trade. Is today a 'sit on hands' day?",
  ],
  motivation_low: [
    "Motivation follows action, not the other way around. What's the absolute smallest thing you could do in the next 5 minutes?",
    "You don't need motivation to start. You need to start to find motivation. What's one micro-task?",
    "Low motivation often means you're disconnected from your 'why.' What made you start this in the first place?",
  ],
  burnout: [
    "If you're burned out, pushing harder is the worst strategy. Recovery isn't laziness \u2014 it's maintenance. What can you cancel today?",
    "Burnout doesn't come from working hard. It comes from working hard on things that feel meaningless. Is that happening?",
    "Your body is sending a message. Listen to it now, or it'll force you to listen later. What does rest look like for you today?",
  ],
  general: [
    "That's a good insight. Let's dig deeper \u2014 what's the emotion underneath that thought?",
    "I appreciate you sharing that. How long have you been carrying this? Sometimes naming the timeline helps.",
    "Let's reframe this. Instead of 'what's wrong,' let's ask 'what does this situation need from me right now?'",
    "Interesting. If you were advising a friend in this exact situation, what would you tell them?",
    "That resonates. What would it look like if this worked out exactly how you wanted?",
  ],
  peak_day: [
    "You're in peak state today \u2014 this is rare and valuable. Don't waste it on small tasks. What's the highest-leverage thing you can do?",
    "Peak days are for bold moves. Is there a decision you've been postponing that deserves today's clarity?",
  ],
  crisis_day: [
    "I see you're having a tough day. That's okay \u2014 it's data, not destiny. Right now, the only goal is stability. What's one thing that would make the next hour better?",
    "On days like this, the win isn't productivity \u2014 it's self-preservation. Protect your energy. Avoid big decisions. Be kind to yourself.",
  ],
};

function detectTopics(message: string): string[] {
  const lower = message.toLowerCase();
  const topics: string[] = [];

  if (/\b(hi|hello|hey|good morning|good evening|start)\b/.test(lower)) topics.push('greeting');
  if (/\b(anxious|anxiety|nervous|worried|panic|stress|stressed)\b/.test(lower)) topics.push('anxiety');
  if (/\b(frustrated|frustration|angry|annoyed|irritated|mad)\b/.test(lower)) topics.push('frustration');
  if (/\b(doubt|unsure|can't do|not good enough|imposter|confidence)\b/.test(lower)) topics.push('confidence_low');
  if (/\b(decide|decision|should i|choice|dilemma|options)\b/.test(lower)) topics.push('decision');
  if (/\b(trade|trading|market|stock|position|portfolio|crypto)\b/.test(lower)) topics.push('trading');
  if (/\b(unmotivated|lazy|don't want|can't start|no energy|tired)\b/.test(lower)) topics.push('motivation_low');
  if (/\b(burnout|burned out|exhausted|overwhelmed|can't anymore|breaking)\b/.test(lower)) topics.push('burnout');

  if (topics.length === 0) topics.push('general');
  return topics;
}

export function generateCoachResponse(context: ChatContext): string {
  const { todayCheckin, userMessage } = context;
  const topics = detectTopics(userMessage);

  // Add day-class context if available
  if (todayCheckin) {
    const dayClass = todayCheckin.day_class;
    if (dayClass === 'peak' || dayClass === 'growth') topics.push('peak_day');
    if (dayClass === 'crisis') topics.push('crisis_day');
  }

  // Build response from detected topics
  const parts: string[] = [];

  // Add emotional context if available
  if (todayCheckin && topics.length > 0 && !topics.includes('greeting')) {
    const score = todayCheckin.composite_score;
    if (score < 40) {
      parts.push(`I see your score today is ${score} \u2014 let's be extra mindful with decisions.`);
    } else if (score > 75) {
      parts.push(`Your score is ${score} today \u2014 you're in a strong position.`);
    }
  }

  // Pick response from primary topic
  const primaryTopic = topics[0];
  const responses = COACH_RESPONSES[primaryTopic] || COACH_RESPONSES.general;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  parts.push(randomResponse);

  // Add secondary topic insight if present
  if (topics.length > 1 && topics[1] !== 'peak_day' && topics[1] !== 'crisis_day') {
    const secondaryResponses = COACH_RESPONSES[topics[1]];
    if (secondaryResponses) {
      const secondary = secondaryResponses[Math.floor(Math.random() * secondaryResponses.length)];
      parts.push(secondary);
    }
  }

  return parts.join('\n\n');
}
