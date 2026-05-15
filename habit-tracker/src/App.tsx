import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, Snowflake, Target } from "lucide-react";
import Hero from "./pages/landing-page/Hero";
import How from "./pages/landing-page/How";
import Features from "./pages/landing-page/Features";
import Cta from "./pages/landing-page/Cta";
import Footer from "./pages/landing-page/Footer";

export const FEATURES = [
  {
    icon: Target,
    title: "Minimum viable habit",
    desc: "Set the smallest possible action you'll commit to. On bad days, just do the minimum - the streak lives.",
  },
  {
    icon: Flame,
    title: "Streak tracking",
    desc: "Every consecutive day adds to your streak. Hit milestones at 7, 30, and 100 days.",
  },
  {
    icon: Snowflake,
    title: "Grace freezes",
    desc: "Life happens. Use a weekly freeze to protect your streak without losing momentum.",
  },
];

export const STEPS = [
  {
    number: "01",
    title: "Add your habit",
    desc: 'Name the habit and set your minimum - the least you can do and still count the day. E.g. "Exercise daily -> 2 rounds of push-ups".',
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

      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          navScrolled
            ? "bg-neutral-900/90 backdrop-blur-sm shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-emerald-500" />
            <span className="text-lg font-bold tracking-tight text-neutral-100">
              Streakly
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-zinc-200 sm:flex">
            <a href="#how" className="transition-colors hover:text-emerald-500">
              How it works
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-emerald-500"
            >
              Features
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/sign-up"
              className="rounded-lg bg-emerald-500 px-4 py-1 text-zinc-100 transition-all ease-linear hover:bg-zinc-100 hover:text-zinc-900"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <How />
        <Features />
        <Cta />
      </main>

      <Footer />
    </div>
  );
}
