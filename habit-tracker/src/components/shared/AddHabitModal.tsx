import { useState, type FormEvent } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateHabitPayload } from "@/lib/habits.api";
import { COLORS, COLOR_MAP, type HabitColor } from "@/components/shared/dashboardShared";

interface AddHabitModalProps {
  onClose: () => void;
  onAdd: (payload: CreateHabitPayload) => void;
  loading: boolean;
}

export function AddHabitModal({
  onClose,
  onAdd,
  loading,
}: AddHabitModalProps) {
  const [name, setName] = useState("");
  const [minimumInput, setMinimumInput] = useState("");
  const [color, setColor] = useState<HabitColor>("emerald");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !minimumInput.trim()) return;

    onAdd({
      name: name.trim(),
      minimumInput: minimumInput.trim(),
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md border border-zinc-800 shadow-2xl bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-zinc-100">New habit</h2>
            <button
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label="Close add habit modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-sm">Habit name</Label>
              <Input
                placeholder="e.g. Exercise daily"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-sm">Minimum input</Label>
              <Input
                placeholder="e.g. 2 rounds of push-ups, sit-ups & squats"
                value={minimumInput}
                onChange={(event) => setMinimumInput(event.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:border-emerald-500"
              />
              <p className="text-xs text-zinc-600">
                The least you can do on your worst day and still count it.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-sm">Colour</Label>
              <div className="flex gap-2">
                {COLORS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`w-7 h-7 rounded-full ${COLOR_MAP[option].picker} transition-all duration-150 ${
                      color === option
                        ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-zinc-400 scale-110"
                        : "opacity-50 hover:opacity-80"
                    }`}
                    aria-label={option}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full"
              >
                {loading ? "Adding..." : "Add habit"}
                {!loading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
