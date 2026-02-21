import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder, TemplateItem } from "../types";
import { searchNpmPackages, NpmPackage } from "@/lib/api/npm";

export interface InstalledPackage {
  name: string;
  version: string;
  isDev: boolean;
}

interface UsePackageManagerProps {
  templateData: TemplateFolder | null;
  webContainerInstance: WebContainer | null;
  saveTemplateData?: (data: TemplateFolder) => Promise<void>;
  onPackageInstalled?: (updatedTemplateData: TemplateFolder) => void;
}

// Helper to get installed packages from template data
function getInstalledPackages(templateData: TemplateFolder | null): InstalledPackage[] {
  if (!templateData) return [];

  // Find package.json file
  const findPackageJson = (items: TemplateFolder["items"]): string | null => {
    for (const item of items) {
      if ("folderName" in item) {
        const found = findPackageJson(item.items);
        if (found) return found;
      } else if (item.filename === "package" && item.fileExtension === "json") {
        return item.content;
      }
    }
    return null;
  };

  const packageJsonContent = findPackageJson(templateData.items);
  if (!packageJsonContent) return [];

  try {
    const parsed = JSON.parse(packageJsonContent);
    const packages: InstalledPackage[] = [];

    if (parsed.dependencies) {
      Object.entries(parsed.dependencies).forEach(([name, version]) => {
        packages.push({ name, version: version as string, isDev: false });
      });
    }

    if (parsed.devDependencies) {
      Object.entries(parsed.devDependencies).forEach(([name, version]) => {
        packages.push({ name, version: version as string, isDev: true });
      });
    }

    return packages;
  } catch {
    return [];
  }
}

export function usePackageManager({
  templateData,
  webContainerInstance,
  saveTemplateData,
  onPackageInstalled,
}: UsePackageManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [installingPackage, setInstallingPackage] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search query
  const { data: searchResults, isLoading: isSearching } = useQuery<{
    packages: NpmPackage[];
  }>({
    queryKey: ["npm-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { packages: [] };
      const packages = await searchNpmPackages(debouncedQuery);
      return { packages };
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const installedPackages = useMemo(() => getInstalledPackages(templateData), [templateData]);

  const isInstalled = useCallback(
    (packageName: string) => installedPackages.some((p) => p.name === packageName),
    [installedPackages]
  );

  // Helper to update package.json in templateData and return the updated data
  const syncPackageJson = async (): Promise<TemplateFolder | null> => {
    if (!webContainerInstance || !templateData) {
      return null;
    }

    try {
      // Read the updated package.json from WebContainer
      const packageJsonContent = await webContainerInstance.fs.readFile(
        "/package.json",
        "utf-8"
      );

      // Update the package.json in templateData
      const updatePackageJson = (items: TemplateItem[]): TemplateItem[] => {
        return items.map((item) => {
          if ("folderName" in item) {
            return {
              ...item,
              items: updatePackageJson(item.items),
            };
          } else if (item.filename === "package" && item.fileExtension === "json") {
            return {
              ...item,
              content: packageJsonContent,
            };
          }
          return item;
        });
      };

      const updatedTemplateData: TemplateFolder = {
        ...templateData,
        items: updatePackageJson(templateData.items),
      };

      // Save to database if callback provided
      if (saveTemplateData) {
        await saveTemplateData(updatedTemplateData);
      }

      return updatedTemplateData;
    } catch (error) {
      console.error("Failed to sync package.json:", error);
      return null;
    }
  };

  const installPackage = async (packageName: string, isDev = false) => {
    if (!webContainerInstance) {
      toast.error("WebContainer not ready. Please wait and try again.");
      return;
    }

    setInstallingPackage(packageName);

    try {
      const args = ["install", packageName];
      if (isDev) args.push("--save-dev");

      const process = await webContainerInstance.spawn("npm", args);

      // Wait for the process to finish
      const exitCode = await process.exit;

      if (exitCode === 0) {
        const updatedData = await syncPackageJson();
        toast.success(`Installed ${packageName}`);
        if (updatedData) {
          onPackageInstalled?.(updatedData);
        }
      } else {
        toast.error(`Failed to install ${packageName}`);
      }
    } catch (error) {
      console.error("Install error:", error);
      toast.error(`Failed to install ${packageName}`);
    } finally {
      setInstallingPackage(null);
    }
  };

  const uninstallPackage = async (packageName: string) => {
    if (!webContainerInstance) {
      toast.error("WebContainer not ready");
      return;
    }

    setInstallingPackage(packageName);

    try {
      const process = await webContainerInstance.spawn("npm", [
        "uninstall",
        packageName,
      ]);
      const exitCode = await process.exit;

      if (exitCode === 0) {
        const updatedData = await syncPackageJson();
        toast.success(`Uninstalled ${packageName}`);
        if (updatedData) {
          onPackageInstalled?.(updatedData);
        }
      } else {
        toast.error(`Failed to uninstall ${packageName}`);
      }
    } catch (error) {
      console.error("Uninstall error:", error);
      toast.error(`Failed to uninstall ${packageName}`);
    } finally {
      setInstallingPackage(null);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    setDebouncedQuery,
    searchResults,
    isSearching,
    installedPackages,
    installingPackage,
    installPackage,
    uninstallPackage,
    isInstalled,
  };
}
