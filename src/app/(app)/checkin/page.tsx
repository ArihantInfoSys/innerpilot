"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMOTIONS, DEFAULT_EMOTION_VALUES } from "@/lib/constants";
import { calculateCompositeScore, classifyDay, getDayClassConfig } from "@/lib/scoring";
import { generateCoaching } from "@/lib/coaching-engine";
import { generateReadinessForecast } from "@/lib/decision-engine";
import { EmotionValues, EmotionName, ReadinessForecast } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import Slider from "@/components/ui/Slider";
import Button from "@/components/ui/Button";
import { Sparkles, Sun, ArrowRight, CheckCircle, XCircle } from "lucide-react";

export default function CheckinPage() {
  const [values, setValues] = useState<Record<EmotionName, number>>({ ...DEFAULT_EMOTION_VALUES });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState<ReadinessForecast | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (name: EmotionName, value: number) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const emotionValues = values as EmotionValues;
      const compositeScore = calculateCompositeScore(emotionValues);
      const dayClass = classifyDay(compositeScore);
      const coaching = generateCoaching(emotionValues);

      // Insert check-in
      const { data: checkin, error: checkinError } = await supabase
        .from("checkins")
        .insert({
          user_id: user.id,
          ...emotionValues,
          composite_score: compositeScore,
          day_class: dayClass,
          note: note || null,
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Insert coaching response
      const { error: coachingError } = await supabase
        .from("coaching_responses")
        .insert({
          checkin_id: checkin.id,
          user_id: user.id,
          day_class: dayClass,
          advice_text: JSON.stringify(coaching),
          focus_areas: coaching.focusAreas,
        });

      if (coachingError) throw coachingError;

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_checkin_date, streak_count")
        .eq("id", user.id)
        .single();

      let newStreak = 1;
      if (profile?.last_checkin_date) {
        const lastDate = new Date(profile.last_checkin_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
        if (diffDays === 1) {
          newStreak = (profile.streak_count || 0) + 1;
        } else if (diffDays === 0) {
          newStreak = profile.streak_count || 1;
        }
      }

      await supabase
        .from("profiles")
        .update({ last_checkin_date: today, streak_count: newStreak })
        .eq("id", user.id);

      // Generate and show readiness forecast instead of navigating
      const readiness = generateReadinessForecast(emotionValues);
      setForecast(readiness);
      setLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

  const positiveEmotions = EMOTIONS.filter((e) => e.polarity === "positive");
  const negativeEmotions = EMOTIONS.filter((e) => e.polarity === "negative");

  // Show Morning Readiness Forecast after submission
  if (forecast) {
    const dayClassConfig = getDayClassConfig(forecast.dayClass);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Forecast Header */}
        <GlassCard className="text-center space-y-4 border-yellow-500/20">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <Sun className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Your Morning Forecast</h2>
          <p className="text-gray-400 text-sm">{forecast.forecast}</p>

          {/* Score Display */}
          <div className="inline-flex items-center gap-3 bg-white/5 rounded-2xl px-6 py-4">
            <span
              className="text-4xl font-bold"
              style={{ color: dayClassConfig.color }}
            >
              {forecast.score}
            </span>
            <div className="text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Readiness</p>
              <p className="text-sm font-medium" style={{ color: dayClassConfig.color }}>
                {dayClassConfig.emoji} {dayClassConfig.label}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Best For / Avoid Today */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="border-green-500/20">
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
              Best For Today
            </h3>
            <ul className="space-y-2">
              {forecast.bestFor.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
              Avoid Today
            </h3>
            <ul className="space-y-2">
              {forecast.avoidToday.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <XCircle size={14} className="text-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        {/* Dismiss Button */}
        <Button
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
          className="w-full"
          size="lg"
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Daily Check-in</h1>
        <p className="text-gray-400 text-sm">Rate each emotion from 1 (low) to 10 (high). Be honest — this is your data.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <GlassCard>
        <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">
          Positive Drivers
        </h2>
        <div className="space-y-5">
          {positiveEmotions.map((emotion) => (
            <Slider
              key={emotion.name}
              emotion={emotion}
              value={values[emotion.name]}
              onChange={(v) => handleChange(emotion.name, v)}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
          Risk Signals
        </h2>
        <div className="space-y-5">
          {negativeEmotions.map((emotion) => (
            <Slider
              key={emotion.name}
              emotion={emotion}
              value={values[emotion.name]}
              onChange={(v) => handleChange(emotion.name, v)}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <label className="text-sm font-medium text-gray-300 block mb-2">
          Notes (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors resize-none h-24"
          placeholder="Any context about today..."
        />
      </GlassCard>

      <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
        <Sparkles size={18} />
        Get My Coaching
      </Button>
    </div>
  );
}
