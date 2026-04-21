import { useState } from "react";
import { COLOR_MAP } from "./colorMap";
import { Card, CardContent } from "../ui/card";
import { Flame, Check } from "lucide-react";

// ── Animated demo card ─────────────────────────────────────────────────────

export function DemoCard({ habit, delay = 0 }) {
  const [checked, setChecked] = useState(habit.done);
  const [streak, setStreak] = useState(habit.streak);
  const [burst, setBurst] = useState(false);
  const c = COLOR_MAP[habit.color];

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    if (next) {
      setStreak((s) => s + 1);
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    } else {
      setStreak((s) => Math.max(0, s - 1));
    }
  };

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 bg-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                <p className="font-semibold text-zinc-100 text-sm truncate">
                  {habit.name}
                </p>
              </div>
              <p className="text-xs text-zinc-400 ml-4 leading-relaxed">
                {habit.minimum}
              </p>
            </div>

            {/* Streak pill */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`flex items-center gap-1 transition-transform duration-300 ${
                  burst ? "scale-125" : "scale-100"
                }`}
              >
                <Flame className={`w-4 h-4 ${c.streak}`} />
                <span className={`text-sm font-bold tabular-nums ${c.streak}`}>
                  {streak}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">day streak</span>
            </div>

            {/* Checkbox */}
            <button
              onClick={toggle}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 ${c.ring} ${
                checked
                  ? `${c.check} border-transparent`
                  : "border-emerald-300  hover:border-emerald-400"
              }`}
              aria-label={checked ? "Mark incomplete" : "Mark complete"}
            >
              {checked && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
