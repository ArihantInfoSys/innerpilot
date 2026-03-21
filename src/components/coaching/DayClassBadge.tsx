"use client";

import { DayClass } from "@/lib/types";
import { getDayClassConfig } from "@/lib/scoring";
import Badge from "@/components/ui/Badge";

interface DayClassBadgeProps {
  dayClass: DayClass;
  size?: "sm" | "lg";
}

export default function DayClassBadge({ dayClass, size = "sm" }: DayClassBadgeProps) {
  const config = getDayClassConfig(dayClass);

  return (
    <Badge color={config.color} className={size === "lg" ? "text-base px-4 py-2" : ""}>
      {config.emoji} {config.label}
    </Badge>
  );
}
