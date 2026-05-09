import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type HabitStatus = "completed" | "skipped" | "failed";
export interface Habit {
  id: string;
  name: string;
  minimumInput: string;
  color: string;
  done: boolean;
  deletedAt?: string | null;

  frozen: boolean;
  maximumStreak: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;

  completionRate: number;

  totalSkipped: number;
  totalFailed: number;
  userId: string;
}
export interface User {
  id: string;
  name: string;
  freezesUsed: number;
  freezes: number;
}
export interface CreateHabitPayload {
  name: string;
  minimumInput: string;
  color: string;
}
export interface UpdateHabitPayload {
  name?: string;
  minimumInput?: string;
  color?: string;
  frozen?: boolean;
}
export interface FreezeHabitPayload {
  freezes: number;
  frozen: boolean;
  freezesUsed: number;
}

export interface HabitLogs {
  status: HabitStatus;
}
export interface HabitHistoryEntry {
  id?: string;
  status?: HabitStatus;
  date?: string;
  day?: string;
  logDate?: string;
  entryDate?: string;
  checkedInAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  done?: boolean;
  frozen?: boolean;
}
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;

  completionRate: number;
}
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-type": "application/json",
      ...options?.headers,
    },

    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => {});
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const habitsApi = {
  user: () =>
    apiFetch<{ userData: User }>("/api/user/me").then((r) => r.userData),

  getAll: () =>
    apiFetch<{ habits: Habit[] }>("/api/habits").then((r) => r.habits),
  create: (payload: CreateHabitPayload) =>
    apiFetch<{ habits: Habit[] }>("/api/habits", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => r.habits),

  checkIn: (id: string) =>
    apiFetch<{ habit: Habit }>(`/api/habits/${id}/checkin`, {
      method: "PATCH",
    }).then((r) => r.habit),

  update: (id: string, payload: UpdateHabitPayload) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((r) => r.habits),
  freeze: (id: string, frozen: boolean) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ frozen }),
    }).then((r) => r.habits),
  delete: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "DELETE",
    }),
  history: (id: string) =>
    apiFetch<{ history?: HabitHistoryEntry[]; habits?: HabitHistoryEntry[] }>(
      `/api/habits/${id}/history`,
      {
        method: "GET",
      },
    ).then((r) => r.history ?? r.habits ?? []),

  stats: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}/history`, {
      method: "GET",
    }).then((r) => r.habits),
  logs: (id: string) =>
    apiFetch<{ logs: HabitLogs[] }>(`/api/habits/${id}/logs`, {
      method: "GET",
    }).then((r) => r.logs),
  restore: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}/restore`, {
      method: "PATCH",
    }).then((r) => r.habits),
};

export const habitKeys = {
  all: ["habits"] as const,
  lists: () => [...habitKeys.all, "list"] as const,
  user: () => [...habitKeys.all, "user"] as const,
};

export function useUser() {
  return useQuery({
    queryKey: habitKeys.user(),
    queryFn: habitsApi.user,
  });
}

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.lists(),
    queryFn: habitsApi.getAll,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: habitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: habitsApi.checkIn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });

      const previous = queryClient.getQueryData<Habit[]>(habitKeys.lists());
      queryClient.setQueryData<Habit[]>(habitKeys.lists(), (old) =>
        old?.map((h) =>
          h.id === id
            ? {
                ...h,
                done: true,
              }
            : h,
        ),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateHabitPayload;
    }) => habitsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: habitKeys.all }),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: habitsApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.lists());

      queryClient.setQueryData<Habit[]>(habitKeys.lists(), (old) =>
        old?.map((h) =>
          h.id === id
            ? {
                ...h,
                deletedAt: new Date().toISOString(),
              }
            : h,
        ),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.lists(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useRestore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: habitsApi.restore,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.lists());
      queryClient.setQueryData<Habit[]>(habitKeys.lists(), (old) =>
        old?.map((h) =>
          h.id === id
            ? {
                ...h,
                deletedAt: null,
              }
            : h,
        ),
      );
      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.lists(), context?.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useFreezeHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, frozen }: { id: string; frozen: boolean }) =>
      habitsApi.freeze(id, frozen),
    onMutate: async ({ id, frozen }) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previousHabits = queryClient.getQueryData<Habit[]>(
        habitKeys.lists(),
      );
      const previousUser = queryClient.getQueryData<User>(habitKeys.user());

      queryClient.setQueryData<Habit[]>(habitKeys.lists(), (old) =>
        old?.map((h) =>
          h.id === id
            ? {
                ...h,
                frozen,
              }
            : h,
        ),
      );

      queryClient.setQueryData<User>(habitKeys.user(), (old) =>
        old
          ? {
              ...old,
              freezes: frozen ? Math.max(0, old.freezes - 1) : old.freezes + 1,
              freezesUsed: frozen
                ? old.freezesUsed + 1
                : Math.max(0, old.freezesUsed - 1),
            }
          : old,
      );

      return { previousHabits, previousUser };
    },

    onError(_err, _id, context) {
      if (context?.previousHabits !== undefined) {
        queryClient.setQueryData(habitKeys.lists(), context.previousHabits);
      }
      if (context?.previousUser !== undefined) {
        queryClient.setQueryData(habitKeys.user(), context.previousUser);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useGetLogs(habitId: string) {
  return useQuery({
    queryKey: [...habitKeys.all, "logs", habitId],
    queryFn: async () => await habitsApi.logs(habitId),
    enabled: !!habitId,
  });
}

export function useGetHistory(habitLogsId: string) {
  return useQuery({
    queryKey: [...habitKeys.all, "history", habitLogsId],
    queryFn: async () => await habitsApi.history(habitLogsId),
    enabled: !!habitLogsId,
  });
}
