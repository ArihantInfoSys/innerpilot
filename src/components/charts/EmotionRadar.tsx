"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { EMOTIONS } from "@/lib/constants";
import { EmotionValues } from "@/lib/types";

interface EmotionRadarProps {
  values: EmotionValues;
}

export default function EmotionRadar({ values }: EmotionRadarProps) {
  const data = EMOTIONS.map((e) => ({
    emotion: e.label,
    value: values[e.name],
    fullMark: 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="emotion"
          tick={{ fill: "#8888a0", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={{ fill: "#555566", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Emotions"
          dataKey="value"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
