"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord, DayClass, WeeklyReport } from "@/lib/types";
import { getDayClassConfig } from "@/lib/scoring";
import { calculateStreakInfo } from "@/lib/streak-engine";
import { DAY_CLASSES, EMOTIONS } from "@/lib/constants";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { FileText, TrendingUp, TrendingDown, Flame, Copy, Check, ChevronDown } from "lucide-react";

interface WeekData {
  weekStart: string;
  weekEnd: string;
  checkins: CheckinRecord[];
  avgScore: number;
  bestDay: { date: string; score: number } | null;
  worstDay: { date: string; score: number } | null;
  totalCheckins: number;
  currentStreak: number;
  mostCommonDayClass: DayClass;
  topEmotionPatterns: string[];
  consistencyDots: boolean[];
  insight: string;
  focusRecommendation: string;
}

function getWeekRange(offset: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset - offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  const year = e.getFullYear();
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()} - ${e.getDate()}, ${year}`;
  }
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}, ${year}`;
}

function generateInsight(data: WeekData): string {
  if (data.totalCheckins === 0) return "No check-ins this week. Start tracking to unlock insights.";
  if (data.totalCheckins <= 2)
    return "Limited data this week. Check in daily for more accurate insights.";

  const avgScore = data.avgScore;
  if (avgScore >= 75) {
    return "Strong week overall. Your emotional balance was consistently high. Keep doing what works.";
  } else if (avgScore >= 55) {
    return "Decent week with room for growth. Look at your best day for clues on what drives peak performance.";
  } else if (avgScore >= 40) {
    return "A challenging week. Focus on the basics: sleep, exercise, and one small win each day.";
  }
  return "Tough week. Remember, awareness is the first step. Use your debrief insights to plan recovery.";
}

function generateFocus(data: WeekData): string {
  if (data.totalCheckins === 0) return "Build the habit: aim for 3 check-ins next week.";

  const patterns = data.topEmotionPatterns;
  if (patterns.includes("High anxiety")) {
    return "Anxiety was elevated this week. Try scheduling 10 minutes of breathing exercises each morning.";
  }
  if (patterns.includes("Low energy")) {
    return "Energy was consistently low. Prioritize sleep quality and consider your nutrition this week.";
  }
  if (patterns.includes("Low focus")) {
    return "Focus was a challenge. Try time-blocking your most important tasks into 90-minute sessions.";
  }
  if (data.avgScore >= 70) {
    return "Maintain your momentum. Document what made this week successful to create a repeatable playbook.";
  }
  return "Set one clear intention each morning and check in consistently to spot patterns.";
}

