import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnalyticsSummary, ShareLink } from "@shared/types";
import { api } from "@/lib/api";

export const shareKeys = {
  forMedia: (mediaId: string) => ["shares", mediaId] as const,
};

export const analyticsKeys = {
  overview: ["analytics", "overview"] as const,
  forMedia: (mediaId: string) => ["analytics", mediaId] as const,
};

export interface CreateShareInput {
  mediaId: string;
  password?: string;
  expiresInHours?: number;
  maxViews?: number;
}

export function useShareLinks(mediaId: string) {
  return useQuery({
    queryKey: shareKeys.forMedia(mediaId),
    queryFn: () => api.get<ShareLink[]>(`/shares/media/${mediaId}`),
  });
}

export function useCreateShareLink(mediaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShareInput) => api.post<ShareLink>("/shares", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shareKeys.forMedia(mediaId) }),
  });
}

export function useRevokeShareLink(mediaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => api.delete<void>(`/shares/${slug}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shareKeys.forMedia(mediaId) }),
  });
}

export type Overview = AnalyticsSummary & { activeLinks: number };

export function useOverview() {
  return useQuery({ queryKey: analyticsKeys.overview, queryFn: () => api.get<Overview>("/analytics/overview") });
}

export function useMediaAnalytics(mediaId: string) {
  return useQuery({
    queryKey: analyticsKeys.forMedia(mediaId),
    queryFn: () => api.get<AnalyticsSummary>(`/analytics/media/${mediaId}`),
  });
}
