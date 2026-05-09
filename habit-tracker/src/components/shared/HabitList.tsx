import { Flame } from "lucide-react";
import { HabitCard } from "@/components/shared/HabitCard";
import { useHabitContext } from "@/hooks/HabitContext";

export function HabitList() {
  const { habits, status, isLoading, isError } = useHabitContext();

  const filteredHabits = habits.filter((habit) => {
    if (status === "Done") return habit.done;
    if (status === "Unchecked") return !habit.done;
    return true;
  });

  return (
    <div className="space-y-3 mb-6">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
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
          <Flame
            className="w-10 h-10 text-zinc-800 mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-zinc-500 font-medium mb-1">No habits yet</p>
          <p className="text-sm text-zinc-600">
            Add your first habit to start your streak.
          </p>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 font-medium mb-1">No matching habits</p>
          <p className="text-sm text-zinc-600">Try a different filter.</p>
        </div>
      ) : (
        filteredHabits.map((habit) => <HabitCard key={habit.id} habit={habit} />)
      )}
    </div>
  );
}
