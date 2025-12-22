"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
  user: () => [...settingsKeys.all, "user"] as const,
};

// Types
export interface UserSettings {
  editorFontSize: number;
  editorTabSize: number;
  editorTheme: string;
  autoSave: boolean;
  notifications: boolean;
  minimap: boolean;
  wordWrap: "off" | "on" | "wordWrapColumn";
}

// Default settings
export const defaultSettings: UserSettings = {
  editorFontSize: 14,
  editorTabSize: 2,
  editorTheme: "vs-dark",
  autoSave: true,
  notifications: true,
  minimap: true,
  wordWrap: "off",
};

/**
 * Query hook for fetching user settings
 */
export function useSettingsQuery() {
  return useQuery<UserSettings, Error>({
    queryKey: settingsKeys.user(),
    queryFn: async () => {
      const res = await fetch("/api/settings");

      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in - return defaults
          return defaultSettings;
        }
        throw new Error("Failed to fetch settings");
      }

      const data = await res.json();
      return data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Mutation hook for updating user settings
 */
export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    UserSettings,
    Error,
    Partial<UserSettings>,
    { previous: UserSettings | undefined }
  >({
    mutationFn: async (updates) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update settings");
      }

      const data = await res.json();
      return data.settings;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() });

      // Snapshot previous value
      const previous = queryClient.getQueryData<UserSettings>(
        settingsKeys.user()
      );

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<UserSettings>(settingsKeys.user(), {
          ...previous,
          ...updates,
        });
      }

      return { previous };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.user(), context.previous);
      }
      toast.error(err.message || "Failed to save settings");
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
    },
  });
}
