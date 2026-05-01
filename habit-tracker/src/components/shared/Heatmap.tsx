import type { Habit, HabitHistoryEntry, HabitLogs } from "@/lib/habits.api";
import { COLOR_MAP, fallbackColor } from "@/components/shared/dashboardShared";
import {
  type CalendarStatus,
  extractIsoDate,
  extractStatus,
  formatIso,
  startOfDay,
  startOfWeekMonday,
} from "@/components/shared/progressShared";

const WEEKDAY_LABELS = ["Mon", "Wed", "Fri"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface HeatmapProps {
  habit: Habit;
  logs?: HabitLogs[];
  history?: HabitHistoryEntry[];
  loading?: boolean;
  error?: boolean;
}

interface DayCell {
  date: Date;
  iso: string;
  status: CalendarStatus;
  intensity: number;
}

function getCellClass(status: CalendarStatus, intensity: number) {
  if (status === "completed") {
    if (intensity >= 4) return "bg-emerald-400";
    if (intensity === 3) return "bg-emerald-500/90";
    if (intensity === 2) return "bg-emerald-600/80";
    return "bg-emerald-700/70";
  }
  if (status === "frozen") return "bg-sky-600/70";
  if (status === "skipped") return "bg-amber-600/70";
  if (status === "failed") return "bg-rose-700/70";
  return "bg-zinc-800";
}

function getTooltip(day: DayCell) {
  const label = day.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (day.status === "none") return `${label}: no activity`;
  return `${label}: ${day.status}`;
}

function buildHeatmap(history: HabitHistoryEntry[] | undefined, logs: HabitLogs[] | undefined) {
  const today = startOfDay(new Date());
  const end = startOfWeekMonday(today);
  end.setDate(end.getDate() + 6);

  const start = new Date(end);
  start.setDate(start.getDate() - (53 * 7 - 1));

  const dayMap = new Map<string, { status: CalendarStatus; intensity: number }>();

  for (const entry of history ?? []) {
    const iso = extractIsoDate(entry);
    if (!iso) continue;

    const nextStatus = extractStatus(entry);
    const previous = dayMap.get(iso);

    dayMap.set(iso, {
      status: nextStatus,
      intensity:
        nextStatus === "completed"
          ? Math.min(4, (previous?.intensity ?? 0) + 1)
          : 1,
    });
  }

  const cells: DayCell[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const iso = formatIso(cursor);
    const matched = dayMap.get(iso);
    cells.push({
      date: new Date(cursor),
      iso,
      status: matched?.status ?? "none",
      intensity: matched?.intensity ?? 0,
    });
  }

  const weeks: DayCell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  const months = weeks.map((week) => {
    const first = week[0];
    return MONTH_LABELS[first.date.getMonth()];
  });

  const statusCounts = (logs ?? []).reduce(
    (accumulator, log) => {
      accumulator[log.status] += 1;
      return accumulator;
    },
    {
      completed: 0,
      skipped: 0,
      failed: 0,
    },
  );

  return {
    weeks,
    months,
    statusCounts,
  };
}

export function Heatmap({ habit, logs, history, loading, error }: HeatmapProps) {
  const colors = COLOR_MAP[habit.color] ?? fallbackColor;
  const { weeks, months, statusCounts } = buildHeatmap(history, logs);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            <h2 className="text-lg font-semibold text-zinc-100">{habit.name}</h2>
          </div>
          <p className="text-sm text-zinc-500">{habit.minimumInput}</p>
        </div>
        <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
          {habit.currentStreak} day streak
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-400">
          {statusCounts.completed} completed
        </span>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-400">
          {statusCounts.skipped} skipped
        </span>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-zinc-400">
          {statusCounts.failed} failed
        </span>
      </div>

      {loading ? (
        <div className="h-44 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950" />
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          Could not load heatmap history for this habit.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="mb-2 ml-10 grid grid-flow-col auto-cols-[12px] gap-1 text-[10px] text-zinc-600">
              {months.map((month, index) => (
                <span key={`${month}-${index}`} className={index > 0 && months[index - 1] === month ? "opacity-0" : ""}>
                  {month}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="mt-0.5 grid grid-rows-7 gap-1 text-[10px] text-zinc-600">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span key={index} className="h-3">
                    {WEEKDAY_LABELS.includes(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index])
                      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][index]
                      : ""}
                  </span>
                ))}
              </div>

              <div className="grid grid-flow-col auto-cols-[12px] gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-rows-7 gap-1">
                    {week.map((day) => (
                      <div
                        key={day.iso}
                        title={getTooltip(day)}
                        className={`h-3 w-3 rounded-[3px] border border-black/10 ${getCellClass(day.status, day.intensity)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <span className="h-3 w-3 rounded-[3px] bg-zinc-800" />
          <span className="h-3 w-3 rounded-[3px] bg-emerald-700/70" />
          <span className="h-3 w-3 rounded-[3px] bg-emerald-600/80" />
          <span className="h-3 w-3 rounded-[3px] bg-emerald-500/90" />
          <span className="h-3 w-3 rounded-[3px] bg-emerald-400" />
          <span>More</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-sky-600/70" />
            Frozen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-amber-600/70" />
            Skipped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-rose-700/70" />
            Failed
          </span>
        </div>
      </div>
    </section>
  );
}
