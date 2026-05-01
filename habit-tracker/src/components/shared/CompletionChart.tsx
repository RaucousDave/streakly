import type { Habit, HabitHistoryEntry } from "@/lib/habits.api";
import { COLOR_MAP, fallbackColor } from "@/components/shared/dashboardShared";
import {
  extractIsoDate,
  extractStatus,
  formatIso,
  startOfDay,
} from "@/components/shared/progressShared";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CompletionChartProps {
  habit: Habit;
  history?: HabitHistoryEntry[];
  loading?: boolean;
  error?: boolean;
}

interface ChartPoint {
  iso: string;
  label: string;
  completed: number;
  rate: number;
  status: string;
}

function buildChartData(history: HabitHistoryEntry[] | undefined) {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(start.getDate() - 29);

  const statusByDay = new Map<string, string>();
  for (const entry of history ?? []) {
    const iso = extractIsoDate(entry);
    if (!iso) continue;
    statusByDay.set(iso, extractStatus(entry));
  }

  const points: ChartPoint[] = [];
  const completionWindow: number[] = [];

  for (let cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const iso = formatIso(cursor);
    const status = statusByDay.get(iso) ?? "none";
    const completed = status === "completed" ? 1 : 0;

    completionWindow.push(completed);
    if (completionWindow.length > 7) completionWindow.shift();

    const rate = Math.round(
      (completionWindow.reduce((sum, value) => sum + value, 0) /
        completionWindow.length) *
        100,
    );

    points.push({
      iso,
      label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completed,
      rate,
      status,
    });
  }

  return points;
}

function getChartColor(color: string) {
  if (color === "violet") return "#a78bfa";
  if (color === "sky") return "#38bdf8";
  if (color === "amber") return "#f59e0b";
  if (color === "rose") return "#fb7185";
  return "#34d399";
}

export function CompletionChart({
  habit,
  history,
  loading,
  error,
}: CompletionChartProps) {
  const colors = COLOR_MAP[habit.color] ?? fallbackColor;
  const data = buildChartData(history);
  const chartColor = getChartColor(habit.color);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            <h2 className="text-lg font-semibold text-zinc-100">Completion trend</h2>
          </div>
          <p className="text-sm text-zinc-500">
            Rolling 7-day completion rate for {habit.name}.
          </p>
        </div>
        <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
          {habit.completionRate}% all-time
        </div>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950" />
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          Could not load completion history for this habit.
        </div>
      ) : (
        <div className="h-72 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={`completionGradient-${habit.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={18}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ stroke: chartColor, strokeOpacity: 0.3 }}
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: "12px",
                  color: "#fafafa",
                }}
                formatter={(value) => [`${value ?? 0}%`, "7-day rate"]}
                labelFormatter={(_label, payload) => {
                  const point = payload?.[0]?.payload as ChartPoint | undefined;
                  if (!point) return "";
                  return `${point.label} | ${point.status}`;
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke={chartColor}
                strokeWidth={3}
                fill={`url(#completionGradient-${habit.id})`}
                dot={{ r: 0 }}
                activeDot={{ r: 4, fill: chartColor, stroke: "#09090b", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
