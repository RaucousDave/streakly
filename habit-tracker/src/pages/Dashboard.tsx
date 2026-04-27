import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth.client";
import {
  useHabits,
  useCreateHabit,
  useCheckIn,
  useDeleteHabit,
  useFreezeHabit,
  useGetStats,
  type Habit,
  type CreateHabitPayload,
} from "@/lib/habits.api";

// ── Icons ──────────────────────────────────────────────────────────────────

function FlameIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.017 0C9.5 4.5 13 7 11 10c-1.5-1-2-3-2-3C6.5 10 5 13.5 5 16a7 7 0 0014 0c0-5.5-4-9-6.983-16z" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SnowflakeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <polyline points="6 6 12 2 18 6" />
      <polyline points="6 18 12 22 18 18" />
      <polyline points="2 8 6 12 2 16" />
      <polyline points="22 8 18 12 22 16" />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function TrophyIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
      <path d="M6 3h12v8a6 6 0 0 1-12 0Z" />
    </svg>
  );
}

function StarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ChevronRightIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────

const COLORS = ["emerald", "violet", "sky", "amber", "rose"] as const;
type HabitColor = (typeof COLORS)[number];

const COLOR_MAP: Record<
  string,
  {
    dot: string;
    ring: string;
    streak: string;
    check: string;
    picker: string;
    milestoneText: string;
    milestoneBg: string;
    milestoneBorder: string;
  }
> = {
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

const fallbackColor = {
  dot: "bg-zinc-500",
  ring: "ring-zinc-500/40",
  streak: "text-zinc-400",
  check: "bg-zinc-500 border-zinc-500",
  picker: "bg-zinc-500",
  milestoneText: "text-zinc-400",
  milestoneBg: "bg-zinc-500/10",
  milestoneBorder: "border-zinc-500/20",
};

// ── Milestone definitions ──────────────────────────────────────────────────

interface AggregatedStats {
  topCurrentStreak: number;
  topLongestStreak: number;
  topCompletionRate: number;
  totalCompleted: number;
}

interface MilestoneDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  earned: (stats: AggregatedStats) => boolean;
}

const MILESTONE_DEFS: MilestoneDef[] = [
  {
    id: "first_flame",
    label: "First flame",
    description: "Complete your first habit",
    icon: "🌱",
    tier: "bronze",
    earned: (s) => s.totalCompleted >= 1,
  },
  {
    id: "week_warrior",
    label: "Week warrior",
    description: "Reach a 7-day streak on any habit",
    icon: "🔥",
    tier: "bronze",
    earned: (s) => s.topCurrentStreak >= 7 || s.topLongestStreak >= 7,
  },
  {
    id: "monthly_master",
    label: "Monthly master",
    description: "Reach a 30-day streak on any habit",
    icon: "🥇",
    tier: "silver",
    earned: (s) => s.topCurrentStreak >= 30 || s.topLongestStreak >= 30,
  },
  {
    id: "century_club",
    label: "Century club",
    description: "Reach a 100-day streak on any habit",
    icon: "🏆",
    tier: "gold",
    earned: (s) => s.topCurrentStreak >= 100 || s.topLongestStreak >= 100,
  },
  {
    id: "completionist",
    label: "Completionist",
    description: "Log 50 completed habit entries",
    icon: "💎",
    tier: "silver",
    earned: (s) => s.totalCompleted >= 50,
  },
  {
    id: "consistency_king",
    label: "Consistency king",
    description: "Achieve 90%+ completion rate on any habit",
    icon: "⭐",
    tier: "gold",
    earned: (s) => s.topCompletionRate >= 90,
  },
  {
    id: "legend",
    label: "Legend",
    description: "Log 200 completed habit entries",
    icon: "🌟",
    tier: "platinum",
    earned: (s) => s.totalCompleted >= 200,
  },
];

