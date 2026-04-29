import { Flame } from "lucide-react";
import type { Habit, User } from "@/lib/habits.api";
import { HabitCard } from "@/components/shared/HabitCard";

interface HabitListProps {
  habits: Habit[];
  user?: User;
  isLoading: boolean;
  isError: boolean;
  freezePending: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFreeze: (id: string) => void;
}

export function HabitList({
  habits,
  user,
  isLoading,
  isError,
  freezePending,
  onToggle,
  onDelete,
  onFreeze,
}: HabitListProps) {
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
          <p className="text-zinc-500 font-medium mb-1">Failed to load habits</p>
          <p className="text-sm text-zinc-600">
            Check your connection and try refreshing.
          </p>
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <Flame className="w-10 h-10 text-zinc-800 mx-auto mb-3" aria-hidden="true" />
          <p className="text-zinc-500 font-medium mb-1">No habits yet</p>
          <p className="text-sm text-zinc-600">
            Add your first habit to start your streak.
          </p>
        </div>
      ) : (
        habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            user={user}
            onToggle={onToggle}
            onDelete={onDelete}
            onFreeze={onFreeze}
            freezePending={freezePending}
          />
        ))
      )}
    </div>
  );
}
