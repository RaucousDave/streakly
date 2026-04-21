import { authClient } from "@/lib/auth.client";

export const useSession = authClient.useSession;

export function useUser() {
  const { data: session, isPending, error } = authClient.useSession();
  return {
    user: session?.user ?? null,
    isPending,
    error,
  };
}