export default function ReportPage() {
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [savedReport, setSavedReport] = useState<WeeklyReport | null>(null);
  const supabase = createClient();

  const loadWeek = useCallback(
    async (offset: number) => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { start, end } = getWeekRange(offset);
      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      // Fetch check-ins for the week
      const { data: checkins } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .gte("checkin_date", startStr)
        .lte("checkin_date", endStr)
        .order("checkin_date", { ascending: true });

      const weekCheckins = (checkins as CheckinRecord[]) || [];

      // Fetch all check-ins for streak calculation
      const { data: allCheckins } = await supabase
        .from("checkins")
        .select("checkin_date")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false });

      const streakInfo = calculateStreakInfo(allCheckins || []);

      // Calculate stats
      let avgScore = 0;
      let bestDay: { date: string; score: number } | null = null;
      let worstDay: { date: string; score: number } | null = null;

      if (weekCheckins.length > 0) {
        const scores = weekCheckins.map((c) => Number(c.composite_score));
        avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

        const maxIdx = scores.indexOf(Math.max(...scores));
        const minIdx = scores.indexOf(Math.min(...scores));
        bestDay = { date: weekCheckins[maxIdx].checkin_date, score: scores[maxIdx] };
        worstDay = { date: weekCheckins[minIdx].checkin_date, score: scores[minIdx] };
      }

      // Day class frequency
      const dayClassCounts: Record<string, number> = {};
      for (const c of weekCheckins) {
        dayClassCounts[c.day_class] = (dayClassCounts[c.day_class] || 0) + 1;
      }
      const mostCommonDayClass = (Object.entries(dayClassCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral") as DayClass;

      // Top emotion patterns
      const emotionPatterns: string[] = [];
      if (weekCheckins.length > 0) {
        const avgEmotions: Record<string, number> = {};
        for (const emotion of EMOTIONS) {
          const avg =
            weekCheckins.reduce((sum, c) => sum + Number(c[emotion.name]), 0) / weekCheckins.length;
          avgEmotions[emotion.name] = avg;
        }
        for (const emotion of EMOTIONS) {
          if (emotion.polarity === "negative" && avgEmotions[emotion.name] >= 6) {
            emotionPatterns.push(`High ${emotion.label.toLowerCase()}`);
          }
          if (emotion.polarity === "positive" && avgEmotions[emotion.name] <= 4) {
            emotionPatterns.push(`Low ${emotion.label.toLowerCase()}`);
          }
        }
      }

      // Consistency dots (Mon-Sun)
      const consistencyDots: boolean[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        consistencyDots.push(weekCheckins.some((c) => c.checkin_date === dateStr));
      }

      const data: WeekData = {
        weekStart: startStr,
        weekEnd: endStr,
        checkins: weekCheckins,
        avgScore,
        bestDay,
        worstDay,
        totalCheckins: weekCheckins.length,
        currentStreak: streakInfo.currentStreak,
        mostCommonDayClass,
        topEmotionPatterns: emotionPatterns,
        consistencyDots,
        insight: "",
        focusRecommendation: "",
      };

      data.insight = generateInsight(data);
      data.focusRecommendation = generateFocus(data);

      setWeekData(data);

      // Check for existing saved report
      const { data: existingReport } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", startStr)
        .single();

      if (existingReport) {
        setSavedReport(existingReport as WeeklyReport);
      } else {
        setSavedReport(null);
        // Auto-save report
        if (weekCheckins.length > 0) {
          const { data: newReport } = await supabase
            .from("weekly_reports")
            .insert({
              user_id: user.id,
              week_start: startStr,
              week_end: endStr,
              avg_score: avgScore,
              best_day: bestDay?.date || null,
              best_score: bestDay?.score || null,
              worst_day: worstDay?.date || null,
              worst_score: worstDay?.score || null,
              top_trigger: emotionPatterns[0] || null,
              total_checkins: weekCheckins.length,
              streak_at_end: streakInfo.currentStreak,
              insights: {
                insight: data.insight,
                focus: data.focusRecommendation,
                mostCommonDayClass,
                emotionPatterns,
              },
            })
            .select()
            .single();

          if (newReport) setSavedReport(newReport as WeeklyReport);
        }
      }

      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    loadWeek(weekOffset);
  }, [weekOffset, loadWeek]);

  const handleCopyReport = () => {
    if (!weekData) return;

    const text = [
      `InnerPilot Weekly Report`,
      `${formatWeekLabel(weekData.weekStart, weekData.weekEnd)}`,
      ``,
      `Average Score: ${weekData.avgScore}`,
      `Total Check-ins: ${weekData.totalCheckins}/7`,
      `Current Streak: ${weekData.currentStreak} days`,
      weekData.bestDay
        ? `Best Day: ${formatDate(weekData.bestDay.date)} (${weekData.bestDay.score})`
        : "",
      weekData.worstDay
        ? `Lowest Day: ${formatDate(weekData.worstDay.date)} (${weekData.worstDay.score})`
        : "",
      ``,
      `Insight: ${weekData.insight}`,
      `Focus: ${weekData.focusRecommendation}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!weekData) return null;

  const avgDayClassConfig = getDayClassConfig(
    DAY_CLASSES.find(
      (dc) => weekData.avgScore >= dc.minScore && weekData.avgScore <= dc.maxScore
    )?.class || "neutral"
  );

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Weekly Report</h1>
          </div>
          <p className="text-gray-400 text-sm">
            {formatWeekLabel(weekData.weekStart, weekData.weekEnd)}
          </p>
        </div>

        {/* Week Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            {weekOffset === 0 ? "This Week" : `${weekOffset} week${weekOffset > 1 ? "s" : ""} ago`}
            <ChevronDown size={14} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-10 min-w-[160px]">
              {[0, 1, 2, 3, 4].map((offset) => (
                <button
                  key={offset}
                  onClick={() => {
                    setWeekOffset(offset);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    weekOffset === offset
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {offset === 0 ? "This Week" : `${offset} week${offset > 1 ? "s" : ""} ago`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {weekData.totalCheckins === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No check-ins this week</p>
          <p className="text-gray-500 text-sm">Check in daily to generate your weekly report.</p>
        </GlassCard>
      ) : (
        <>
          {/* Average Score */}
          <GlassCard className="text-center border-blue-500/20">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Average Performance Score
            </p>
            <div className="inline-flex items-center gap-3">
              <span
                className="text-5xl font-bold"
                style={{ color: avgDayClassConfig.color }}
              >
                {weekData.avgScore}
              </span>
              <div className="text-left">
                <p
                  className="text-sm font-medium"
                  style={{ color: avgDayClassConfig.color }}
                >
                  {avgDayClassConfig.emoji} {avgDayClassConfig.label}
                </p>
                <p className="text-xs text-gray-500">
                  {weekData.totalCheckins} of 7 days tracked
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Best / Worst Day */}
          <div className="grid grid-cols-2 gap-4">
            {weekData.bestDay && (
              <GlassCard className="border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Best Day</p>
                </div>
                <p className="text-2xl font-bold text-green-400">{weekData.bestDay.score}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDate(weekData.bestDay.date)}
                </p>
              </GlassCard>
            )}
            {weekData.worstDay && (
              <GlassCard className="border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={16} className="text-red-400" />
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Lowest Day</p>
                </div>
                <p className="text-2xl font-bold text-red-400">{weekData.worstDay.score}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDate(weekData.worstDay.date)}
                </p>
              </GlassCard>
            )}
          </div>

          {/* Consistency Bar */}
          <GlassCard>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Check-in Consistency
            </p>
            <div className="flex items-center justify-between">
              {weekData.consistencyDots.map((filled, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      filled
                        ? "bg-green-500/20 border-2 border-green-500"
                        : "bg-white/5 border-2 border-white/10"
                    }`}
                  >
                    {filled && <Check size={14} className="text-green-400" />}
                  </div>
                  <span className="text-xs text-gray-500">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Streak */}
          <GlassCard className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Current Streak</p>
              <p className="text-2xl font-bold text-white mt-1">{weekData.currentStreak} days</p>
            </div>
            <div className="text-4xl">
              <Flame
                size={40}
                className={
                  weekData.currentStreak >= 7
                    ? "text-orange-400"
                    : weekData.currentStreak >= 3
                    ? "text-yellow-400"
                    : "text-gray-600"
                }
              />
            </div>
          </GlassCard>

          {/* Emotion Patterns */}
          {weekData.topEmotionPatterns.length > 0 && (
            <GlassCard>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                Emotion Patterns This Week
              </p>
              <div className="flex flex-wrap gap-2">
                {weekData.topEmotionPatterns.map((pattern, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pattern.startsWith("High")
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Key Insight */}
          <GlassCard className="border-purple-500/20">
            <p className="text-xs text-purple-400 uppercase tracking-wider font-semibold mb-2">
              Key Insight
            </p>
            <p className="text-sm text-gray-300">{weekData.insight}</p>
          </GlassCard>

          {/* Next Week Focus */}
          <GlassCard className="border-blue-500/20">
            <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-2">
              Next Week Focus
            </p>
            <p className="text-sm text-gray-300">{weekData.focusRecommendation}</p>
          </GlassCard>

          {/* Share Button */}
          <Button
            onClick={handleCopyReport}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy size={18} />
                Share Report
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
