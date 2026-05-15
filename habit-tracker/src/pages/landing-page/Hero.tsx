import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HABITS_DEMO } from "@/components/shared/habitsDemo";
import { DemoCard } from "@/components/shared/demoCard";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="mb-6 text-white border-emerald-600 bg-emerald-500 animate-fade-in"
            style={{ animationDelay: "0ms" }}
          >
            <Flame className="w-3 h-3 mr-1.5 text-emerald-500" />
            Free to start · No credit card
          </Badge>

          <h1
            className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.08] text-neutral-100 animate-fade-in-up mb-6"
            style={{ animationDelay: "80ms" }}
          >
            Small steps,
            <br />
            <span className="text-emerald-500">every day.</span>
          </h1>

          <p
            className="text-lg text-zinc-400 leading-relaxed max-w-xl animate-fade-in-up mb-10"
            style={{ animationDelay: "160ms" }}
          >
            Set a habit. Define the bare minimum you'll do on your hardest day.
            Check in daily, protect your streak with a grace freeze, and watch
            consistency compound over time.
          </p>

          <div
            className="flex flex-wrap gap-3 animate-fade-in-up"
            style={{ animationDelay: "240ms" }}
          >
            <Button
              size="lg"
              className="bg-zinc-900 hover:bg-zinc-700 text-white rounded-full px-8 h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link to="/sign-up">Get started free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 text-base font-medium border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-400"
            >
              <a href="#how">
              See how it works ↓
              </a>
            </Button>
          </div>

          <p
            className="mt-4 text-sm text-zinc-400 animate-fade-in"
            style={{ animationDelay: "360ms" }}
          >
            Start building better habits today
          </p>
        </div>

        {/* Live demo cards */}
        <div className="mt-16 grid gap-3 max-w-md">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">
            Today's habits — tap a checkbox
          </p>
          {HABITS_DEMO.map((h, i) => (
            <DemoCard key={h.id} habit={h} delay={300 + i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
