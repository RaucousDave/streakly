import { useState } from "react";
import { ArrowUpRight, Star, Trophy } from "lucide-react";
import {
  buildAggregatedStatsFromHabits,
  COLOR_MAP,
  fallbackColor,
  MILESTONE_DEFS,
  TIER_STYLES,
} from "@/components/shared/dashboardShared";
import type { Habit } from "@/lib/habits.api";
import { useGetCompletionRate } from "@/lib/habits.api";
import { useHabitContext } from "@/hooks/HabitContext";

type MilestoneProgress = {
  id: string;
  label: string;
  description: string;
  current: number;
  target: number;
  remaining: number;
  unit: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  icon: (typeof MILESTONE_DEFS)[number]["icon"];
};

function ProgressRing({
  progress,
  trackColor = "#27272a",
  progressColor = "#facc15",
}: {
  progress: number;
  trackColor?: string;
  progressColor?: string;
}) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="-rotate-90 h-16 w-16" viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          stroke={trackColor}
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          stroke={progressColor}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-zinc-100">
        {clamped}%
      </div>
    </div>
  );
}

function buildMilestoneProgress(habits: Habit[]): MilestoneProgress[] {
  const aggregated = buildAggregatedStatsFromHabits(habits);

  return [
    
    {
      id: "week_warrior",
      label: "Week warrior",
      description: "Reach a 7-day streak on any habit.",
      current: aggregated.topCurrentStreak,
      target: 7,
      remaining: Math.max(0, 7 - aggregated.topCurrentStreak),
      unit: "days",
      tier: "bronze",
      earned: aggregated.topCurrentStreak >= 7 || aggregated.topLongestStreak >= 7,
      icon: MILESTONE_DEFS.find((item) => item.id === "week_warrior")!.icon,
    },
    {
      id: "monthly_master",
      label: "Monthly master",
      description: "Reach a 30-day streak on any habit.",
      current: aggregated.topCurrentStreak,
      target: 30,
      remaining: Math.max(0, 30 - aggregated.topCurrentStreak),
      unit: "days",
      tier: "silver",
      earned: aggregated.topCurrentStreak >= 30 || aggregated.topLongestStreak >= 30,
      icon: MILESTONE_DEFS.find((item) => item.id === "monthly_master")!.icon,
    },
    {
      id: "century_club",
      label: "Century club",
      description: "Reach a 100-day streak on any habit.",
      current: aggregated.topCurrentStreak,
      target: 100,
      remaining: Math.max(0, 100 - aggregated.topCurrentStreak),
      unit: "days",
      tier: "gold",
      earned: aggregated.topCurrentStreak >= 100 || aggregated.topLongestStreak >= 100,
      icon: MILESTONE_DEFS.find((item) => item.id === "century_club")!.icon,
    },
    {
      id: "completionist",
      label: "Completionist",
      description: "Log 50 completed habit entries.",
      current: aggregated.totalCompleted,
      target: 50,
      remaining: Math.max(0, 50 - aggregated.totalCompleted),
      unit: "completions",
      tier: "silver",
      earned: aggregated.totalCompleted >= 50,
      icon: MILESTONE_DEFS.find((item) => item.id === "completionist")!.icon,
    },
    {
      id: "consistency_king",
      label: "Consistency king",
      description: "Hit a 90% completion rate on any habit.",
      current: aggregated.topCompletionRate,
      target: 90,
      remaining: Math.max(0, 90 - aggregated.topCompletionRate),
      unit: "points",
      tier: "gold",
      earned: aggregated.topCompletionRate >= 90,
      icon: MILESTONE_DEFS.find((item) => item.id === "consistency_king")!.icon,
    },
    {
      id: "legend",
      label: "Legend",
      description: "Log 200 completed habit entries.",
      current: aggregated.totalCompleted,
      target: 200,
      remaining: Math.max(0, 200 - aggregated.totalCompleted),
      unit: "completions",
      tier: "platinum",
      earned: aggregated.totalCompleted >= 200,
      icon: MILESTONE_DEFS.find((item) => item.id === "legend")!.icon,
    },
  ];
}

