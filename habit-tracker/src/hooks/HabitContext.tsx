import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { CreateHabitPayload, Habit, User } from "@/lib/habits.api";

export type HabitStatus = "All" | "Done" | "Unchecked";

export interface HabitContextType {
  status: HabitStatus;
  setStatus: (value: HabitStatus) => void;
  showAdd: boolean;
  setShowAdd: (value: boolean) => void;
  habits: Habit[];
  user?: User;
  isLoading: boolean;
  isError: boolean;
  freezePending: boolean;
  addHabitLoading: boolean;
  userLabel?: string | null;
  userName?: string | null;
  allDone: boolean;
  completedCount: number;
  totalCount: number;
  topStreak: number;
  totalFreezes: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFreeze: (id: string, frozen: boolean) => void;
  onAdd: (payload: CreateHabitPayload) => void;
  onSignOut: () => void | Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: HabitContextType;
}) {
  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabitContext() {
  const context = useContext(HabitContext);

  if (!context) {
    throw new Error("useHabitContext must be used within a HabitProvider");
  }

  return context;
}

export function useOptionalHabitContext() {
  return useContext(HabitContext);
}
