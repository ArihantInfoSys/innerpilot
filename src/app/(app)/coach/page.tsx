"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckinRecord, CoachMessage } from "@/lib/types";
import { generateCoachResponse } from "@/lib/coach-chat-engine";
import { Send } from "lucide-react";

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0];
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: checkinData }, { data: messagesData }] = await Promise.all([
        supabase
          .from("checkins")
          .select("*")
          .eq("user_id", user.id)
          .eq("checkin_date", today)
          .single(),
        supabase
          .from("coach_messages")
          .select("*")
          .eq("user_id", user.id)
          .eq("session_date", today)
          .order("created_at", { ascending: true }),
      ]);

      if (checkinData) setTodayCheckin(checkinData as CheckinRecord);
      if (messagesData) setMessages(messagesData as CoachMessage[]);
      setLoading(false);
    }

    load();
  }, [supabase, today]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !userId || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    const tempUserMsg: CoachMessage = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      role: "user",
      content: userMessage,
      session_date: today,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Save user message
    const { data: savedUserMsg } = await supabase
      .from("coach_messages")
      .insert({
        user_id: userId,
        role: "user",
        content: userMessage,
        session_date: today,
      })
      .select()
      .single();

    if (savedUserMsg) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempUserMsg.id ? (savedUserMsg as CoachMessage) : m))
      );
    }

    // Generate coach response
    const recentMsgs = [...messages, tempUserMsg].slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Simulate thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    const coachContent = generateCoachResponse({
      todayCheckin,
      recentMessages: recentMsgs,
      userMessage,
    });

    // Save coach message
    const { data: savedCoachMsg } = await supabase
      .from("coach_messages")
      .insert({
        user_id: userId,
        role: "coach",
        content: coachContent,
        session_date: today,
      })
      .select()
      .single();

    if (savedCoachMsg) {
      setMessages((prev) => [...prev, savedCoachMsg as CoachMessage]);
    }

    setSending(false);
    inputRef.current?.focus();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)] max-w-3xl mx-auto">
      {/* Session Header */}
      <div className="text-center py-4 flex-shrink-0">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2">
          <span className="text-lg">🧠</span>
          <span className="text-sm font-medium text-gray-300">AI Coach Session</span>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
        {todayCheckin && (
          <p className="text-xs text-gray-500 mt-2">
            Today&apos;s score: {todayCheckin.composite_score} &middot;{" "}
            {todayCheckin.day_class.charAt(0).toUpperCase() + todayCheckin.day_class.slice(1)} day
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-4">
              <span className="text-3xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your AI Performance Coach</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Talk through decisions, emotions, or patterns. I&apos;m here to help you think clearly.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-6 max-w-sm w-full">
              {[
                "I'm feeling anxious about a decision",
                "I need help with motivation",
                "Should I take a risk today?",
                "I'm feeling burned out",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-xs text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "coach" && (
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm">🧠</span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-green-500/20 border border-green-500/20 text-green-100"
                    : "bg-white/5 backdrop-blur-xl border border-white/10 text-gray-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">🧠</span>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to your coach..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none py-2"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:hover:bg-green-500 flex items-center justify-center transition-all"
          >
            <Send size={16} className="text-black" />
          </button>
        </form>
      </div>
    </div>
  );
}
