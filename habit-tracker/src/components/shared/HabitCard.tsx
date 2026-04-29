import { useState } from "react";
import { Check, Flame, Snowflake, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type Habit,
  type User,
} from "@/lib/habits.api";
import {
  COLOR_MAP,
  fallbackColor,
} from "@/components/shared/dashboardShared";

interface HabitCardProps {
  habit: Habit;
  user?: User;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFreeze: (id: string) => void;
  freezePending: boolean;
}

export function HabitCard({
  habit,
  user,
  onToggle,
  onDelete,
  onFreeze,
  freezePending,
}: HabitCardProps) {
  const [burst, setBurst] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = COLOR_MAP[habit.color] ?? fallbackColor;
  const freezesLeft = user?.freezes ?? 0;
  const freezesUsed = user?.freezesUsed ?? 0;

  const canFreeze = !habit.frozen && freezesLeft > 0;

  const handleToggle = () => {
    if (!habit.done) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    onToggle(habit.id);
  };

  const handleFreeze = () => {
    if (!canFreeze || freezePending) return;
    onFreeze(habit.id);
  };

  return (
    <Card className="border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            onClick={handleToggle}
            className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${colors.ring} ${
              habit.done
                ? `${colors.check} border-transparent`
                : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"
            }`}
            aria-label={habit.done ? "Mark incomplete" : "Mark complete"}
          >
            {habit.done && <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
              <p
                className={`font-semibold text-sm ${habit.done ? "line-through text-zinc-600" : "text-zinc-100"}`}
              >
                {habit.name}
              </p>
            </div>
            <p className="text-xs text-zinc-500 ml-4 leading-relaxed">
              {habit.minimumInput}
            </p>

            <div className="ml-4 mt-2 flex flex-wrap items-center gap-2">
              {habit.frozen ? (
                <span className="flex items-center gap-1 text-[11px] text-sky-300 bg-sky-500/15 border border-sky-500/25 rounded-full px-2 py-0.5">
                  <Snowflake className="w-3 h-3" aria-hidden="true" /> Frozen today
                </span>
              ) : freezesLeft > 0 ? (
                <span className="flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5">
                  <Snowflake className="w-3 h-3" aria-hidden="true" />
                  {freezesLeft} freeze{freezesLeft !== 1 ? "s" : ""} left
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className={`flex items-center gap-1 transition-transform duration-300 ${burst ? "scale-125" : "scale-100"}`}
            >
              <Flame className={`w-4 h-4 ${colors.streak}`} aria-hidden="true" />
              <span className={`text-sm font-bold tabular-nums ${colors.streak}`}>
                {habit.currentStreak}
              </span>
            </div>
            <span className="text-[10px] text-zinc-600">day streak</span>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => onDelete(habit.id)}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                >
                  Confirm
                </button>
                <span className="text-zinc-700 text-[11px]">.</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-zinc-700 hover:text-red-400 transition-colors mt-1"
                aria-label="Delete habit"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {!habit.frozen && (
          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <Button
              onClick={handleFreeze}
              disabled={!canFreeze || freezePending}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150 ${
                canFreeze && !freezePending
                  ? "text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 cursor-pointer"
                  : "text-zinc-700 bg-zinc-900 border-zinc-800 cursor-not-allowed"
              }`}
              aria-label="Freeze habit for today"
            >
              <Snowflake className="w-3 h-3" aria-hidden="true" />
              {freezePending
                ? "Freezing..."
                : canFreeze
                  ? "Freeze today"
                  : "No freezes left"}
            </Button>
            {freezesUsed > 0 && (
              <span className="text-[10px] text-zinc-600">{freezesUsed} used</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
