import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabitContext } from "@/hooks/HabitContext";

export function AddHabitButton() {
  const { setShowAdd } = useHabitContext();

  return (
    <Button
      onClick={() => setShowAdd(true)}
      variant="outline"
      className="w-full border-dashed border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl h-11 gap-2 transition-all"
    >
      <Plus className="w-4 h-4" aria-hidden="true" />
      Add a habit
    </Button>
  );
}