export function MilestonePanel() {
  const { habits, isLoading: loading } = useHabitContext();
  const [trackedHabitId, setTrackedHabitId] = useState("");
  const aggregated = buildAggregatedStatsFromHabits(habits);
  const earnedCount = MILESTONE_DEFS.filter((milestone) =>
    milestone.earned(aggregated),
  ).length;
  const resolvedTrackedHabitId = habits.some((habit) => habit.id === trackedHabitId)
    ? trackedHabitId
    : habits[0]?.id ?? "";
  const trackedHabit =
    habits.find((habit) => habit.id === resolvedTrackedHabitId) ?? habits[0];
  const trackedCompletionRateQuery = useGetCompletionRate(trackedHabit?.id ?? "");
  const trackedCompletionRate =
    trackedCompletionRateQuery.data?.completionRate ?? trackedHabit?.completionRate ?? 0;
  const trackedHabitColors = trackedHabit
    ? COLOR_MAP[trackedHabit.color] ?? fallbackColor
    : fallbackColor;

  const nextMilestones = buildMilestoneProgress(habits)
    .map((milestone) =>
      milestone.id === "consistency_king"
        ? {
            ...milestone,
            current: trackedCompletionRate,
            remaining: Math.max(0, milestone.target - trackedCompletionRate),
            earned: trackedCompletionRate >= milestone.target,
            description: trackedHabit
              ? `Hit a 90% completion rate on ${trackedHabit.name}.`
              : milestone.description,
          }
        : milestone,
    )
    .filter((milestone) => !milestone.earned)
    .sort((left, right) => left.remaining - right.remaining)
    .slice(0, 4);
  const earnedMilestones = MILESTONE_DEFS.filter((milestone) =>
    milestone.earned(aggregated),
  ).slice(0, 3);

  return (
    <aside className="max-h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Next milestones
          </h2>
        </div>
        {!loading && (
          <span className="text-xs text-zinc-500 tabular-nums">
            {earnedCount}/{MILESTONE_DEFS.length} earned
          </span>
        )}
      </div>

      <div className="no-scrollbar max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
        {!loading && earnedMilestones.length > 0 && (
          <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-400" aria-hidden="true" />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Recently earned
            </h3>
          </div>

            <div className="space-y-2">
              {earnedMilestones.map((milestone) => {
                const tierStyle = TIER_STYLES[milestone.tier];
                const Icon = milestone.icon;

                return (
                  <div
                    key={milestone.id}
                    className={`rounded-xl border bg-zinc-950/90 p-3 ${tierStyle.glow}`}
                  >
                    <div className="flex items-start gap-3">
                      <ProgressRing
                        progress={100}
                        trackColor="#27272a"
                        progressColor="#facc15"
                      />
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <Icon
                          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-100"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-zinc-100">
                              {milestone.label}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tierStyle.badge}`}
                            >
                              <Star className="h-2.5 w-2.5" aria-hidden="true" />
                              {milestone.tier}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-2 flex items-center gap-2">
          <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Next up
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950"
              />
            ))}
          </div>
        ) : nextMilestones.length === 0 ? (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <p className="text-sm font-medium text-yellow-100">
              Every tracked milestone is already earned.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-yellow-100/70">
              Keep checking in to push your streaks and totals even further.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {nextMilestones.map((milestone) => {
              const tierStyle = TIER_STYLES[milestone.tier];
              const Icon = milestone.icon;
              const progress = Math.min(
                100,
                Math.round((milestone.current / milestone.target) * 100),
              );
              const isCompletionMilestone = milestone.id === "consistency_king";
              const cardTone = isCompletionMilestone
                ? `${trackedHabitColors.milestoneBg} ${trackedHabitColors.milestoneBorder}`
                : "";
              const ringColor = isCompletionMilestone
                ? trackedHabit?.color === "violet"
                  ? "#a78bfa"
                  : trackedHabit?.color === "sky"
                    ? "#38bdf8"
                    : trackedHabit?.color === "amber"
                      ? "#f59e0b"
                      : trackedHabit?.color === "rose"
                        ? "#fb7185"
                        : "#34d399"
                : "#facc15";

              return (
                <div
                  key={milestone.id}
                  className={`rounded-xl border bg-zinc-950/80 p-3 transition-all duration-200 ${tierStyle.glow} ${cardTone}`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <ProgressRing
                      progress={progress}
                      trackColor="#27272a"
                      progressColor={ringColor}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Icon
                            className="mt-0.5 h-4 w-4 shrink-0 text-zinc-200"
                            aria-hidden="true"
                          />
                          <p className="text-xs font-semibold leading-tight text-zinc-100">
                            {milestone.label}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${tierStyle.badge}`}
                        >
                          <Star className="h-2.5 w-2.5" aria-hidden="true" />
                          {milestone.tier}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">
                        {milestone.description}
                      </p>
                      {isCompletionMilestone && trackedHabit && (
                        <label className="mt-3 block">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            Tracking habit
                          </span>
                          <select
                            value={resolvedTrackedHabitId}
                            onChange={(event) => setTrackedHabitId(event.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500"
                          >
                            {habits.map((habit) => (
                              <option key={habit.id} value={habit.id}>
                                {habit.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-[10px] text-zinc-500">
                            {trackedCompletionRateQuery.isLoading
                              ? "Refreshing completion rate..."
                              : `${trackedCompletionRate}% completion across ${trackedCompletionRateQuery.data?.totalLogs ?? 0} logged days.`}
                          </p>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                        Countdown
                      </p>
                      <p className="mt-1 text-lg font-semibold text-zinc-100">
                        {milestone.remaining} {milestone.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                        Progress
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-300">
                        {milestone.current}/{milestone.target}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2 h-2 rounded-full bg-zinc-900">
                    <div
                      className={`h-2 rounded-full ${tierStyle.badge.split(" ")[1]}`}
                      style={{ width: `${Math.max(6, progress)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{progress}% there</span>
                    <span className="inline-flex items-center gap-1">
                      Next up
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
