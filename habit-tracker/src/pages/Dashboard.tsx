import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <DashboardSummary
          userName={session?.user?.name}
          allDone={allDone}
          completedCount={completedCount}
          totalCount={totalCount}
          topStreak={topStreak}
          totalFreezes={totalFreezes}
        />

        <HabitList
          habits={habits}
          user={user}
          isLoading={isLoading}
          isError={isError}
          freezePending={freezeHabit.isPending}
          onToggle={(id) => checkIn.mutate(id)}
          onDelete={(id) => deleteHabit.mutate(id)}
          onFreeze={(id) => freezeHabit.mutate(id)}
        />

        <AddHabitButton onClick={() => setShowAdd(true)} />

        {!isLoading && habits.length > 0 && (
          <MilestonePanel habits={habits} loading={false} />
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
