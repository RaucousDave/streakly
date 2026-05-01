import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth.client";
import {
  useHabits,
  useCreateHabit,
  useCheckIn,
  useDeleteHabit,
  useFreezeHabit,
  useUser,
} from "@/lib/habits.api";
import { AddHabitModal } from "@/components/shared/AddHabitModal";
import { AddHabitButton } from "@/components/shared/AddHabitButton";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { DashboardSummary } from "@/components/shared/DashboardSummary";
import {
  createAddHabitHandler,
  createSignOutHandler,
} from "@/components/shared/dashboardShared";
import { HabitList } from "@/components/shared/HabitList";
import { MilestonePanel } from "@/components/shared/MilestonePanel";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [showAdd, setShowAdd] = useState(false);

  const { data: habits = [], isLoading, isError } = useHabits();
  const { data: user } = useUser();
  const createHabit = useCreateHabit();
  const checkIn = useCheckIn();
  const deleteHabit = useDeleteHabit();
  const freezeHabit = useFreezeHabit();

  const completedCount = habits.filter((habit) => habit.done).length;
  const totalCount = habits.length;
  const topStreak =
    habits.length > 0 ? Math.max(...habits.map((habit) => habit.currentStreak)) : 0;
  const totalFreezes = user?.freezes ?? 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const handleAdd = createAddHabitHandler(createHabit.mutate, () =>
    setShowAdd(false),
  );
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <DashboardSummary
              userName={session?.user?.name}
              allDone={allDone}
              completedCount={completedCount}
              totalCount={totalCount}
              topStreak={topStreak}
              totalFreezes={totalFreezes}
            />

            {habits.length > 0 && (
              <div className="mb-4 flex justify-end">
                <Link
                  to="/dashboard/progress"
                  search={{ habitId: habits[0]?.id }}
                  className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
                >
                  View progress
                </Link>
              </div>
            )}

            <HabitList
              habits={habits}
              user={user}
              isLoading={isLoading}
              isError={isError}
              freezePending={freezeHabit.isPending}
              onToggle={(id) => checkIn.mutate(id)}
              onDelete={(id) => deleteHabit.mutate(id)}
              onFreeze={(id, frozen) => freezeHabit.mutate({ id, frozen })}
            />

            <AddHabitButton onClick={() => setShowAdd(true)} />
          </section>

          <aside className="min-w-0">
            {(isLoading || habits.length > 0) && (
              <div className="xl:sticky xl:top-20">
                <MilestonePanel habits={habits} loading={isLoading} />
              </div>
            )}
          </aside>
        </div>
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
