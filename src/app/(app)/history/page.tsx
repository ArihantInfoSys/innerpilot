"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord } from "@/lib/types";
import { EMOTIONS } from "@/lib/constants";
import { getDayClassConfig } from "@/lib/scoring";
import GlassCard from "@/components/ui/GlassCard";
import DayClassBadge from "@/components/coaching/DayClassBadge";
import Badge from "@/components/ui/Badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type Range = "7" | "30" | "90";

export default function HistoryPage() {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(parseInt(range));

      setCheckins((data as CheckinRecord[]) || []);
      setLoading(false);
    }

    load();
  }, [range, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const reversed = [...checkins].reverse();
  const trendData = reversed.map((c) => ({
    date: new Date(c.checkin_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: Number(c.composite_score),
  }));

  const emotionData = reversed.map((c) => ({
    date: new Date(c.checkin_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...Object.fromEntries(EMOTIONS.map((e) => [e.name, c[e.name]])),
  }));

  // Weekly summary
  const bestDay = checkins.length > 0
    ? checkins.reduce((best, c) => (Number(c.composite_score) > Number(best.composite_score) ? c : best))
    : null;
  const worstDay = checkins.length > 0
    ? checkins.reduce((worst, c) => (Number(c.composite_score) < Number(worst.composite_score) ? c : worst))
    : null;
  const avgScore = checkins.length > 0
    ? checkins.reduce((sum, c) => sum + Number(c.composite_score), 0) / checkins.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trends & History</h1>
          <p className="text-sm text-gray-400 mt-1">Track your emotional performance over time</p>
        </div>
        <div className="flex gap-2">
          {(["7", "30", "90"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                range === r
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-gray-500 hover:text-white border border-transparent"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {checkins.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-gray-500">No check-ins in this period. Start tracking to see trends.</p>
        </GlassCard>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Average Score</p>
              <p className="text-2xl font-bold text-white">{avgScore.toFixed(1)}</p>
            </GlassCard>
            {bestDay && (
              <GlassCard>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Best Day</p>
                <p className="text-lg font-bold text-green-400">
                  {Number(bestDay.composite_score).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(bestDay.checkin_date).toLocaleDateString()}
                </p>
              </GlassCard>
            )}
            {worstDay && (
              <GlassCard>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hardest Day</p>
                <p className="text-lg font-bold text-red-400">
                  {Number(worstDay.composite_score).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(worstDay.checkin_date).toLocaleDateString()}
                </p>
              </GlassCard>
            )}
          </div>

          {/* Composite score trend */}
          <GlassCard>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Performance Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#8888a0", fontSize: 11 }} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#555566", fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111118",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#f0f0f5",
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Emotion breakdown */}
          <GlassCard>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Emotion Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#8888a0", fontSize: 11 }} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: "#555566", fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111118",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#f0f0f5",
                  }}
                />
                {EMOTIONS.map((e) => (
                  <Area
                    key={e.name}
                    type="monotone"
                    dataKey={e.name}
                    stroke={e.color}
                    fill={e.color}
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-4">
              {EMOTIONS.map((e) => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                  {e.label}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Check-in log */}
          <GlassCard>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Check-in Log
            </h3>
            <div className="space-y-3">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: getDayClassConfig(c.day_class).color }}
                    />
                    <div>
                      <p className="text-sm text-white">
                        {new Date(c.checkin_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {c.note && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{c.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{Number(c.composite_score).toFixed(1)}</span>
                    <DayClassBadge dayClass={c.day_class} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
