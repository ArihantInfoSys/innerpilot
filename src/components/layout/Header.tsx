"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  email?: string;
}

export default function Header({ email }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div />
      <div className="flex items-center gap-4">
        {email && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User size={16} />
            <span className="hidden sm:inline">{email}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
