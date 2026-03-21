"use client";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export default function Badge({ children, color = "#22c55e", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}
