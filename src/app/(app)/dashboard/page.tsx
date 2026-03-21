"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord, CoachingResponse, TriggerEntry } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import CoachingCard from "@/components/coaching/CoachingCard";
import DayClassBadge from "@/components/coaching/DayClassBadge";
import StreakBanner from "@/components/engagement/StreakBanner";
import Button from "@/components/ui/Button";
import { ClipboardCheck, Zap, ShieldAlert, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const CompositeGauge = dynamic(() => import("@/components/charts/CompositeGauge"), { ssr: false });
const EmotionRadar = dynamic(() => import("@/components/charts/EmotionRadar"), { ssr: false });
const TrendLine = dynamic(() => import("@/components/charts/TrendLine"), { ssr: false });
const HeatmapCalendar = dynamic(() => import("@/components/charts/HeatmapCalendar"), { ssr: false });

/* ─── Trigger Intelligence: Clinical Advice by Category ─── */
const TRIGGER_CLINICAL_ADVICE: Record<string, { alert: string; prescription: string }> = {
  work: {
    alert: "Occupational stress pattern detected — repeated work-related triggers indicate your sympathetic nervous system is in chronic activation.",
    prescription: "Practice cognitive defusion: observe the stressful thought as a passing event, not a fact. Set firm boundaries on work hours. A 10-minute mindful breathing break between tasks reduces cortisol by up to 25%.",
  },
  relationship: {
    alert: "Interpersonal stress pattern identified — relationship triggers are activating your emotional limbic responses repeatedly.",
    prescription: "Before reacting, use the S.T.O.P. technique: Stop, Take a breath, Observe your feelings, Proceed mindfully. Journaling your feelings before a conversation reduces emotional reactivity by 43%.",
  },
  health: {
    alert: "Somatic anxiety pattern noted — health-related concerns are creating a feedback loop of worry and physical symptoms.",
    prescription: "Ground yourself with the 5-4-3-2-1 technique: notice 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. This disrupts the anxiety-body loop and activates your parasympathetic system.",
  },
  finance: {
    alert: "Financial anxiety pattern observed — money-related stress activates threat-detection circuits, impairing rational decision-making.",
    prescription: "Separate what you can control from what you cannot. Write down 3 financial actions within your power today. Decision fatigue worsens financial anxiety — limit major financial decisions to your peak cognitive hours.",
  },
  sleep: {
    alert: "Sleep disruption pattern flagged — poor sleep is both a trigger and amplifier of emotional dysregulation.",
    prescription: "Implement sleep hygiene: no screens 60 minutes before bed, maintain a consistent wake time, and use progressive muscle relaxation. Even one night of restored sleep improves emotional regulation by 60%.",
  },
  social: {
    alert: "Social stress pattern detected — social triggers may indicate emotional boundaries need strengthening.",
    prescription: "Practice assertive communication using the DESC model: Describe the situation, Express your feelings, Specify what you need, state Consequences. Setting one small boundary this week builds the neural pathway for self-advocacy.",
  },
  other: {
    alert: "Recurring emotional trigger pattern identified — unclassified stressors often point to deeper unresolved patterns.",
    prescription: "Maintain a trigger journal with specifics: What happened? What did you feel in your body? What thought arose? Specificity is the first step to desensitization. Consider discussing recurring patterns with a mental health professional.",
  },
};

/* ─── Tip of the Day: Bhagavad Gita Wisdom for Emotional Mastery ─── */
const DAILY_TIPS: { title: string; verse: string; tips: string[] }[] = [
  {
    title: "Mastering the Restless Mind",
    verse: "Bhagavad Gita 6.35 — \"The mind is restless, no doubt, O Arjuna, but it can be controlled by constant practice and detachment.\"",
    tips: [
      "Begin your morning with 5 minutes of stillness — observe thoughts without engaging them",
      "When emotions surge, pause for 3 breaths before responding — this is abhyasa (practice) in action",
      "Write down one worry and consciously release it — practise vairagya (detachment) from outcomes",
      "Replace one negative self-talk pattern today with a compassionate truth about yourself",
      "End your day by noting 3 moments where you chose response over reaction",
    ],
  },
  {
    title: "Equanimity in Success and Failure",
    verse: "Bhagavad Gita 2.48 — \"Perform your duty with equanimity, O Arjuna, abandoning attachment to success or failure. Such evenness of mind is called Yoga.\"",
    tips: [
      "Set one intention today focused on effort, not outcome — excellence lies in the process",
      "When you face a setback, ask: 'What can I learn?' instead of 'Why did this happen to me?'",
      "Celebrate effort-based wins: completing a task mindfully is a victory regardless of the result",
      "Practice samatvam (equanimity) — respond to praise and criticism with the same inner steadiness",
      "Before bed, review your day through the lens of growth, not perfection",
    ],
  },
  {
    title: "Freedom from Anger",
    verse: "Bhagavad Gita 2.63 — \"From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason, one falls down.\"",
    tips: [
      "Identify your anger early — notice the first physical sign (clenched jaw, racing heart) and intervene",
      "Use the 90-second rule: the neurochemical cycle of anger lasts 90 seconds — breathe through it",
      "Transform anger into information — ask 'What boundary was crossed?' rather than reacting",
      "Practice karuna (compassion) — anger at others often reflects an unmet need within yourself",
      "Channel frustrated energy into one productive action instead of rumination",
    ],
  },
  {
    title: "Conquering Fear and Anxiety",
    verse: "Bhagavad Gita 4.10 — \"Freed from attachment, fear, and anger, absorbed in Me, many have become purified by the fire of knowledge.\"",
    tips: [
      "Name your fear specifically — vague anxiety shrinks when you give it precise words",
      "Ask yourself: 'Will this matter in 5 years?' Most fears are projections, not present realities",
      "Take one small step toward what you fear — action is the antidote to anxiety (Karma Yoga)",
      "Practice jnana (self-knowledge): distinguish between intuitive caution and irrational fear",
      "Ground yourself in the present moment — fear exists only in the imagined future",
    ],
  },
  {
    title: "The Power of Self-Discipline",
    verse: "Bhagavad Gita 6.5 — \"One must elevate oneself by one's own mind, not degrade oneself. The mind alone is the friend of the soul, and the mind alone is the enemy.\"",
    tips: [
      "Choose one habit today that serves your highest self — small tapas (discipline) builds inner strength",
      "When tempted to avoid discomfort, remind yourself: growth lives just beyond the comfort zone",
      "Treat your mind as a student you are training with patience, not as an enemy to conquer",
      "Replace 'I have to' with 'I choose to' — autonomy transforms obligation into empowerment",
      "Before sleep, honour one moment where your discipline served you well today",
    ],
  },
  {
    title: "Letting Go of What You Cannot Control",
    verse: "Bhagavad Gita 2.47 — \"You have the right to perform your actions, but you are not entitled to the fruits of your actions.\"",
    tips: [
      "Write down what is within your control today and release what is not — this is Nishkama Karma",
      "When anxious about outcomes, redirect energy to improving the quality of your present action",
      "Practise santosha (contentment) — find peace in having done your best, regardless of results",
      "Detach from others' opinions — your inner compass is the truest measure of your worth",
      "End your day with gratitude for the effort you made, not judgement of what was achieved",
    ],
  },
  {
    title: "Inner Peace Through Self-Awareness",
    verse: "Bhagavad Gita 2.70 — \"One who is not disturbed by the flow of desires, as the ocean remains undisturbed by the rivers, can alone achieve peace.\"",
    tips: [
      "Observe your desires today without acting on them — witness consciousness is your deepest strength",
      "When a craving arises, wait 10 minutes — most urges dissolve when you simply observe them",
      "Practice svadhyaya (self-study): ask 'What emotion is driving this impulse?'",
      "Create one moment of deliberate silence today — stillness reveals what noise conceals",
      "Like the ocean absorbing rivers, let emotions flow through you without losing your centre",
    ],
  },
];

function getTodayTip(): (typeof DAILY_TIPS)[number] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export default function DashboardPage() {
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const [allCheckins, setAllCheckins] = useState<CheckinRecord[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Trigger intelligence state
  const [recentTriggers, setRecentTriggers] = useState<TriggerEntry[]>([]);
  const [topTriggerCategory, setTopTriggerCategory] = useState<{ category: string; count: number } | null>(null);
  const [highIntensityAlert, setHighIntensityAlert] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      // All 6 queries in parallel — no N+1
      const [
        { data: todayData },
        { data: recentData },
        { data: allData },
        { data: profile },
        { data: coachingData },
        { data: triggerData },
      ] = await Promise.all([
        supabase
          .from("checkins")
          .select("*")
          .eq("user_id", user.id)
          .eq("checkin_date", today)
          .maybeSingle(),
        supabase
          .from("checkins")
          .select("*")
          .eq("user_id", user.id)
          .gte("checkin_date", sevenDaysAgoStr)
          .order("checkin_date", { ascending: false }),
        supabase
          .from("checkins")
          .select("*")
          .eq("user_id", user.id)
          .gte("checkin_date", thirtyDaysAgoStr)
          .order("checkin_date", { ascending: false }),
        supabase.from("profiles").select("streak_count").eq("id", user.id).single(),
        supabase
          .from("coaching_responses")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", today + "T00:00:00")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("trigger_entries")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (todayData) {
        setTodayCheckin(todayData as CheckinRecord);
      }

      // Parse coaching
      if (coachingData?.advice_text) {
        try {
          setCoaching(JSON.parse(coachingData.advice_text));
        } catch {
          // fallback
        }
      }

      // Process trigger intelligence
      if (triggerData && triggerData.length > 0) {
        const typed = triggerData as TriggerEntry[];
        setRecentTriggers(typed);

        const counts: Record<string, number> = {};
        for (const t of typed) {
          counts[t.category] = (counts[t.category] || 0) + 1;
        }
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          setTopTriggerCategory({ category: sorted[0][0], count: sorted[0][1] });
        }
        setHighIntensityAlert(typed.filter((t) => t.intensity >= 8).length >= 2);
      }

      setRecentCheckins((recentData as CheckinRecord[]) || []);
      setAllCheckins((allData as CheckinRecord[]) || []);
      setStreakCount(profile?.streak_count || 0);
      setLoading(false);
    }

    load();
  }, [supabase]);

  const todayTip = getTodayTip();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!todayCheckin) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <ClipboardCheck className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No check-in today</h2>
        <p className="text-gray-400 mb-6">Start your day with a 60-second emotional check-in.</p>
        <Link href="/checkin">
          <Button size="lg">Check In Now</Button>
        </Link>

        {recentCheckins.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Trend</h3>
            <GlassCard>
              <TrendLine checkins={recentCheckins} />
            </GlassCard>
          </div>
        )}

        {/* Tip of the Day — always visible */}
        <div className="mt-8 text-left">
          <TipOfTheDay tip={todayTip} />
        </div>
      </div>
    );
  }

  const emotionValues = {
    anxiety: todayCheckin.anxiety,
    confidence: todayCheckin.confidence,
    focus: todayCheckin.focus,
    frustration: todayCheckin.frustration,
    motivation: todayCheckin.motivation,
    energy: todayCheckin.energy,
    fear: todayCheckin.fear,
    excitement: todayCheckin.excitement,
  };

  return (
    <div className="space-y-6">
      {/* Top row: Score + Day Class + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Performance Score
          </h3>
          <CompositeGauge score={Number(todayCheckin.composite_score)} dayClass={todayCheckin.day_class} />
        </GlassCard>

        <GlassCard className="flex flex-col items-center justify-center gap-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Today&apos;s Classification
          </h3>
          <DayClassBadge dayClass={todayCheckin.day_class} size="lg" />
          <StreakBanner count={streakCount} />
        </GlassCard>

        <GlassCard>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Emotion Profile
          </h3>
          <EmotionRadar values={emotionValues} />
        </GlassCard>
      </div>

      {/* Coaching */}
      {coaching && <CoachingCard coaching={coaching} />}

      {/* ─── Trigger Intelligence Alert (Psychiatrist Voice) ─── */}
      <TriggerIntelligenceSection
        recentTriggers={recentTriggers}
        topTriggerCategory={topTriggerCategory}
        highIntensityAlert={highIntensityAlert}
      />

      {/* ─── Tip of the Day: Bhagavad Gita Wisdom ─── */}
      <TipOfTheDay tip={todayTip} />

      {/* Bottom row: Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            7-Day Trend
          </h3>
          <TrendLine checkins={recentCheckins} />
        </GlassCard>

        <GlassCard>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            30-Day Activity
          </h3>
          <HeatmapCalendar checkins={allCheckins} />
        </GlassCard>
      </div>
    </div>
  );
}

/* ─── Trigger Intelligence Component ─── */
function TriggerIntelligenceSection({
  recentTriggers,
  topTriggerCategory,
  highIntensityAlert,
}: {
  recentTriggers: TriggerEntry[];
  topTriggerCategory: { category: string; count: number } | null;
  highIntensityAlert: boolean;
}) {
  if (recentTriggers.length === 0) {
    return (
      <GlassCard className="border border-white/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Trigger Awareness</h3>
            <p className="text-sm text-gray-400">
              No triggers logged this week. As a clinical practice, I recommend tracking emotional triggers
              when they occur — awareness is the foundation of emotional regulation. Patterns only become
              visible when documented.
            </p>
            <Link href="/triggers" className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 mt-3 transition-colors">
              <Zap className="w-3.5 h-3.5" />
              Start Trigger Journal
            </Link>
          </div>
        </div>
      </GlassCard>
    );
  }

  const category = topTriggerCategory?.category || "other";
  const advice = TRIGGER_CLINICAL_ADVICE[category];
  const avgIntensity = recentTriggers.reduce((sum, t) => sum + t.intensity, 0) / recentTriggers.length;

  return (
    <div className="space-y-4">
      {/* High Intensity Alert Banner */}
      {highIntensityAlert && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-1">Clinical Alert: High-Intensity Triggers Detected</h3>
            <p className="text-sm text-gray-300">
              Multiple high-intensity triggers (8+/10) have been recorded this week. This level of emotional
              activation can impair decision-making and sleep quality. I strongly recommend prioritizing
              self-regulation techniques today. Consider this a &quot;yellow flag&quot; day for major decisions.
            </p>
          </div>
        </div>
      )}

      {/* Main Trigger Intelligence Card */}
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Trigger Pattern Analysis</h3>
              <span className="text-xs text-gray-500">{recentTriggers.length} triggers this week</span>
            </div>

            {/* Clinical Alert */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-3">
              <p className="text-xs font-medium text-amber-400 mb-1">
                {category.charAt(0).toUpperCase() + category.slice(1)} — Primary Pattern ({topTriggerCategory?.count} occurrences | Avg. intensity: {avgIntensity.toFixed(1)}/10)
              </p>
              <p className="text-sm text-gray-300">{advice.alert}</p>
            </div>

            {/* Prescription */}
            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3">
              <p className="text-xs font-medium text-green-400 mb-1">Recommended Intervention</p>
              <p className="text-sm text-gray-300">{advice.prescription}</p>
            </div>

            <Link href="/triggers" className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 mt-3 transition-colors">
              <Zap className="w-3.5 h-3.5" />
              View Full Trigger Journal
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Tip of the Day Component ─── */
function TipOfTheDay({ tip }: { tip: (typeof DAILY_TIPS)[number] }) {
  return (
    <GlassCard className="border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.03] to-transparent">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-amber-400">Tip of the Day</h3>
            <Sparkles className="w-3.5 h-3.5 text-amber-500/50" />
          </div>
          <h4 className="text-white font-medium text-sm mb-2">{tip.title}</h4>
          <p className="text-xs text-amber-400/70 italic mb-3">{tip.verse}</p>
          <ul className="space-y-2">
            {tip.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-amber-400">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}
