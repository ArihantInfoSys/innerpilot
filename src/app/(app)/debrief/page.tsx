"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord, EveningDebrief } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { Sunset, Star, CheckCircle, ArrowRight } from "lucide-react";

type OutcomeRating = "better" | "expected" | "worse" | "";

export default function DebriefPage() {
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [existingDebrief, setExistingDebrief] = useState<EveningDebrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [decisionsMade, setDecisionsMade] = useState("");
  const [outcomeRating, setOutcomeRating] = useState<OutcomeRating>("");
  const [outcomeDetail, setOutcomeDetail] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");
  const [tomorrowIntention, setTomorrowIntention] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      // Check for today's check-in
      const { data: checkinData } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .eq("checkin_date", today)
        .single();

      if (!checkinData) {
        router.push("/checkin");
        return;
      }

      setTodayCheckin(checkinData as CheckinRecord);

      // Check for existing debrief
      const { data: debriefData } = await supabase
        .from("evening_debriefs")
        .select("*")
        .eq("user_id", user.id)
        .eq("debrief_date", today)
        .single();

      if (debriefData) {
        setExistingDebrief(debriefData as EveningDebrief);
      }

      setLoading(false);
    }

    load();
  }, [supabase, router]);

  const handleSave = async () => {
    if (overallRating === 0) {
      setError("Please rate your day overall.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split("T")[0];
      const outcomes = outcomeRating
        ? `${outcomeRating}${outcomeDetail ? ": " + outcomeDetail : ""}`
        : outcomeDetail || null;

      const { data, error: insertError } = await supabase
        .from("evening_debriefs")
        .insert({
          user_id: user.id,
          checkin_id: todayCheckin?.id || null,
          debrief_date: today,
          decisions_made: decisionsMade || null,
          outcomes,
          lesson_learned: lessonLearned || null,
          tomorrow_intention: tomorrowIntention || null,
          overall_rating: overallRating,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setExistingDebrief(data as EveningDebrief);
      setSaved(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show "Day Complete" card after saving
  if (saved && existingDebrief && todayCheckin) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <GlassCard className="text-center space-y-6 border-green-500/20">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Day Complete</h2>
          <p className="text-gray-400 text-sm">
            Your evening debrief has been recorded. Rest well.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Morning Score</p>
              <p className="text-2xl font-bold text-green-400">
                {todayCheckin.composite_score}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Evening Rating</p>
              <div className="flex justify-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    className={
                      s <= (existingDebrief.overall_rating ?? 0)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          {lessonLearned && (
            <div className="bg-white/5 rounded-xl p-4 text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Insight</p>
              <p className="text-sm text-gray-300">{lessonLearned}</p>
            </div>
          )}

          <Button onClick={() => router.push("/dashboard")} className="w-full" size="lg">
            Back to Dashboard
            <ArrowRight size={16} />
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Show existing debrief as read-only
  if (existingDebrief && todayCheckin) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Sunset className="w-6 h-6 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">Evening Debrief</h1>
          </div>
          <p className="text-gray-400 text-sm">
            You already completed today&apos;s debrief. Here&apos;s your reflection.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Morning Score</p>
            <p className="text-2xl font-bold text-green-400">
              {todayCheckin.composite_score}
            </p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Evening Rating</p>
            <div className="flex justify-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={20}
                  className={
                    s <= (existingDebrief.overall_rating ?? 0)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }
                />
              ))}
            </div>
          </GlassCard>
        </div>

        {existingDebrief.decisions_made && (
          <GlassCard>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Decisions Made</p>
            <p className="text-sm text-gray-300">{existingDebrief.decisions_made}</p>
          </GlassCard>
        )}

        {existingDebrief.outcomes && (
          <GlassCard>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Outcomes</p>
            <p className="text-sm text-gray-300">{existingDebrief.outcomes}</p>
          </GlassCard>
        )}

        {existingDebrief.lesson_learned && (
          <GlassCard>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Lesson Learned</p>
            <p className="text-sm text-gray-300">{existingDebrief.lesson_learned}</p>
          </GlassCard>
        )}

        {existingDebrief.tomorrow_intention && (
          <GlassCard>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Tomorrow&apos;s Intention
            </p>
            <p className="text-sm text-gray-300">{existingDebrief.tomorrow_intention}</p>
          </GlassCard>
        )}

        <Button
          onClick={() => router.push("/dashboard")}
          variant="secondary"
          className="w-full"
          size="lg"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Main debrief form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Sunset className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Evening Debrief</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Reflect on your day. Close the loop on your morning check-in.
        </p>
      </div>

      {todayCheckin && (
        <GlassCard className="border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Morning Score</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {todayCheckin.composite_score}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Day Class</p>
              <p className="text-sm text-gray-300 mt-1 capitalize">{todayCheckin.day_class}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <GlassCard>
        <label className="text-sm font-medium text-gray-300 block mb-2">
          What decisions did you make today?
        </label>
        <textarea
          value={decisionsMade}
          onChange={(e) => setDecisionsMade(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none h-24"
          placeholder="Key decisions, big or small..."
        />
      </GlassCard>

      <GlassCard>
        <label className="text-sm font-medium text-gray-300 block mb-3">
          How did they turn out?
        </label>
        <div className="flex gap-3 mb-4">
          {(
            [
              { value: "better", label: "Better than expected", color: "green" },
              { value: "expected", label: "As expected", color: "yellow" },
              { value: "worse", label: "Worse than expected", color: "red" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOutcomeRating(opt.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                outcomeRating === opt.value
                  ? opt.color === "green"
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : opt.color === "yellow"
                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                    : "bg-red-500/20 border-red-500/40 text-red-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <textarea
          value={outcomeDetail}
          onChange={(e) => setOutcomeDetail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none h-20"
          placeholder="Any details about the outcomes..."
        />
      </GlassCard>

      <GlassCard>
        <label className="text-sm font-medium text-gray-300 block mb-2">
          What did you learn?
        </label>
        <textarea
          value={lessonLearned}
          onChange={(e) => setLessonLearned(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none h-24"
          placeholder="Key takeaway from today..."
        />
      </GlassCard>

      <GlassCard>
        <label className="text-sm font-medium text-gray-300 block mb-2">
          What&apos;s your intention for tomorrow?
        </label>
        <textarea
          value={tomorrowIntention}
          onChange={(e) => setTomorrowIntention(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors resize-none h-24"
          placeholder="One clear intention for tomorrow..."
        />
      </GlassCard>

      <GlassCard>
        <label className="text-sm font-medium text-gray-300 block mb-3">
          Rate your day overall
        </label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setOverallRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={`transition-colors ${
                  star <= (hoverRating || overallRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
        {overallRating > 0 && (
          <p className="text-center text-sm text-gray-400 mt-2">
            {overallRating === 1
              ? "Tough day"
              : overallRating === 2
              ? "Below average"
              : overallRating === 3
              ? "Decent day"
              : overallRating === 4
              ? "Good day"
              : "Excellent day"}
          </p>
        )}
      </GlassCard>

      <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
        <Sunset size={18} />
        Complete Evening Debrief
      </Button>
    </div>
  );
}
