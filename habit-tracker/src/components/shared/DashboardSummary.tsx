import { formatToday, getGreeting } from "@/components/shared/dashboardShared";
import { useHabitContext } from "@/hooks/HabitContext";

export function DashboardSummary() {
  const {
    userName,
    allDone,
    completedCount,
    totalCount,
    topStreak,
    totalFreezes,
  } = useHabitContext();

  const firstName = userName?.split(" ")[0] ?? "there";
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-1">
          {formatToday()}
        </p>
        <h1 className="text-2xl font-bold text-zinc-100">
          {allDone ? "All done for today" : `${getGreeting()}, ${firstName}.`}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: `${completedCount}/${totalCount}`, sub: "habits done" },
          { value: `${topStreak}`, sub: "day streak" },
          { value: `${totalFreezes}`, sub: "freezes left" },
        ].map((stat) => (
          <div
            key={stat.sub}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
          >
            <p className="text-xl font-bold text-zinc-100 tabular-nums">
              {stat.value}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5 leading-tight">
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {totalCount > 0 && (
        <div className="mb-6">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
