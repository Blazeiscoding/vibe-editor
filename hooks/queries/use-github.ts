"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Query keys for GitHub-related queries
export const githubKeys = {
  all: ["github"] as const,
  repos: () => [...githubKeys.all, "repos"] as const,
};

// ============================================
// Types
// ============================================

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  owner?: string;
  default_branch?: string;
}

interface GitHubReposResponse {
  repos: GitHubRepo[];
}

interface GitHubImportResponse {
  success: boolean;
  playgroundId: string;
}

// ============================================
// GitHub Repos Query
// ============================================

export function useGitHubReposQuery(enabled: boolean = true) {
  return useQuery<GitHubReposResponse, Error>({
    queryKey: githubKeys.repos(),
    queryFn: async () => {
      const res = await fetch("/api/github/repos");

      if (res.status === 400) {
        // GitHub not linked - return empty but don't throw
        const data = await res.json();
        if (data.error === "GitHub not linked") {
          throw new Error("GITHUB_NOT_LINKED");
        }
        throw new Error(data.error || "Failed to fetch repositories");
      }

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to fetch repositories");
      }

      return res.json();
    },
    enabled,
    // Keep repos cached for longer since they don't change often
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry if GitHub is not linked
      if (error.message === "GITHUB_NOT_LINKED") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// ============================================
// Import GitHub Repo Mutation
// ============================================

interface ImportRepoInput {
  full_name?: string;
  repoUrl?: string;
}

export function useImportGitHubRepoMutation(options?: {
  onSuccess?: (playgroundId: string) => void;
  onGitHubNotLinked?: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<GitHubImportResponse, Error, ImportRepoInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (res.status === 400) {
        const data = await res.json();
        if (data.error === "GitHub not linked") {
          throw new Error("GITHUB_NOT_LINKED");
        }
        throw new Error(data.error || "Import failed");
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Import failed");
      }

      return res.json();
    },
    onError: (err) => {
      if (err.message === "GITHUB_NOT_LINKED") {
        options?.onGitHubNotLinked?.();
        return;
      }
      toast.error(err.message || "Failed to import repository");
    },
    onSuccess: (data) => {
      toast.success("Repository imported successfully");
      // Invalidate projects to show the new import
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      if (options?.onSuccess) {
        options.onSuccess(data.playgroundId);
      } else {
        // Default: navigate to the playground
        router.push(`/playground/${data.playgroundId}`);
      }
    },
  });
}
