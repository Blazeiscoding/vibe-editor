"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Package,
  Search,
  Loader2,
  Plus,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import type { TemplateFolder, TemplateItem } from "@/features/playground/types";
import type { WebContainer } from "@webcontainer/api";

interface PackageManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateData: TemplateFolder | null;
  webContainerInstance: WebContainer | null;
  /** Called after a package is installed/uninstalled with the updated template data */
  onPackageInstalled?: (updatedTemplateData: TemplateFolder) => void;
  /** Callback to save updated template data to database */
  saveTemplateData?: (data: TemplateFolder) => Promise<void>;
}

interface NpmPackage {
  name: string;
  version: string;
  description: string;
  downloads: number;
  publisher?: string;
}

interface InstalledPackage {
  name: string;
  version: string;
  isDev: boolean;
}

// Helper to format download numbers
function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Helper to get installed packages from template data
function getInstalledPackages(
  templateData: TemplateFolder | null
): InstalledPackage[] {
  if (!templateData) return [];

  // Find package.json file
  const findPackageJson = (
    items: TemplateFolder["items"]
  ): string | null => {
    for (const item of items) {
      if ("folderName" in item) {
        const found = findPackageJson(item.items);
        if (found) return found;
      } else if (
        item.filename === "package" &&
        item.fileExtension === "json"
      ) {
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

export function PackageManagerModal({
  open,
  onOpenChange,
  templateData,
  webContainerInstance,
  onPackageInstalled,
  saveTemplateData,
}: PackageManagerModalProps) {
  const [tab, setTab] = useState<"search" | "installed">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [installingPackage, setInstallingPackage] = useState<string | null>(
    null
  );

  // Debounce search query using useEffect
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
      const res = await fetch(
        `/api/npm/search?q=${encodeURIComponent(debouncedQuery)}&limit=15`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Get installed packages
  const installedPackages = getInstalledPackages(templateData);

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
      const updatePackageJson = (
        items: TemplateItem[]
      ): TemplateItem[] => {
        return items.map((item) => {
          if ("folderName" in item) {
            return {
              ...item,
              items: updatePackageJson(item.items),
            };
          } else if (
            item.filename === "package" &&
            item.fileExtension === "json"
          ) {
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

  // Install package via WebContainer
  const handleInstall = async (packageName: string, isDev = false) => {
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
        // Sync the updated package.json to templateData and DB
        const updatedData = await syncPackageJson();
        toast.success(`Installed ${packageName}`);
        // Notify parent with updated data for file explorer sync
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

  // Uninstall package via WebContainer
  const handleUninstall = async (packageName: string) => {
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
        // Sync the updated package.json to templateData and DB
        const updatedData = await syncPackageJson();
        toast.success(`Uninstalled ${packageName}`);
        // Notify parent with updated data for file explorer sync
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

  const isInstalled = (packageName: string) =>
    installedPackages.some((p) => p.name === packageName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Manager
          </DialogTitle>
          <DialogDescription>
            Search and install npm packages for your project.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "search" | "installed")}
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="installed">
              <Download className="mr-2 h-4 w-4" />
              Installed ({installedPackages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] mt-4">
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isSearching && searchResults?.packages.length === 0 && searchQuery && (
                <p className="text-center text-muted-foreground py-8">
                  No packages found
                </p>
              )}

              {!isSearching && !searchQuery && (
                <p className="text-center text-muted-foreground py-8">
                  Type to search for packages
                </p>
              )}

              <div className="space-y-2">
                {searchResults?.packages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.npmjs.com/package/${pkg.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {pkg.name}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          v{pkg.version}
                        </span>
                        {isInstalled(pkg.name) && (
                          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">
                            Installed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {pkg.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Download className="h-3 w-3" />
                        {formatDownloads(pkg.downloads)}/week
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isInstalled(pkg.name) ? "outline" : "default"}
                      onClick={() => handleInstall(pkg.name)}
                      disabled={installingPackage !== null}
                    >
                      {installingPackage === pkg.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isInstalled(pkg.name) ? (
                        "Update"
                      ) : (
                        <>
                          <Plus className="mr-1 h-4 w-4" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="installed" className="mt-4">
            <ScrollArea className="h-[450px]">
              {installedPackages.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No packages installed yet
                </p>
              )}

              <div className="space-y-2">
                {installedPackages.map((pkg) => (
                  <div
                    key={pkg.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`https://www.npmjs.com/package/${pkg.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {pkg.name}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {pkg.version}
                      </span>
                      {pkg.isDev && (
                        <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded">
                          dev
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleUninstall(pkg.name)}
                      disabled={installingPackage !== null}
                    >
                      {installingPackage === pkg.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
