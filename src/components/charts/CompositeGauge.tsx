"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getDayClassConfig } from "@/lib/scoring";
import { DayClass } from "@/lib/types";

interface CompositeGaugeProps {
  score: number;
  dayClass: DayClass;
}

export default function CompositeGauge({ score, dayClass }: CompositeGaugeProps) {
  const config = getDayClassConfig(dayClass);
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius="75%"
            outerRadius="100%"
            dataKey="value"
            stroke="none"
          >
            <Cell fill={config.color} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: config.color }}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-gray-500 mt-1">/ 100</span>
      </div>
    </div>
  );
}
