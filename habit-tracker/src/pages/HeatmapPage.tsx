import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, CalendarDays, ChartSpline } from "lucide-react";
import { authClient } from "@/lib/auth.client";
import { CompletionChart } from "@/components/shared/CompletionChart";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { Heatmap } from "@/components/shared/Heatmap";
import {
  useGetCompletionRate,
  useGetHistory,
  useGetLogs,
  useHabits,
} from "@/lib/habits.api";
import { createSignOutHandler } from "@/components/shared/dashboardShared";

export default function HeatmapPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/protected/dashboard/progress" });
  const { data: session } = authClient.useSession();
  const { data: habits = [], isLoading, isError } = useHabits();

  const selectedHabitId = search.habitId ?? habits[0]?.id ?? "";
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? habits[0];

  const logsQuery = useGetLogs(selectedHabit?.id ?? "");
  const historyQuery = useGetHistory(selectedHabit?.id ?? "");
  const completionRateQuery = useGetCompletionRate(selectedHabit?.id ?? "");
  const completionRate =
    completionRateQuery.data?.completionRate ?? selectedHabit?.completionRate ?? 0;

  useEffect(() => {
    if (!search.habitId && habits[0]?.id) {
      navigate({
        to: "/dashboard/progress",
        search: { habitId: habits[0].id },
        replace: true,
      });
    }
  }, [habits, navigate, search.habitId]);

  const handleSignOut = createSignOutHandler(
    () => authClient.signOut(),
    () => navigate({ to: "/" }),
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardHeader
        userLabel={session?.user?.name ?? session?.user?.email}
        onSignOut={handleSignOut}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <h1 className="text-2xl font-semibold text-zinc-100">Habit progress</h1>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Heatmap history plus completion trend for each habit.
            </p>
          </div>

          {habits.length > 0 && (
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-zinc-600">
                Habit
              </span>
              <select
                value={selectedHabit?.id ?? ""}
                onChange={(event) =>
                  navigate({
                    to: "/dashboard/progress",
                    search: { habitId: event.target.value },
                  })
                }
                className="min-w-56 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500"
              >
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900" />
        ) : isError ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-8 text-sm text-rose-200">
            Failed to load habits for the progress view.
          </div>
        ) : !selectedHabit ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-10 text-center">
            <p className="text-zinc-300">No habits yet.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Add a habit on the dashboard before opening progress.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ChartSpline className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-zinc-100">Snapshot</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Current streak</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-100">{selectedHabit.currentStreak}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Longest streak</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-100">{selectedHabit.longestStreak}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Completed</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-100">{selectedHabit.totalCompleted}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Completion rate</p>
                    <p className="mt-1 text-xl font-semibold text-zinc-100">{completionRate}%</p>
                  </div>
                </div>
              </div>
              <CompletionChart
                habit={selectedHabit}
                history={historyQuery.data}
                completionRate={completionRateQuery.data}
                completionRateLoading={completionRateQuery.isLoading}
                loading={historyQuery.isLoading}
                error={historyQuery.isError}
              />
            </div>
            <Heatmap
              habit={selectedHabit}
              logs={logsQuery.data}
              history={historyQuery.data}
              loading={logsQuery.isLoading || historyQuery.isLoading}
              error={logsQuery.isError || historyQuery.isError}
            />
          </div>
        )}
      </main>
    </div>
  );
}
