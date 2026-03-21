"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, Crosshair, MessageCircle, Menu, X, Zap, TrendingUp, Settings } from "lucide-react";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", icon: ClipboardCheck },
  { href: "/decide", label: "Decide", icon: Crosshair },
  { href: "/coach", label: "Coach", icon: MessageCircle },
];

const MORE_NAV = [
  { href: "/triggers", label: "Triggers", icon: Zap },
  { href: "/history", label: "Trends", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_NAV.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMoreOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Slide-up panel */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#0a0f1a]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">More</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-1">
              {MORE_NAV.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-bg-secondary/95 backdrop-blur-xl border-t border-white/10 z-40">
        <div className="flex items-center justify-around py-2">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? "text-green-400" : "text-gray-500"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-medium transition-colors ${
              isMoreActive ? "text-green-400" : "text-gray-500"
            }`}
          >
            <Menu size={20} />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
