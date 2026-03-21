"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { User, Crown, Download, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name || "");
      }
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", profile.id);

    setMessage(error ? "Failed to save" : "Saved!");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleExport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: true });

    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r: any) => Object.values(r).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `innerpilot-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            {message && <span className="text-sm text-green-400">{message}</span>}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Crown size={18} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subscription</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">
              {profile.tier === "pro" ? "InnerPilot Pro" : "InnerPilot Basic"}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile.tier === "pro"
                ? "Full access to all features"
                : "Basic emotional tracking and coaching"}
            </p>
          </div>
          <Badge color={profile.tier === "pro" ? "#a855f7" : "#555566"}>
            {profile.tier === "pro" ? "PRO" : "FREE"}
          </Badge>
        </div>

        {profile.tier === "free" && (
          <div className="mt-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-sm text-purple-300 font-medium mb-1">Upgrade to Pro — $9/month</p>
            <p className="text-xs text-gray-500">
              Unlimited history, advanced insights, pattern detection, CSV export, and more.
            </p>
            <Button variant="secondary" className="mt-3" size="sm">
              Coming Soon
            </Button>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Data</h2>
        </div>

        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} />
          Export Check-ins (CSV)
        </Button>
      </GlassCard>

      <GlassCard>
        <Button variant="ghost" onClick={handleSignOut} className="text-red-400 hover:text-red-300">
          <LogOut size={16} />
          Sign Out
        </Button>
      </GlassCard>
    </div>
  );
}
