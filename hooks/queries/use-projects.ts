"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Project } from "@/features/dashboard/types";

// Query keys for cache management
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// ============================================
// Types
// ============================================

interface UpdateProjectInput {
  title: string;
  description?: string;
}

interface MutationContext {
  previousProjects?: Project[];
}

// ============================================
// Update Project Mutation
// ============================================

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { id: string; data: UpdateProjectInput },
    MutationContext
  >({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/dashboard/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update project");
      }

      return res.json();
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.all });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      // Optimistically update the cache
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          projectKeys.lists(),
          previousProjects.map((p) =>
            p.id === id
              ? { ...p, title: data.title, description: data.description ?? p.description }
              : p
          )
        );
      }

      return { previousProjects };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }
      toast.error(err.message || "Failed to update project");
    },
    onSuccess: () => {
      toast.success("Project updated successfully");
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// ============================================
// Delete Project Mutation
// ============================================

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { id: string },
    MutationContext
  >({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/dashboard/projects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete project");
      }

      return res.json();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      // Optimistically remove from cache
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          projectKeys.lists(),
          previousProjects.filter((p) => p.id !== id)
        );
      }

      return { previousProjects };
    },
    onError: (err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }
      toast.error(err.message || "Failed to delete project");
    },
    onSuccess: () => {
      toast.success("Project deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// ============================================
// Duplicate Project Mutation
// ============================================

export function useDuplicateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/dashboard/projects/${id}/duplicate`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to duplicate project");
      }

      return res.json();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to duplicate project");
    },
    onSuccess: () => {
      toast.success("Project duplicated successfully");
    },
    onSettled: () => {
      // Refetch projects list to get the new duplicate
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// ============================================
// Toggle Star Mutation
// ============================================

export function useToggleStarMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; isMarked: boolean },
    Error,
    { playgroundId: string; isMarked: boolean },
    MutationContext
  >({
    mutationFn: async ({ playgroundId, isMarked }) => {
      const res = await fetch("/api/dashboard/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playgroundId, isMarked }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to toggle star");
      }

      return res.json();
    },
    onMutate: async ({ playgroundId, isMarked }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.all });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.lists()
      );

      // Optimistically update star status
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(
          projectKeys.lists(),
          previousProjects.map((p) =>
            p.id === playgroundId
              ? { ...p, Starmark: [{ isMarked }] }
              : p
          )
        );
      }

      return { previousProjects };
    },
    onError: (err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects);
      }
      toast.error(err.message || "Failed to toggle star");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
