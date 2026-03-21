"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord, CoachingResponse } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import CompositeGauge from "@/components/charts/CompositeGauge";
import EmotionRadar from "@/components/charts/EmotionRadar";
import TrendLine from "@/components/charts/TrendLine";
import HeatmapCalendar from "@/components/charts/HeatmapCalendar";
import CoachingCard from "@/components/coaching/CoachingCard";
import DayClassBadge from "@/components/coaching/DayClassBadge";
import StreakBanner from "@/components/engagement/StreakBanner";
import Button from "@/components/ui/Button";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const [allCheckins, setAllCheckins] = useState<CheckinRecord[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const [{ data: todayData }, { data: recentData }, { data: allData }, { data: profile }] =
        await Promise.all([
          supabase
            .from("checkins")
            .select("*")
            .eq("user_id", user.id)
            .eq("checkin_date", today)
            .single(),
          supabase
            .from("checkins")
            .select("*")
            .eq("user_id", user.id)
            .order("checkin_date", { ascending: false })
            .limit(7),
          supabase
            .from("checkins")
            .select("*")
            .eq("user_id", user.id)
            .order("checkin_date", { ascending: false })
            .limit(30),
          supabase.from("profiles").select("streak_count").eq("id", user.id).single(),
        ]);

      if (todayData) {
        setTodayCheckin(todayData as CheckinRecord);

        // Load coaching for today
        const { data: coachingData } = await supabase
          .from("coaching_responses")
          .select("*")
          .eq("checkin_id", todayData.id)
          .single();

        if (coachingData?.advice_text) {
          try {
            setCoaching(JSON.parse(coachingData.advice_text));
          } catch {
            // fallback
          }
        }
      }

      setRecentCheckins((recentData as CheckinRecord[]) || []);
      setAllCheckins((allData as CheckinRecord[]) || []);
      setStreakCount(profile?.streak_count || 0);
      setLoading(false);
    }

    load();
  }, [supabase]);

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

      {/* Middle row: Coaching */}
      {coaching && <CoachingCard coaching={coaching} />}

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
