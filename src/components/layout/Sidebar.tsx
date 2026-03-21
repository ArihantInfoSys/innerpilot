"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Crosshair,
  TrendingUp,
  Settings,
  Brain,
  MessageCircle,
  Zap,
  Sunset,
  FileText,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "TRACK",
    items: [
      { href: "/checkin", label: "Check-in", icon: ClipboardCheck },
      { href: "/debrief", label: "Debrief", icon: Sunset },
    ],
  },
  {
    label: "ANALYZE",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/decide", label: "Decide", icon: Crosshair },
      { href: "/coach", label: "Coach", icon: MessageCircle },
    ],
  },
  {
    label: "REVIEW",
    items: [
      { href: "/triggers", label: "Triggers", icon: Zap },
      { href: "/history", label: "Trends", icon: TrendingUp },
      { href: "/report", label: "Report", icon: FileText },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-bg-secondary border-r border-white/5 p-6">
      <Link href="/dashboard" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Brain className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">InnerPilot</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Performance Coach</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-4 mb-2">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Settings at the bottom of nav */}
        <div>
          <div className="space-y-1">
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname.startsWith("/settings")
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="glass p-4 mt-4">
        <p className="text-xs text-gray-400">Track daily. Grow consistently.</p>
        <p className="text-xs text-green-400/60 mt-1">v1.0 MVP</p>
      </div>
    </aside>
  );
}
