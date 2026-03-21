"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMOTIONS, DEFAULT_EMOTION_VALUES } from "@/lib/constants";
import { calculateCompositeScore, classifyDay } from "@/lib/scoring";
import { generateCoaching } from "@/lib/coaching-engine";
import { EmotionValues, EmotionName } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import Slider from "@/components/ui/Slider";
import Button from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

export default function CheckinPage() {
  const [values, setValues] = useState<Record<EmotionName, number>>({ ...DEFAULT_EMOTION_VALUES });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const positiveEmotions = EMOTIONS.filter((e) => e.polarity === "positive");
  const negativeEmotions = EMOTIONS.filter((e) => e.polarity === "negative");

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
