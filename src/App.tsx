import { useState, useEffect } from "react";
import Hero from "./pages/landing-page/Hero";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

import How from "./pages/landing-page/How";
import Features from "./pages/landing-page/Features";
import Cta from "./pages/landing-page/Cta";
import Footer from "./pages/landing-page/Footer";

// ── Fake streak data for the animated preview ──────────────────────────────
// ── Small reusable components ──────────────────────────────────────────────

export function SnowflakeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ── Feature cards ──────────────────────────────────────────────────────────

export const FEATURES = [
  {
    icon: "🎯",
    title: "Minimum viable habit",
    desc: "Set the smallest possible action you'll commit to. On bad days, just do the minimum — the streak lives.",
  },
  {
    icon: "🔥",
    title: "Streak tracking",
    desc: "Every consecutive day adds to your streak. Hit milestones at 7, 30, and 100 days.",
  },
  {
    icon: "❄️",
    title: "Grace freezes",
    desc: "Life happens. Use a weekly freeze to protect your streak without losing momentum.",
  },
  {
    icon: "📅",
    title: "Calendar heatmap",
    desc: "See your full history at a glance — a GitHub-style grid of hits and misses per habit.",
  },
  {
    icon: "📈",
    title: "Completion charts",
    desc: "Track your completion rate over time and see the long-term arc of your consistency.",
  },
  {
    icon: "🔔",
    title: "Smart reminders",
    desc: "Daily nudges at your preferred time, plus freeze warnings before your streak is at risk.",
  },
];

export const STEPS = [
  {
    number: "01",
    title: "Add your habit",
    desc: 'Name the habit and set your minimum — the least you can do and still count the day. E.g. "Exercise daily → 2 rounds of push-ups".',
  },
  {
    number: "02",
    title: "Check in daily",
    desc: "One tap. That's it. Your checkbox resets every midnight so each day is a fresh start.",
  },
  {
    number: "03",
    title: "Watch it compound",
    desc: "Your streak grows with every day. Miss one? Use a grace freeze. Hit 30 days? You'll know about it.",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "The minimum input idea is genius. I've kept a 47-day streak because some days I just do the bare minimum and that's enough.",
    author: "Aisha T.",
    role: "Designer",
  },
  {
    quote:
      "Finally a tracker that doesn't make me feel guilty for missing one day. The freeze mechanic saved me twice already.",
    author: "Emeka R.",
    role: "Software engineer",
  },
  {
    quote:
      "Dead simple. No bloat. I track 4 habits and have a 90-day streak on two of them.",
    author: "Yuki M.",
    role: "Freelancer",
  },
];

// ── Main landing page ──────────────────────────────────────────────────────

export default function App() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 font-sans text-neutral-100 selection:bg-emerald-200">
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease both;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease both;
        }
      `}</style>

      {/* ── Nav ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-neutral-900/90 backdrop-blur-sm shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-neutral-100 tracking-tight text-lg">
              Streakly
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-200">
            <a href="#how" className="hover:text-emerald-500 transition-colors">
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-emerald-500 transition-colors"
            >
              Features
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-100 hover:text-zinc-900"
            >
              Log in
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-700 text-white rounded-full px-5"
            >
              Get started free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <Hero />
        {/* ── How it works ── */}
        <How />
        {/* ── Features ── */}
        <Features />
        {/* ── Final CTA ── */}
        <Cta />
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
