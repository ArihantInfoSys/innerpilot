"use client";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6
        ${onClick ? "cursor-pointer hover:bg-white/[0.08] transition-colors" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
