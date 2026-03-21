"use client";

import { CoachingResponse } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { Brain, CheckCircle, AlertTriangle } from "lucide-react";

interface CoachingCardProps {
  coaching: CoachingResponse;
}

export default function CoachingCard({ coaching }: CoachingCardProps) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Brain size={18} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">AI Coaching</h3>
      </div>

      {coaching.pattern && (
        <Badge color="#f97316" className="mb-3">
          <AlertTriangle size={12} />
          {coaching.pattern} Detected
        </Badge>
      )}

      <p className="text-gray-300 text-sm leading-relaxed mb-4">{coaching.summary}</p>

      <div className="space-y-2 mb-4">
        {coaching.actions.map((action, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">{action}</p>
          </div>
        ))}
      </div>

      {coaching.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {coaching.focusAreas.map((area) => (
            <Badge key={area} color="#ef4444" className="text-xs">
              {area}
            </Badge>
          ))}
        </div>
      )}

      <div className="pt-3 border-t border-white/5">
        <p className="text-sm text-green-400/80 italic">{coaching.encouragement}</p>
      </div>
    </GlassCard>
  );
}
