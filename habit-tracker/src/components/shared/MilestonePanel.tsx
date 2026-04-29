import { Star, Trophy } from "lucide-react";
import type { Habit } from "@/lib/habits.api";
import {
  buildAggregatedStatsFromHabits,
  MILESTONE_DEFS,
  TIER_STYLES,
} from "@/components/shared/dashboardShared";

interface MilestonePanelProps {
  habits: Habit[];
  loading: boolean;
}

export function MilestonePanel({ habits, loading }: MilestonePanelProps) {
  const aggregated = buildAggregatedStatsFromHabits(habits);
  const earnedCount = MILESTONE_DEFS.filter((milestone) =>
    milestone.earned(aggregated),
  ).length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Milestones
          </h2>
        </div>
        {!loading && (
          <span className="text-xs text-zinc-500 tabular-nums">
            {earnedCount}/{MILESTONE_DEFS.length} earned
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {MILESTONE_DEFS.map((milestone) => {
            const isEarned = milestone.earned(aggregated);
            const tierStyle = TIER_STYLES[milestone.tier];
            const Icon = milestone.icon;

            return (
              <div
                key={milestone.id}
                className={`rounded-xl border p-3 transition-all duration-200 ${
                  isEarned
                    ? `bg-zinc-900 ${tierStyle.glow}`
                    : "bg-zinc-900/40 border-zinc-800/60 opacity-45"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Icon
                    className="w-4 h-4 text-zinc-200 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        isEarned ? "text-zinc-100" : "text-zinc-500"
                      }`}
                    >
                      {milestone.label}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5 leading-snug">
                      {milestone.description}
                    </p>
                    {isEarned && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium mt-1.5 px-1.5 py-0.5 rounded-full border ${tierStyle.badge}`}
                      >
                        <Star className="w-2.5 h-2.5" aria-hidden="true" />
                        {milestone.tier}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
