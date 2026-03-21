"use client";

import { Flame } from "lucide-react";

interface StreakBannerProps {
  count: number;
}

export default function StreakBanner({ count }: StreakBannerProps) {
  if (count <= 0) return null;

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
      <Flame size={18} className="text-orange-400" />
      <span className="text-sm font-semibold text-orange-300">{count} day streak</span>
    </div>
  );
}
