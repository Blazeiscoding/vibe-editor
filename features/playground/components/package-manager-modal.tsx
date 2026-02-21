"use client";

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
import {
  Package,
  Search,
  Loader2,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import type { TemplateFolder } from "@/features/playground/types";
import type { WebContainer } from "@webcontainer/api";
import { usePackageManager } from "../hooks/use-package-manager";

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

// Helper to format download numbers
function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function PackageManagerModal({
  open,
  onOpenChange,
  templateData,
  webContainerInstance,
  onPackageInstalled,
  saveTemplateData,
}: PackageManagerModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    installedPackages,
    installingPackage,
    installPackage,
    uninstallPackage,
    isInstalled,
  } = usePackageManager({
    templateData,
    webContainerInstance,
    saveTemplateData,
    onPackageInstalled,
  });

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

        <Tabs defaultValue="search">
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

              {!isSearching &&
                searchResults?.packages.length === 0 &&
                searchQuery && (
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
                      onClick={() => installPackage(pkg.name)}
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
                      onClick={() => uninstallPackage(pkg.name)}
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

