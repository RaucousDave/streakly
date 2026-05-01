import type { HabitHistoryEntry } from "@/lib/habits.api";

const DATE_KEYS = [
  "date",
  "day",
  "logDate",
  "entryDate",
  "checkedInAt",
  "completedAt",
  "createdAt",
  "updatedAt",
] as const;

export type CalendarStatus = "none" | "completed" | "frozen" | "skipped" | "failed";

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function startOfWeekMonday(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function extractIsoDate(entry: HabitHistoryEntry) {
  for (const key of DATE_KEYS) {
    const value = entry[key];
    if (typeof value === "string") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return formatIso(parsed);
      }
    }
  }
  return null;
}

export function extractStatus(entry: HabitHistoryEntry): Exclude<CalendarStatus, "none"> {
  if (entry.status) return entry.status;
  if (entry.frozen) return "frozen";
  if (entry.done) return "completed";
  return "failed";
}
