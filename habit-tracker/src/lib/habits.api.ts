import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Habit {
  id: string;
  name: string;
  minimumInput: string;
  color: string;
  done: boolean;
  freezes: number;
  frozen: boolean;
  maximumStreak: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  freezesUsed: number;
  totalSkipped: number;
  totalFailed: number;
  userId: string;
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

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompleted: number;
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
  getAll: () =>
    apiFetch<{ habits: Habit[] }>("/api/habits").then((r) => r.habits),

  create: (payload: CreateHabitPayload) =>
    apiFetch<{ habits: Habit[] }>("/api/habits", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((r) => r.habits),

  checkIn: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}/checkin`, {
      method: "PATCH",
    }).then((r) => r.habits),

  update: (id: string, payload: UpdateHabitPayload) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((r) => r.habits),
  freeze: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ frozen: true }),
    }).then((r) => r.habits),
  delete: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "DELETE",
    }),
  history: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "GET",
    }).then((r) => r.habits),

  stats: (id: string) =>
    apiFetch<{ stats: HabitStats }>(`/api/habits/${id}/stats`, {
      method: "GET",
    }).then((r) => r.stats),
  logs: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "GET",
    }).then((r) => r.habits),
};

export const habitKeys = {
  all: ["habits"] as const,
};

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.all,
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

      const previous = queryClient.getQueryData<Habit[]>(habitKeys.all);
      queryClient.setQueryData<Habit[]>(habitKeys.all, (old) =>
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
        queryClient.setQueryData(habitKeys.all, context.previous);
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
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.all);

      queryClient.setQueryData<Habit[]>(habitKeys.all, (old) =>
        old?.filter((h) => h.id !== id),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.all, context.previous);
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
    mutationFn: habitsApi.freeze,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previous = queryClient.getQueryData<Habit[]>(habitKeys.all);

      queryClient.setQueryData<Habit[]>(habitKeys.all, (old) =>
        old?.map((h) =>
          h.id === id
            ? {
                ...h,
                frozen: true,
                freezes: h.freezes - 1,
                freezesUsed: h.freezesUsed + 1,
              }
            : h,
        ),
      );

      return { previous };
    },

    onError(_err, _id, context) {
      if (context?.previous) {
        queryClient.setQueryData(habitKeys.all, context.previous);
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

export function useGetStats(habitId: string) {
  return useQuery({
    queryKey: [...habitKeys.all, "stats", habitId],
    queryFn: async () => await habitsApi.stats(habitId),
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
