"use client";

import { EmotionConfig } from "@/lib/types";

interface SliderProps {
  emotion: EmotionConfig;
  value: number;
  onChange: (value: number) => void;
}

export default function Slider({ emotion, value, onChange }: SliderProps) {
  const gradientFrom = emotion.polarity === "positive" ? "#ef4444" : "#22c55e";
  const gradientTo = emotion.polarity === "positive" ? "#22c55e" : "#ef4444";
  const pct = ((value - 1) / 9) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{emotion.label}</label>
        <span
          className="text-lg font-bold w-8 text-center"
          style={{ color: emotion.color }}
        >
          {value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg pointer-events-none border-2"
          style={{
            left: `calc(${pct}% - ${pct * 0.16}px)`,
            borderColor: emotion.color,
          }}
        />
      </div>
    </div>
  );
}
