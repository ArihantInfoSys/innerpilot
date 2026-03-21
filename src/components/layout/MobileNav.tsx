"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, TrendingUp, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/checkin", label: "Check-in", icon: ClipboardCheck },
  { href: "/history", label: "Trends", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-bg-secondary/95 backdrop-blur-xl border-t border-white/10 z-40">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
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
      </div>
    </nav>
  );
}
