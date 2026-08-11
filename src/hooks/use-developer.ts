import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiKey, SystemStatus, Webhook } from "@shared/types";
import { api } from "@/lib/api";

const keys = {
  apiKeys: ["developer", "keys"] as const,
  webhooks: ["developer", "webhooks"] as const,
  system: ["system", "status"] as const,
};

export function useApiKeys() {
  return useQuery({ queryKey: keys.apiKeys, queryFn: () => api.get<ApiKey[]>("/developer/keys") });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.post<ApiKey>("/developer/keys", { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.apiKeys }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/developer/keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.apiKeys }),
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: keys.webhooks,
    queryFn: () => api.get<Webhook[]>("/developer/webhooks"),
    refetchInterval: 15_000,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => api.post<Webhook>("/developer/webhooks", { url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.webhooks }),
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/developer/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.webhooks }),
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: keys.system,
    queryFn: () => api.get<SystemStatus>("/system/status"),
    refetchInterval: 4_000,
  });
}
