"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckinRecord } from "@/lib/types";

interface TrendLineProps {
  checkins: CheckinRecord[];
}

function TrendLineInner({ checkins }: TrendLineProps) {
  const data = [...checkins]
    .reverse()
    .map((c) => ({
      date: new Date(c.checkin_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: Number(c.composite_score),
    }));

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">
        Complete more check-ins to see trends
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
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
        <Line
          type="monotone"
          dataKey="score"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: "#22c55e", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default React.memo(TrendLineInner);
