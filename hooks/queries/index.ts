// Project hooks
export {
  projectKeys,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useDuplicateProjectMutation,
  useToggleStarMutation,
} from "./use-projects";

// GitHub hooks
export {
  githubKeys,
  useGitHubReposQuery,
  useImportGitHubRepoMutation,
  type GitHubRepo,
} from "./use-github";

// Settings hooks
export {
  settingsKeys,
  useSettingsQuery,
  useUpdateSettingsMutation,
  defaultSettings,
  type UserSettings,
} from "./use-settings";