const TIER_STYLES: Record<string, { badge: string; glow: string }> = {
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

// ── Habit card (owns its own stats query — hook count is always 1) ─────────

function HabitCard({
  habit,
  onToggle,
  onDelete,
  onFreeze,
  freezePending,
  onStatsReady,
}: {
  habit: Habit;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFreeze: (id: string) => void;
  freezePending: boolean;
  /** Bubble stats up to Dashboard for milestone aggregation */
  onStatsReady?: (
    id: string,
    stats: ReturnType<typeof useGetStats>["data"],
  ) => void;
}) {
  const [burst, setBurst] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const c = COLOR_MAP[habit.color] ?? fallbackColor;

  // ✅ Always called exactly once per HabitCard instance — no Rules-of-Hooks violation
  const { data: stats } = useGetStats(habit.id);

  // Bubble stats up whenever they arrive
  if (onStatsReady && stats !== undefined) {
    onStatsReady(habit.id, stats);
  }

  const canFreeze = !habit.frozen && habit.freezes > 0;

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
          {/* Checkbox */}
          <Button
            onClick={handleToggle}
            className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${c.ring} ${
              habit.done
                ? `${c.check} border-transparent`
                : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"
            }`}
            aria-label={habit.done ? "Mark incomplete" : "Mark complete"}
          >
            {habit.done && <CheckIcon className="w-3.5 h-3.5 text-white" />}
          </Button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
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
                  <SnowflakeIcon className="w-3 h-3" /> Frozen today
                </span>
              ) : habit.freezes > 0 ? (
                <span className="flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5">
                  <SnowflakeIcon className="w-3 h-3" />
                  {habit.freezes} freeze{habit.freezes !== 1 ? "s" : ""} left
                </span>
              ) : null}
            </div>
          </div>

          {/* Streak + delete */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className={`flex items-center gap-1 transition-transform duration-300 ${burst ? "scale-125" : "scale-100"}`}
            >
              <FlameIcon className={`w-4 h-4 ${c.streak}`} />
              <span className={`text-sm font-bold tabular-nums ${c.streak}`}>
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
                <span className="text-zinc-700 text-[11px]">·</span>
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
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Freeze action row */}
        {!habit.frozen && (
          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={handleFreeze}
              disabled={!canFreeze || freezePending}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150 ${
                canFreeze && !freezePending
                  ? "text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 cursor-pointer"
                  : "text-zinc-700 bg-zinc-900 border-zinc-800 cursor-not-allowed"
              }`}
              aria-label="Freeze habit for today"
            >
              <SnowflakeIcon className="w-3 h-3" />
              {freezePending
                ? "Freezing…"
                : canFreeze
                  ? "Freeze today"
                  : "No freezes left"}
            </button>
            {habit.freezesUsed > 0 && (
              <span className="text-[10px] text-zinc-600">
                {habit.freezesUsed} used
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Milestone panel (receives pre-aggregated stats from Dashboard) ──────────

function MilestonePanel({
  aggregated,
  loading,
}: {
  aggregated: AggregatedStats;
  loading: boolean;
}) {
  const earnedCount = MILESTONE_DEFS.filter((m) => m.earned(aggregated)).length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-4 h-4 text-yellow-500" />
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
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {MILESTONE_DEFS.map((ms) => {
            const isEarned = ms.earned(aggregated);
            const tier = TIER_STYLES[ms.tier];
            return (
              <div
                key={ms.id}
                className={`rounded-xl border p-3 transition-all duration-200 ${
                  isEarned
                    ? `bg-zinc-900 ${tier.glow}`
                    : "bg-zinc-900/40 border-zinc-800/60 opacity-45"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-lg leading-none mt-0.5">{ms.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold leading-tight ${isEarned ? "text-zinc-100" : "text-zinc-500"}`}
                    >
                      {ms.label}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5 leading-snug">
                      {ms.description}
                    </p>
                    {isEarned && (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium mt-1.5 px-1.5 py-0.5 rounded-full border ${tier.badge}`}
                      >
                        <StarIcon className="w-2.5 h-2.5" />
                        {ms.tier}
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

// ── Add habit modal ────────────────────────────────────────────────────────

function AddHabitModal({
  onClose,
  onAdd,
  loading,
}: {
  onClose: () => void;
  onAdd: (payload: CreateHabitPayload) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [minimumInput, setMinimumInput] = useState("");
  const [color, setColor] = useState<HabitColor>("emerald");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !minimumInput.trim()) return;
    onAdd({ name: name.trim(), minimumInput: minimumInput.trim(), color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md border border-zinc-800 shadow-2xl bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-zinc-100">New habit</h2>
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-400 text-xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-sm">Habit name</Label>
              <Input
                placeholder="e.g. Exercise daily"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-sm">Minimum input</Label>
              <Input
                placeholder="e.g. 2 rounds of push-ups, sit-ups & squats"
                value={minimumInput}
                onChange={(e) => setMinimumInput(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:border-emerald-500"
              />
              <p className="text-xs text-zinc-600">
                The least you can do on your worst day and still count it.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-sm">Colour</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full ${COLOR_MAP[c].picker} transition-all duration-150 ${color === c ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-zinc-400 scale-110" : "opacity-50 hover:opacity-80"}`}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full"
              >
                {loading ? "Adding…" : "Add habit →"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [showAdd, setShowAdd] = useState(false);

  // statsMap accumulates { [habitId]: stats } as HabitCards report in
  const [statsMap, setStatsMap] = useState<
    Record<string, ReturnType<typeof useGetStats>["data"]>
  >({});

  const { data: habits = [], isLoading, isError } = useHabits();
  const createHabit = useCreateHabit();
  const checkIn = useCheckIn();
  const deleteHabit = useDeleteHabit();
  const freezeHabit = useFreezeHabit();

  const completedCount = habits.filter((h) => h.done).length;
  const totalCount = habits.length;
  const topStreak =
    habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0;
  const totalFreezes = habits.reduce((a, h) => a + h.freezes, 0);
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Aggregate stats from whatever HabitCards have reported so far
  const aggregated: AggregatedStats = Object.values(statsMap).reduce(
    (acc, s) => {
      if (!s) return acc;
      return {
        topCurrentStreak: Math.max(acc.topCurrentStreak, s.currentStreak ?? 0),
        topLongestStreak: Math.max(acc.topLongestStreak, s.longestStreak ?? 0),
        topCompletionRate: Math.max(
          acc.topCompletionRate,
          s.completionRate ?? 0,
        ),
        totalCompleted: acc.totalCompleted + (s.totalCompleted ?? 0),
      };
    },
    {
      topCurrentStreak: 0,
      topLongestStreak: 0,
      topCompletionRate: 0,
      totalCompleted: 0,
    },
  );

  const statsLoading =
    habits.length > 0 && Object.keys(statsMap).length < habits.length;

  const handleStatsReady = (
    id: string,
    stats: ReturnType<typeof useGetStats>["data"],
  ) => {
    setStatsMap((prev) =>
      prev[id] === stats ? prev : { ...prev, [id]: stats },
    );
  };

  const handleAdd = (payload: CreateHabitPayload) => {
    createHabit.mutate(payload, { onSuccess: () => setShowAdd(false) });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <FlameIcon className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-zinc-100 tracking-tight">
              Streakly
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 hidden sm:block">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-zinc-500 hover:text-zinc-700 hover:bg-neutral-100 text-sm"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-1">
            {formatToday()}
          </p>
          <h1 className="text-2xl font-bold text-zinc-100">
            {allDone
              ? "All done for today 🎉"
              : `${getGreeting()}, ${session?.user?.name?.split(" ")[0] ?? "there"}.`}
          </h1>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: `${completedCount}/${totalCount}`, sub: "habits done" },
            { value: `${topStreak}`, sub: "day streak" },
            { value: `${totalFreezes}`, sub: "freezes left" },
          ].map((s) => (
            <div
              key={s.sub}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
            >
              <p className="text-xl font-bold text-zinc-100 tabular-nums">
                {s.value}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5 leading-tight">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="mb-6">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((completedCount / totalCount) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Habit list */}
        <div className="space-y-3 mb-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-zinc-500 font-medium mb-1">
                Failed to load habits
              </p>
              <p className="text-sm text-zinc-600">
                Check your connection and try refreshing.
              </p>
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-16">
              <FlameIcon className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium mb-1">No habits yet</p>
              <p className="text-sm text-zinc-600">
                Add your first habit to start your streak.
              </p>
            </div>
          ) : (
            habits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={(id) => checkIn.mutate(id)}
                onDelete={(id) => deleteHabit.mutate(id)}
                onFreeze={(id) => freezeHabit.mutate(id)}
                freezePending={freezeHabit.isPending}
                onStatsReady={handleStatsReady}
              />
            ))
          )}
        </div>

        {/* Add habit button */}
        <Button
          onClick={() => setShowAdd(true)}
          variant="outline"
          className="w-full border-dashed border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl h-11 gap-2 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Add a habit
        </Button>

        {/* Milestones */}
        {!isLoading && habits.length > 0 && (
          <MilestonePanel aggregated={aggregated} loading={statsLoading} />
        )}
      </main>

      {showAdd && (
        <AddHabitModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          loading={createHabit.isPending}
        />
      )}
    </div>
  );
}
