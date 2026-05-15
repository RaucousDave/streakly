"use client";
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
import {
  HabitProvider,
  type HabitContextType,
  type HabitStatus,
} from "@/hooks/HabitContext";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
    habits.length > 0
      ? Math.max(...habits.map((habit) => habit.currentStreak))
      : 0;
  const totalFreezes = user?.freezes ?? 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const handleAdd = createAddHabitHandler(createHabit.mutate, () =>
    setShowAdd(false),
  );
  const handleSignOut = createSignOutHandler(
    () => authClient.signOut(),
    () => navigate({ to: "/" }),
  );

  const [habitFilters, setHabitFilters] = useState<HabitStatus>("All");

  const filters: HabitStatus[] = ["All", "Done", "Unchecked"];

  const contextValue: HabitContextType = {
    status: habitFilters,
    setStatus: setHabitFilters,
    showAdd,
    setShowAdd,
    habits,
    user,
    isLoading,
    isError,
    freezePending: freezeHabit.isPending,
    addHabitLoading: createHabit.isPending,
    userLabel: session?.user?.name ?? session?.user?.email,
    userName: session?.user?.name,
    allDone,
    completedCount,
    totalCount,
    topStreak,
    totalFreezes,
    onToggle: (id: string) => checkIn.mutate(id),
    onDelete: (id: string) => deleteHabit.mutate(id),
    onFreeze: (id: string, frozen: boolean) =>
      freezeHabit.mutate({ id, frozen }),
    onAdd: handleAdd,
    onSignOut: handleSignOut,
  };

  return (
    <HabitProvider value={contextValue}>
      <div className="min-h-screen bg-zinc-950">
        <DashboardHeader />

        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0">
              <DashboardSummary />

              {habits.length > 0 && (
                <div className="mb-4 flex justify-between">
                  <Combobox
                    value={habitFilters}
                    onValueChange={(value) =>
                      setHabitFilters(value as HabitStatus)
                    }
                    items={filters}
                  >
                    <ComboboxInput
                      className="text-white"
                      placeholder="Filter habits"
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No items found.</ComboboxEmpty>
                      <ComboboxList className="bg-neutral-900 text-white">
                        {(item: HabitStatus) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              )}

              <HabitList />

              <AddHabitButton />
            </section>

            <aside className="min-w-0">
              {(isLoading || habits.length > 0) && (
                <div className="xl:sticky xl:top-20">
                  <MilestonePanel />
                </div>
              )}
            </aside>
          </div>
        </main>

        {showAdd && <AddHabitModal />}
      </div>
    </HabitProvider>
  );
}
