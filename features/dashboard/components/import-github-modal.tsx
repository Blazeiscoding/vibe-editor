"use client";
import { useMemo, useState } from "react";
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
import { connectGithub } from "@/features/dashboard/actions/connect-github";
import {
  useGitHubReposQuery,
  useImportGitHubRepoMutation,
} from "@/hooks/queries/use-github";
import { Loader2 } from "lucide-react";

interface ImportGithubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportGithubModal({
  open,
  onOpenChange,
}: ImportGithubModalProps) {
  const [tab, setTab] = useState("pick");
  const [url, setUrl] = useState("");
  const [needsGitHubConnect, setNeedsGitHubConnect] = useState(false);

  // TanStack Query hooks
  const {
    data: reposData,
    isLoading: isLoadingRepos,
    error: reposError,
  } = useGitHubReposQuery(open && tab === "pick");

  const importMutation = useImportGitHubRepoMutation({
    onSuccess: () => {
      onOpenChange(false);
    },
    onGitHubNotLinked: () => {
      setNeedsGitHubConnect(true);
    },
  });

  // Check if GitHub is not linked
  const isGitHubNotLinked =
    needsGitHubConnect || reposError?.message === "GITHUB_NOT_LINKED";

  const repos = useMemo(() => reposData?.repos ?? [], [reposData]);

  const sortedRepos = useMemo(() => {
    return repos.slice().sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [repos]);

  const importRepo = (identifier: string) => {
    importMutation.mutate({ full_name: identifier });
  };

  const handleUrlImport = () => {
    if (!url.trim()) return;
    importMutation.mutate({ repoUrl: url.trim() });
  };

  const isLoading = isLoadingRepos || importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
          <DialogDescription>
            Select a repository or paste a URL.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="pick">Your Repos</TabsTrigger>
            <TabsTrigger value="url">By URL</TabsTrigger>
          </TabsList>
          <TabsContent value="pick" className="mt-4">
            {isGitHubNotLinked && (
              <div className="mb-4 border rounded-md p-3">
                <p className="text-sm mb-2">
                  Connect your GitHub account to list your repositories.
                </p>
                <form action={connectGithub}>
                  <Button type="submit" variant="default">
                    Connect GitHub
                  </Button>
                </form>
              </div>
            )}
            {isLoadingRepos && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading repositories...
              </div>
            )}
            {!isLoadingRepos && repos.length === 0 && !isGitHubNotLinked && (
              <div className="text-sm text-muted-foreground">
                No repositories found.
              </div>
            )}
            {!isLoadingRepos && repos.length > 0 && (
              <div className="max-h-80 overflow-auto border rounded-md">
                {sortedRepos.map((r) => (
                  <button
                    key={r.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => importRepo(r.full_name)}
                    disabled={isLoading}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{r.full_name}</span>
                      {r.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {r.description}
                        </span>
                      )}
                    </div>
                    {r.private && (
                      <span className="text-xs rounded bg-muted px-2 py-1">
                        Private
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="url" className="mt-4">
            {isGitHubNotLinked && (
              <div className="mb-4 border rounded-md p-3">
                <p className="text-sm mb-2">
                  Connect your GitHub account to import by URL.
                </p>
                <form action={connectGithub}>
                  <Button type="submit" variant="default">
                    Connect GitHub
                  </Button>
                </form>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/owner/repo or owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button
                onClick={handleUrlImport}
                disabled={isLoading || !url.trim()}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
