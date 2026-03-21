"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GlassCard from "@/components/ui/GlassCard";
import Button from "@/components/ui/Button";
import { Brain, Mail, Lock, User } from "lucide-react";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/checkin");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />

      <GlassCard className="w-full max-w-md relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Brain className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Join InnerPilot</h1>
            <p className="text-xs text-gray-500">Start mastering your emotional performance</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 transition-colors">
            Sign In
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
