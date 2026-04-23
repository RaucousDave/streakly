import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Habit {
  id: string;
  name: string;
  minimumInput: string;
  color: string;
  done: boolean;
  freezes: number;
  maximumStreak: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
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

  delete: (id: string) =>
    apiFetch<{ habits: Habit[] }>(`/api/habits/${id}`, {
      method: "DELETE",
    }),
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
                done: !h.done,
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
