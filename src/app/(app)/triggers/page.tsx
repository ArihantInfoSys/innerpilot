"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord, TriggerEntry } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const CATEGORIES = [
  { value: "work", label: "Work", icon: "\uD83D\uDCBC" },
  { value: "relationship", label: "Relationship", icon: "\u2764\uFE0F" },
  { value: "health", label: "Health", icon: "\uD83C\uDFE5" },
  { value: "finance", label: "Finance", icon: "\uD83D\uDCB0" },
  { value: "sleep", label: "Sleep", icon: "\uD83D\uDE34" },
  { value: "social", label: "Social", icon: "\uD83D\uDC65" },
  { value: "other", label: "Other", icon: "\uD83D\uDCCC" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

function getCategoryIcon(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.icon ?? "\uD83D\uDCCC";
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<TriggerEntry[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [triggerLabel, setTriggerLabel] = useState("");
  const [category, setCategory] = useState<CategoryValue>("work");
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");

  // Pattern analysis
  const [topTrigger, setTopTrigger] = useState<{ category: string; count: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const today = new Date().toISOString().split("T")[0];

      const [{ data: checkinData }, { data: triggersData }, { data: weekTriggers }] =
        await Promise.all([
          supabase
            .from("checkins")
            .select("*")
            .eq("user_id", user.id)
            .eq("checkin_date", today)
            .single(),
          supabase
            .from("trigger_entries")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("trigger_entries")
            .select("category")
            .eq("user_id", user.id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ]);

      if (checkinData) setTodayCheckin(checkinData as CheckinRecord);
      if (triggersData) setTriggers(triggersData as TriggerEntry[]);

      // Calculate top trigger this week
      if (weekTriggers && weekTriggers.length > 0) {
        const counts: Record<string, number> = {};
        for (const t of weekTriggers) {
          counts[t.category] = (counts[t.category] || 0) + 1;
        }
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          setTopTrigger({ category: sorted[0][0], count: sorted[0][1] });
        }
      }

      setLoading(false);
    }

    load();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!triggerLabel.trim() || !userId) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      // Use .select() to verify the row was actually created
      const { data: inserted, error: insertError, status, statusText } = await supabase
        .from("trigger_entries")
        .insert({
          user_id: userId,
          checkin_id: todayCheckin?.id ?? null,
          trigger_label: triggerLabel.trim(),
          category,
          intensity,
          note: note.trim() || null,
        })
        .select()
        .single();

      // Detailed error surfacing
      if (insertError) {
        const detail = `[${status} ${statusText}] ${insertError.message} | Code: ${insertError.code || "N/A"} | Details: ${insertError.details || "N/A"} | Hint: ${insertError.hint || "N/A"}`;
        console.error("Trigger insert error:", detail, insertError);
        setErrorMsg(detail);
        setSaving(false);
        return;
      }

      if (!inserted) {
        setErrorMsg(`Insert returned no data (status: ${status}). The trigger_entries table may not exist. Please run the migration SQL in your Supabase dashboard.`);
        setSaving(false);
        return;
      }

      // Success — update local list
      setTriggers((prev) => [inserted as TriggerEntry, ...prev]);
      setTriggerLabel("");
      setCategory("work");
      setIntensity(5);
      setNote("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Trigger save exception:", err);
      setErrorMsg(`Exception: ${msg}`);
    }

    setSaving(false);
  }

  function getIntensityColor(val: number): string {
    if (val <= 3) return "bg-green-500";
    if (val <= 6) return "bg-yellow-500";
    if (val <= 8) return "bg-orange-500";
    return "bg-red-500";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Trigger Journal</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track what triggers your emotional shifts. Patterns become power.
        </p>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-sm text-green-300 font-medium">
            Trigger logged successfully! Awareness is the first step to mastery.
          </p>
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">Failed to log trigger</p>
            <p className="text-xs text-red-400/70 mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-300 text-lg">&times;</button>
        </div>
      )}

      {/* Pattern Insight */}
      {topTrigger && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">{getCategoryIcon(topTrigger.category)}</span>
          <p className="text-sm text-gray-300">
            <span className="text-white font-medium">Top trigger this week:</span>{" "}
            {topTrigger.category.charAt(0).toUpperCase() + topTrigger.category.slice(1)} ({topTrigger.count}{" "}
            {topTrigger.count === 1 ? "time" : "times"})
          </p>
        </div>
      )}

      {/* Log Form */}
      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Log a Trigger
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trigger Label */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">What triggered you?</label>
            <input
              type="text"
              value={triggerLabel}
              onChange={(e) => setTriggerLabel(e.target.value)}
              placeholder="e.g., Difficult conversation with manager"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-green-500/40 transition-colors"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Category</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs transition-all border ${
                    category === cat.value
                      ? "bg-green-500/15 border-green-500/30 text-green-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-500">Intensity</label>
              <span className={`text-sm font-bold ${intensity <= 3 ? "text-green-400" : intensity <= 6 ? "text-yellow-400" : intensity <= 8 ? "text-orange-400" : "text-red-400"}`}>
                {intensity}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-green-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional context..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-green-500/40 transition-colors resize-none"
            />
          </div>

          {/* Checkin Link Info */}
          {todayCheckin && (
            <p className="text-xs text-gray-500">
              This trigger will be linked to today&apos;s check-in (score: {todayCheckin.composite_score}).
            </p>
          )}

          <Button type="submit" loading={saving} disabled={!triggerLabel.trim()} className="w-full">
            Log Trigger
          </Button>
        </form>
      </GlassCard>

      {/* Recent Triggers */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Recent Triggers
        </h2>

        {triggers.length === 0 ? (
          <GlassCard className="text-center py-8">
            <p className="text-gray-500 text-sm">No triggers logged yet. Start tracking to discover your patterns.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <GlassCard key={trigger.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{getCategoryIcon(trigger.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-white truncate">
                        {trigger.trigger_label}
                      </h3>
                      <span className="flex-shrink-0 text-[10px] font-medium text-gray-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                        {trigger.category}
                      </span>
                    </div>

                    {/* Intensity bar */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getIntensityColor(trigger.intensity)}`}
                          style={{ width: `${trigger.intensity * 10}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{trigger.intensity}/10</span>
                    </div>

                    {trigger.note && (
                      <p className="text-xs text-gray-400 mt-1">{trigger.note}</p>
                    )}

                    <p className="text-[10px] text-gray-600 mt-1.5">
                      {getRelativeTime(trigger.created_at)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
