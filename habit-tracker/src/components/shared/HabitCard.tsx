import { useEffect, useState } from "react";
import { Check, Flame, Pencil, RotateCcw, Snowflake, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type Habit,
  type User,
  useRestore,
  useUpdateHabit,
} from "@/lib/habits.api";
import {
  COLORS,
  COLOR_MAP,
  fallbackColor,
  type HabitColor,
} from "@/components/shared/dashboardShared";

interface HabitCardProps {
  habit: Habit;
  user?: User;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFreeze: (id: string, frozen: boolean) => void;
  freezePending: boolean;
}

export function HabitCard({
  habit,
  user,
  onToggle,
  onDelete,
  onFreeze,
  freezePending,
}: HabitCardProps) {
  const [burst, setBurst] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(habit.name);
  const [draftMinimumInput, setDraftMinimumInput] = useState(habit.minimumInput);
  const [draftColor, setDraftColor] = useState<HabitColor>(
    COLORS.includes(habit.color as HabitColor)
      ? (habit.color as HabitColor)
      : "emerald",
  );
  const restoreHabit = useRestore();
  const updateHabit = useUpdateHabit();
  const colors = COLOR_MAP[habit.color] ?? fallbackColor;
  const freezesLeft = user?.freezes ?? 0;
  const freezesUsed = user?.freezesUsed ?? 0;
  const isDeleted = Boolean(habit.deletedAt);

  const canToggleFreeze = !isDeleted && (habit.frozen || freezesLeft > 0);

  useEffect(() => {
    setDraftName(habit.name);
    setDraftMinimumInput(habit.minimumInput);
    setDraftColor(
      COLORS.includes(habit.color as HabitColor)
        ? (habit.color as HabitColor)
        : "emerald",
    );
  }, [habit.id, habit.name, habit.minimumInput, habit.color]);

  const handleToggle = () => {
    if (isDeleted || isEditing || habit.done) return;

    if (!habit.done) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    onToggle(habit.id);
  };

  const handleFreeze = () => {
    if (!canToggleFreeze || freezePending || isEditing) return;
    onFreeze(habit.id, !habit.frozen);
  };

  const handleRestore = () => {
    if (restoreHabit.isPending) return;
    setConfirmDelete(false);
    restoreHabit.mutate(habit.id);
  };

  const handleEditStart = () => {
    setConfirmDelete(false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setDraftName(habit.name);
    setDraftMinimumInput(habit.minimumInput);
    setDraftColor(
      COLORS.includes(habit.color as HabitColor)
        ? (habit.color as HabitColor)
        : "emerald",
    );
    setIsEditing(false);
  };

  const handleEditSave = () => {
    const name = draftName.trim();
    const minimumInput = draftMinimumInput.trim();

    if (!name || !minimumInput || updateHabit.isPending) return;

    updateHabit.mutate(
      {
        id: habit.id,
        payload: {
          name,
          minimumInput,
          color: draftColor,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  return (
    <Card
      className={`border bg-zinc-900 transition-all duration-200 ${
        isDeleted
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            onClick={handleToggle}
            disabled={isDeleted || isEditing || habit.done}
            className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${colors.ring} ${
              habit.done
                ? `${colors.check} border-transparent`
                : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"
            }`}
            aria-label={habit.done ? "Habit completed" : "Mark habit complete"}
          >
            {habit.done && <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />}
          </Button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="ml-0 space-y-3">
                <div className="space-y-1.5">
                  <Input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Habit name"
                    autoFocus
                    className="h-9 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Input
                    value={draftMinimumInput}
                    onChange={(event) => setDraftMinimumInput(event.target.value)}
                    placeholder="Minimum input"
                    className="h-9 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  {COLORS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDraftColor(option)}
                      className={`w-6 h-6 rounded-full ${COLOR_MAP[option].picker} transition-all duration-150 ${
                        draftColor === option
                          ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-zinc-300 scale-110"
                          : "opacity-50 hover:opacity-80"
                      }`}
                      aria-label={`Set habit color to ${option}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                  <p
                    className={`font-semibold text-sm ${
                      isDeleted
                        ? "text-zinc-500 line-through"
                        : habit.done
                          ? "line-through text-zinc-600"
                          : "text-zinc-100"
                    }`}
                  >
                    {habit.name}
                  </p>
                </div>
                <p className="text-xs text-zinc-500 ml-4 leading-relaxed">
                  {habit.minimumInput}
                </p>
              </>
            )}

            <div className="ml-4 mt-2 flex flex-wrap items-center gap-2">
              {isDeleted ? (
                <span className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/25 rounded-full px-2 py-0.5">
                  <Trash2 className="w-3 h-3" aria-hidden="true" /> Deleted
                </span>
              ) : habit.frozen ? (
                <span className="flex items-center gap-1 text-[11px] text-sky-300 bg-sky-500/15 border border-sky-500/25 rounded-full px-2 py-0.5">
                  <Snowflake className="w-3 h-3" aria-hidden="true" /> Frozen today
                </span>
              ) : freezesLeft > 0 ? (
                <span className="flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5">
                  <Snowflake className="w-3 h-3" aria-hidden="true" />
                  {freezesLeft} freeze{freezesLeft !== 1 ? "s" : ""} left
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div
              className={`flex items-center gap-1 transition-transform duration-300 ${burst ? "scale-125" : "scale-100"}`}
            >
              <Flame className={`w-4 h-4 ${colors.streak}`} aria-hidden="true" />
              <span className={`text-sm font-bold tabular-nums ${colors.streak}`}>
                {habit.currentStreak}
              </span>
            </div>
            <span className="text-[10px] text-zinc-600">day streak</span>

            {isDeleted ? (
              <Button
                onClick={handleRestore}
                disabled={restoreHabit.isPending}
                variant="ghost"
                size="sm"
                className="mt-1 h-7 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
                aria-label="Restore habit"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                {restoreHabit.isPending ? "Restoring..." : "Restore"}
              </Button>
            ) : isEditing ? (
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={handleEditSave}
                  disabled={updateHabit.isPending}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium disabled:text-zinc-600"
                >
                  {updateHabit.isPending ? "Saving..." : "Save"}
                </button>
                <span className="text-zinc-700 text-[11px]">.</span>
                <button
                  onClick={handleEditCancel}
                  disabled={updateHabit.isPending}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 disabled:text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            ) : confirmDelete ? (
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => onDelete(habit.id)}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                >
                  Confirm
                </button>
                <span className="text-zinc-700 text-[11px]">.</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleEditStart}
                  className="text-zinc-700 hover:text-zinc-300 transition-colors"
                  aria-label="Edit habit"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-zinc-700 hover:text-red-400 transition-colors"
                  aria-label="Delete habit"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isDeleted ? (
          <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center justify-between gap-3">
            <p className="text-[11px] leading-relaxed text-amber-100/80">
              This habit was removed from your active list. Restore it if that was accidental.
            </p>
            <Button
              onClick={handleRestore}
              disabled={restoreHabit.isPending}
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              {restoreHabit.isPending ? "Restoring..." : "Undo delete"}
            </Button>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
            <Button
              onClick={handleFreeze}
              disabled={!canToggleFreeze || freezePending || isEditing}
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150 ${
                canToggleFreeze && !freezePending && !isEditing
                  ? habit.frozen
                    ? "text-sky-200 bg-sky-500/15 border-sky-400/30 hover:bg-sky-500/20 hover:border-sky-300/40 cursor-pointer"
                    : "text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 cursor-pointer"
                  : "text-zinc-700 bg-zinc-900 border-zinc-800 cursor-not-allowed"
              }`}
              aria-label={habit.frozen ? "Unfreeze habit for today" : "Freeze habit for today"}
            >
              <Snowflake className="w-3 h-3" aria-hidden="true" />
              {freezePending
                ? "Updating..."
                : isEditing
                  ? "Finish editing"
                : habit.frozen
                  ? "Unfreeze today"
                  : canToggleFreeze
                    ? "Freeze today"
                  : "No freezes left"}
            </Button>
            {isEditing ? (
              <button
                onClick={handleEditCancel}
                disabled={updateHabit.isPending}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 disabled:text-zinc-700"
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Close edit
              </button>
            ) : freezesUsed > 0 && (
              <span className="text-[10px] text-zinc-600">{freezesUsed} used</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
