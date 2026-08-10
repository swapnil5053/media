import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Account, PlanId } from "@shared/types";
import { api } from "@/lib/api";

export const accountKey = ["account"] as const;

export function useAccount() {
  return useQuery({
    queryKey: accountKey,
    queryFn: () => api.get<Account | null>("/auth/me"),
    staleTime: 30_000,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.post<Account>("/auth/signin", input),
    onSuccess: (account) => queryClient.setQueryData(accountKey, account),
  });
}

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string; name: string }) =>
      api.post<Account>("/auth/signup", input),
    onSuccess: (account) => queryClient.setQueryData(accountKey, account),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<void>("/auth/signout"),
    onSuccess: () => {
      queryClient.setQueryData(accountKey, null);
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name?: string; plan?: PlanId }) => api.patch<Account>("/auth/me", input),
    onSuccess: (account) => queryClient.setQueryData(accountKey, account),
  });
}
