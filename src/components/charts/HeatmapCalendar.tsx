"use client";

import { CheckinRecord, DayClass } from "@/lib/types";
import { getDayClassConfig } from "@/lib/scoring";

interface HeatmapCalendarProps {
  checkins: CheckinRecord[];
}

export default function HeatmapCalendar({ checkins }: HeatmapCalendarProps) {
  const checkinMap = new Map<string, DayClass>();
  checkins.forEach((c) => checkinMap.set(c.checkin_date, c.day_class));

  // Last 30 days
  const days: { date: string; dayClass: DayClass | null }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      dayClass: checkinMap.get(dateStr) ?? null,
    });
  }

  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5">
        {days.map((day) => {
          const config = day.dayClass ? getDayClassConfig(day.dayClass) : null;
          return (
            <div
              key={day.date}
              className="aspect-square rounded-sm"
              style={{
                backgroundColor: config ? `${config.color}40` : "rgba(255,255,255,0.03)",
                border: config ? `1px solid ${config.color}30` : "1px solid transparent",
              }}
              title={`${day.date}${config ? ` — ${config.label}` : " — No check-in"}`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <span>Less</span>
        {["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"].map((color) => (
          <div key={color} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${color}40` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
