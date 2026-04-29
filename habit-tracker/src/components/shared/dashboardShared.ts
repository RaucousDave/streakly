import type { LucideIcon } from "lucide-react";
import {
  Award,
  Flame,
  Gem,
  Medal,
  Sprout,
  Star,
  Trophy,
} from "lucide-react";
import type { CreateHabitPayload, Habit, HabitStats } from "@/lib/habits.api";

export const COLORS = ["emerald", "violet", "sky", "amber", "rose"] as const;

export type HabitColor = (typeof COLORS)[number];

export type DashboardColorStyles = {
  dot: string;
  ring: string;
  streak: string;
  check: string;
  picker: string;
  milestoneText: string;
  milestoneBg: string;
  milestoneBorder: string;
};

export const COLOR_MAP: Record<string, DashboardColorStyles> = {
  emerald: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/40",
    streak: "text-emerald-400",
    check: "bg-emerald-500 border-emerald-500",
    picker: "bg-emerald-500",
    milestoneText: "text-emerald-400",
    milestoneBg: "bg-emerald-500/10",
    milestoneBorder: "border-emerald-500/20",
  },
  violet: {
    dot: "bg-violet-500",
    ring: "ring-violet-500/40",
    streak: "text-violet-400",
    check: "bg-violet-500 border-violet-500",
    picker: "bg-violet-500",
    milestoneText: "text-violet-400",
    milestoneBg: "bg-violet-500/10",
    milestoneBorder: "border-violet-500/20",
  },
  sky: {
    dot: "bg-sky-500",
    ring: "ring-sky-500/40",
    streak: "text-sky-400",
    check: "bg-sky-500 border-sky-500",
    picker: "bg-sky-500",
    milestoneText: "text-sky-400",
    milestoneBg: "bg-sky-500/10",
    milestoneBorder: "border-sky-500/20",
  },
  amber: {
    dot: "bg-amber-500",
    ring: "ring-amber-500/40",
    streak: "text-amber-400",
    check: "bg-amber-500 border-amber-500",
    picker: "bg-amber-500",
    milestoneText: "text-amber-400",
    milestoneBg: "bg-amber-500/10",
    milestoneBorder: "border-amber-500/20",
  },
  rose: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/40",
    streak: "text-rose-400",
    check: "bg-rose-500 border-rose-500",
    picker: "bg-rose-500",
    milestoneText: "text-rose-400",
    milestoneBg: "bg-rose-500/10",
    milestoneBorder: "border-rose-500/20",
  },
};

export const fallbackColor: DashboardColorStyles = {
  dot: "bg-zinc-500",
  ring: "ring-zinc-500/40",
  streak: "text-zinc-400",
  check: "bg-zinc-500 border-zinc-500",
  picker: "bg-zinc-500",
  milestoneText: "text-zinc-400",
  milestoneBg: "bg-zinc-500/10",
  milestoneBorder: "border-zinc-500/20",
};

export interface AggregatedStats {
  topCurrentStreak: number;
  topLongestStreak: number;
  topCompletionRate: number;
  totalCompleted: number;
}

export interface MilestoneDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tier: "bronze" | "silver" | "gold" | "platinum";
  earned: (stats: AggregatedStats) => boolean;
}

export const MILESTONE_DEFS: MilestoneDef[] = [
  {
    id: "first_flame",
    label: "First flame",
    description: "Complete your first habit",
    icon: Sprout,
    tier: "bronze",
    earned: (stats) => stats.totalCompleted >= 1,
  },
  {
    id: "week_warrior",
    label: "Week warrior",
    description: "Reach a 7-day streak on any habit",
    icon: Flame,
    tier: "bronze",
    earned: (stats) =>
      stats.topCurrentStreak >= 7 || stats.topLongestStreak >= 7,
  },
  {
    id: "monthly_master",
    label: "Monthly master",
    description: "Reach a 30-day streak on any habit",
    icon: Medal,
    tier: "silver",
    earned: (stats) =>
      stats.topCurrentStreak >= 30 || stats.topLongestStreak >= 30,
  },
  {
    id: "century_club",
    label: "Century club",
    description: "Reach a 100-day streak on any habit",
    icon: Trophy,
    tier: "gold",
    earned: (stats) =>
      stats.topCurrentStreak >= 100 || stats.topLongestStreak >= 100,
  },
  {
    id: "completionist",
    label: "Completionist",
    description: "Log 50 completed habit entries",
    icon: Gem,
    tier: "silver",
    earned: (stats) => stats.totalCompleted >= 50,
  },
  {
    id: "consistency_king",
    label: "Consistency king",
    description: "Achieve 90%+ completion rate on any habit",
    icon: Star,
    tier: "gold",
    earned: (stats) => stats.topCompletionRate >= 90,
  },
  {
    id: "legend",
    label: "Legend",
    description: "Log 200 completed habit entries",
    icon: Award,
    tier: "platinum",
    earned: (stats) => stats.totalCompleted >= 200,
  },
];

export const TIER_STYLES: Record<string, { badge: string; glow: string }> = {
  bronze: {
    badge: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    glow: "border-amber-500/30",
  },
  silver: {
    badge: "text-zinc-300 bg-zinc-400/10 border-zinc-400/20",
    glow: "border-zinc-400/30",
  },
  gold: {
    badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    glow: "border-yellow-500/30",
  },
  platinum: {
    badge: "text-sky-300 bg-sky-400/10 border-sky-400/20",
    glow: "border-sky-400/40",
  },
};

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function buildAggregatedStats(
  statsMap: Record<string, HabitStats | undefined>,
): AggregatedStats {
  return Object.values(statsMap).reduce(
    (accumulator, stats) => {
      if (!stats) return accumulator;

      return {
        topCurrentStreak: Math.max(
          accumulator.topCurrentStreak,
          stats.currentStreak ?? 0,
        ),
        topLongestStreak: Math.max(
          accumulator.topLongestStreak,
          stats.longestStreak ?? 0,
        ),
        topCompletionRate: Math.max(
          accumulator.topCompletionRate,
          stats.completionRate ?? 0,
        ),
        totalCompleted: accumulator.totalCompleted + (stats.totalCompleted ?? 0),
      };
    },
    {
      topCurrentStreak: 0,
      topLongestStreak: 0,
      topCompletionRate: 0,
      totalCompleted: 0,
    },
  );
}

export function buildAggregatedStatsFromHabits(habits: Habit[]): AggregatedStats {
  return habits.reduce(
    (accumulator, habit) => ({
      topCurrentStreak: Math.max(
        accumulator.topCurrentStreak,
        habit.currentStreak ?? 0,
      ),
      topLongestStreak: Math.max(
        accumulator.topLongestStreak,
        habit.longestStreak ?? 0,
      ),
      topCompletionRate: Math.max(
        accumulator.topCompletionRate,
        habit.completionRate ?? 0,
      ),
      totalCompleted: accumulator.totalCompleted + (habit.totalCompleted ?? 0),
    }),
    {
      topCurrentStreak: 0,
      topLongestStreak: 0,
      topCompletionRate: 0,
      totalCompleted: 0,
    },
  );
}

export function createAddHabitHandler(
  mutate: (
    payload: CreateHabitPayload,
    options?: { onSuccess?: () => void },
  ) => void,
  closeModal: () => void,
) {
  return (payload: CreateHabitPayload) => {
    mutate(payload, { onSuccess: closeModal });
  };
}

export function createSignOutHandler(
  signOut: () => Promise<unknown>,
  navigateHome: () => void,
) {
  return async () => {
    await signOut();
    navigateHome();
  };
}
