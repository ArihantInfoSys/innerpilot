"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ENGAGEMENT_RULES, getActiveEngagement, markShown } from "@/lib/engagement-rules";
import { EngagementContext, EngagementRule } from "@/lib/types";
import NudgePopup from "./NudgePopup";

interface EngagementProviderProps {
  children: React.ReactNode;
  userId: string;
}

export default function EngagementProvider({ children, userId }: EngagementProviderProps) {
  const [activeRule, setActiveRule] = useState<EngagementRule | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function evaluate() {
      const today = new Date().toISOString().split("T")[0];

      const [{ data: profile }, { data: checkins }, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("checkins")
          .select("*")
          .eq("user_id", userId)
          .order("checkin_date", { ascending: false })
          .limit(7),
        supabase
          .from("checkins")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      const recentCheckins = checkins || [];
      const hasCheckedInToday = recentCheckins.some((c: any) => c.checkin_date === today);
      const todayCheckin = recentCheckins.find((c: any) => c.checkin_date === today);

      const context: EngagementContext = {
        hasCheckedInToday,
        streakCount: profile?.streak_count || 0,
        isFirstCheckin: (count || 0) === 0,
        todayDayClass: todayCheckin?.day_class || null,
        recentCheckins: recentCheckins as any,
        tier: profile?.tier || "free",
        totalCheckins: count || 0,
      };

      const rule = getActiveEngagement(ENGAGEMENT_RULES, context);
      if (rule) {
        setActiveRule(rule);
        // Small delay for better UX
        setTimeout(() => setShowPopup(true), 1500);
      }
    }

    evaluate();
  }, [userId, supabase]);

  const handleDismiss = () => {
    if (activeRule) {
      markShown(activeRule.id);
    }
    setShowPopup(false);
  };

  return (
    <>
      {children}
      {activeRule && (
        <NudgePopup
          open={showPopup}
          rule={activeRule}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
