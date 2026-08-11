import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CaptionTrack, JobSummary, Media } from "@shared/types";
import { api } from "@/lib/api";
import { accountKey } from "./use-account";

export const mediaKeys = {
  all: ["media"] as const,
  detail: (id: string) => ["media", id] as const,
};

export function useMediaList(enabled = true) {
  return useQuery({ queryKey: mediaKeys.all, queryFn: () => api.get<Media[]>("/media"), enabled });
}

export function useMedia(id: string) {
  return useQuery({ queryKey: mediaKeys.detail(id), queryFn: () => api.get<Media>(`/media/${id}`) });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      setProgress(0);
      return api.upload<Media>("/media", formData, setProgress);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      void queryClient.invalidateQueries({ queryKey: accountKey });
    },
  });

  return { ...mutation, uploadProgress: progress };
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/media/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      void queryClient.invalidateQueries({ queryKey: accountKey });
    },
  });
}

export function useCancelProcessing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/media/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.all }),
  });
}

export function useAddCaption(mediaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { file: File; label: string; language: string }) => {
      const formData = new FormData();
      formData.append("file", input.file);
      formData.append("label", input.label);
      formData.append("language", input.language);
      return api.upload<CaptionTrack>(`/media/${mediaId}/captions`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.detail(mediaId) }),
  });
}

export function useDeleteCaption(mediaId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (captionId: string) => api.delete<void>(`/media/${mediaId}/captions/${captionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaKeys.detail(mediaId) }),
  });
}

export function useMediaJobs(mediaId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["media", mediaId, "jobs"],
    queryFn: () => api.get<JobSummary[]>(`/media/${mediaId}/jobs`),
    enabled,
    refetchInterval: enabled ? 3_000 : false,
  });
}

export function useRenameMedia(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => api.patch<Media>(`/media/${id}`, { title }),
    onSuccess: (media) => {
      queryClient.setQueryData(mediaKeys.detail(id), media);
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

interface PipelineEvent {
  mediaId: string;
  status: Media["status"];
  title: string;
  message: string;
}

/**
 * Keeps the cache in step with the transcoding pipeline. The server pushes a
 * message per stage change, so nothing here polls.
 */
export function usePipelineEvents(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const source = new EventSource("/api/events");

    source.onmessage = (message) => {
      const event = JSON.parse(message.data as string) as PipelineEvent;

      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      void queryClient.invalidateQueries({ queryKey: mediaKeys.detail(event.mediaId) });

      if (event.status === "ready") {
        toast.success(`${event.title} is ready`, { description: event.message });
      }
      if (event.status === "failed") {
        toast.error(`${event.title} could not be processed`, { description: event.message });
      }
    };

    return () => source.close();
  }, [enabled, queryClient]);
}

export const isProcessing = (media: Media) => media.status !== "ready" && media.status !== "failed";
