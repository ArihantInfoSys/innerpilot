import Link from "next/link";
import { Brain, Target, TrendingUp, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xl font-bold text-white">InnerPilot</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 text-sm font-semibold bg-green-500 hover:bg-green-400 text-black rounded-xl transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 md:pt-32 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          AI-Powered Emotional Intelligence
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
          Master Your Emotions.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
            Maximize Performance.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Track your emotional state in 60 seconds. Get AI coaching tailored to traders,
          founders, and high performers. See your trends. Take control.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 text-base font-bold bg-green-500 hover:bg-green-400 text-black rounded-xl transition-all shadow-lg shadow-green-500/20"
          >
            Start Free — 60 Second Setup
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-base font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Target,
              title: "60-Second Check-in",
              desc: "Rate 8 key emotions. Get your performance score instantly. No fluff, just data.",
              color: "#22d3ee",
            },
            {
              icon: Shield,
              title: "AI Coaching Engine",
              desc: "Pattern detection identifies burnout, imposter syndrome, and freeze states. Get actionable advice.",
              color: "#34d399",
            },
            {
              icon: TrendingUp,
              title: "Performance Trends",
              desc: "Track your emotional baseline over weeks. See what environments drive peak performance.",
              color: "#fbbf24",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass p-8 hover:bg-white/[0.08] transition-colors group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-white/5">
        <p className="text-sm text-gray-600">
          InnerPilot — Built for high performers who take emotional intelligence seriously.
        </p>
      </footer>
    </div>
  );
}
