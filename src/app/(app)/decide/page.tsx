"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { EmotionValues, EmotionName, CheckinRecord } from "@/lib/types";
import { EMOTIONS, DEFAULT_EMOTION_VALUES } from "@/lib/constants";
import { evaluateDecision, DecisionResult } from "@/lib/decision-engine";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import {
  Crosshair,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

const CONTEXTS = [
  { value: "general", label: "General" },
  { value: "trading", label: "Trading" },
  { value: "business", label: "Business" },
  { value: "communication", label: "Communication" },
  { value: "personal", label: "Personal" },
];

type Phase = "input" | "analyzing" | "result";

export default function DecidePage() {
  const supabase = createClient();

  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("general");
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<DecisionResult | null>(null);

  // Emotion state
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [emotions, setEmotions] = useState<EmotionValues>({
    ...DEFAULT_EMOTION_VALUES,
  } as EmotionValues);
  const [useManualEmotions, setUseManualEmotions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTodayCheckin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .eq("checkin_date", today)
        .single();

      if (data) {
        setTodayCheckin(data as CheckinRecord);
        setEmotions({
          anxiety: data.anxiety,
          confidence: data.confidence,
          focus: data.focus,
          frustration: data.frustration,
          motivation: data.motivation,
          energy: data.energy,
          fear: data.fear,
          excitement: data.excitement,
        });
      } else {
        setUseManualEmotions(true);
      }

      setLoading(false);
    }

    loadTodayCheckin();
  }, [supabase]);

  const handleSliderChange = useCallback(
    (name: EmotionName, value: number) => {
      setEmotions((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleAnalyze = useCallback(() => {
    if (!question.trim()) return;

    setPhase("analyzing");

    // Simulate brief analysis time for UX
    setTimeout(() => {
      const decisionResult = evaluateDecision(question, context, emotions);
      setResult(decisionResult);
      setPhase("result");
    }, 1500);
  }, [question, context, emotions]);

  const handleLogDecision = useCallback(
    async (acted: boolean) => {
      if (!result) return;
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaving(false);
        return;
      }

      await supabase.from("decision_gates").insert({
        user_id: user.id,
        question: question.trim(),
        context,
        emotional_score: result.score,
        recommendation: result.recommendation,
        signal: result.signal,
        acted_on: acted,
      });

      setSaving(false);
      // Reset
      setPhase("input");
      setQuestion("");
      setResult(null);
    },
    [result, question, context, supabase]
  );

  const handleReset = useCallback(() => {
    setPhase("input");
    setQuestion("");
    setResult(null);
  }, []);

  const signalConfig = {
    green: {
      color: "text-green-400",
      bg: "bg-green-500/20",
      border: "border-green-500/30",
      glow: "shadow-green-500/30",
      icon: CheckCircle2,
      label: "GO",
      emoji: "🟢",
    },
    caution: {
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      glow: "shadow-amber-500/30",
      icon: AlertTriangle,
      label: "CAUTION",
      emoji: "🟡",
    },
    stop: {
      color: "text-red-400",
      bg: "bg-red-500/20",
      border: "border-red-500/30",
      glow: "shadow-red-500/30",
      icon: Shield,
      label: "STOP",
      emoji: "🛑",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- ANALYZING PHASE ---
  if (phase === "analyzing") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Crosshair className="w-10 h-10 text-green-400 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Analyzing your state...
        </h2>
        <p className="text-gray-400">
          Evaluating emotional readiness against your decision context
        </p>
      </div>
    );
  }

  // --- RESULT PHASE ---
  if (phase === "result" && result) {
    const cfg = signalConfig[result.signal];
    const SignalIcon = cfg.icon;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Signal Light */}
        <GlassCard className="text-center py-8">
          <div
            className={`w-24 h-24 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center mx-auto mb-6 shadow-lg ${cfg.glow} animate-pulse`}
          >
            <SignalIcon className={`w-12 h-12 ${cfg.color}`} />
          </div>
          <div className={`text-4xl font-black ${cfg.color} mb-2`}>
            {cfg.emoji} {cfg.label}
          </div>
          <p className="text-lg text-white font-semibold max-w-md mx-auto mt-4">
            {result.recommendation}
          </p>
        </GlassCard>

        {/* Score + Question */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Your Question
              </p>
              <p className="text-white font-medium mt-1">{question}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Readiness Score
              </p>
              <p className={`text-2xl font-bold ${cfg.color}`}>
                {result.score.toFixed(1)}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Reasoning */}
        <GlassCard>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Analysis
          </h3>
          <ul className="space-y-2">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <ArrowRight className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Best For / Avoid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard>
            <h3 className="text-xs font-semibold text-green-400/80 uppercase tracking-wider mb-3">
              Best For Today
            </h3>
            <ul className="space-y-2">
              {result.bestActions.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard>
            <h3 className="text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-3">
              Avoid Today
            </h3>
            <ul className="space-y-2">
              {result.avoidActions.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-300"
                >
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => handleLogDecision(false)}
            loading={saving}
          >
            <Clock className="w-4 h-4" />
            I&apos;ll Wait
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => handleLogDecision(true)}
            loading={saving}
          >
            <ArrowRight className="w-4 h-4" />
            I&apos;ll Proceed
          </Button>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Ask another question
        </button>
      </div>
    );
  }

  // --- INPUT PHASE ---
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <Crosshair className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Should I Act Now?
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Before you make that call, let your emotional state inform the
          decision. Enter your question and we&apos;ll analyze your readiness.
        </p>
      </div>

      {/* Question Input */}
      <GlassCard>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          What decision are you facing?
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., Should I send this proposal? Should I take this trade? Should I have that conversation?"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 resize-none"
        />

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Context
          </label>
          <div className="relative">
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30"
            >
              {CONTEXTS.map((c) => (
                <option
                  key={c.value}
                  value={c.value}
                  className="bg-gray-900 text-white"
                >
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </GlassCard>

      {/* Emotion Source */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Emotional State
          </h3>
          {todayCheckin && (
            <button
              onClick={() => {
                setUseManualEmotions(!useManualEmotions);
                if (useManualEmotions && todayCheckin) {
                  // Reset to check-in values
                  setEmotions({
                    anxiety: todayCheckin.anxiety,
                    confidence: todayCheckin.confidence,
                    focus: todayCheckin.focus,
                    frustration: todayCheckin.frustration,
                    motivation: todayCheckin.motivation,
                    energy: todayCheckin.energy,
                    fear: todayCheckin.fear,
                    excitement: todayCheckin.excitement,
                  });
                }
              }}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              {useManualEmotions
                ? "Use today's check-in"
                : "Adjust manually"}
            </button>
          )}
        </div>

        {!useManualEmotions && todayCheckin ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">
                Using today&apos;s check-in data
              </p>
              <p className="text-xs text-gray-400">
                Score: {todayCheckin.composite_score} | Class:{" "}
                {todayCheckin.day_class}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!todayCheckin && (
              <p className="text-xs text-gray-400 mb-2">
                No check-in today. Adjust the sliders to reflect how you feel
                right now.
              </p>
            )}
            {EMOTIONS.map((emotion) => (
              <div key={emotion.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{emotion.label}</span>
                  <span
                    className="text-sm font-mono font-semibold"
                    style={{ color: emotion.color }}
                  >
                    {emotions[emotion.name]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={emotions[emotion.name]}
                  onChange={(e) =>
                    handleSliderChange(
                      emotion.name,
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={
                    {
                      background: `linear-gradient(to right, ${emotion.color} 0%, ${emotion.color} ${((emotions[emotion.name] - 1) / 9) * 100}%, rgba(255,255,255,0.1) ${((emotions[emotion.name] - 1) / 9) * 100}%, rgba(255,255,255,0.1) 100%)`,
                      "--thumb-color": emotion.color,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Analyze Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleAnalyze}
        disabled={!question.trim()}
      >
        <Crosshair className="w-5 h-5" />
        Analyze Decision Readiness
      </Button>
    </div>
  );
}
