"use client";
import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { connectGithub } from "@/features/dashboard/actions/connect-github";

interface ImportGithubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string | null;
}

export function ImportGithubModal({
  open,
  onOpenChange,
}: ImportGithubModalProps) {
  const [tab, setTab] = useState("pick");
  const [repos, setRepos] = useState<RepoItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [needsGitHubConnect, setNeedsGitHubConnect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open && tab === "pick" && repos === null) {
      setLoading(true);
      fetch("/api/github/repos")
        .then(async (r) => {
          if (r.status === 400) {
            setNeedsGitHubConnect(true);
            return null;
          }
          if (!r.ok) throw new Error(await r.text());
          return r.json();
        })
        .then((d) => {
          if (d) setRepos(d.repos as RepoItem[]);
        })
        .catch(() => toast.error("Failed to load repositories"))
        .finally(() => setLoading(false));
    }
  }, [open, tab, repos]);

  const sortedRepos = useMemo(() => {
    return (repos || [])
      .slice()
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [repos]);

  const importRepo = async (identifier: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: identifier }),
      });
      const data = await res.json();
      if (res.status === 400) {
        setNeedsGitHubConnect(true);
        throw new Error(data?.error || "GitHub not linked");
      }
      if (!res.ok) throw new Error(data?.error || "Import failed");
      toast.success("Repository imported");
      onOpenChange(false);
      router.push(`/playground/${data.playgroundId}`);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url.trim() }),
      });
      const data = await res.json();
      if (res.status === 400) {
        setNeedsGitHubConnect(true);
        throw new Error(data?.error || "GitHub not linked");
      }
      if (!res.ok) throw new Error(data?.error || "Import failed");
      toast.success("Repository imported");
      onOpenChange(false);
      router.push(`/playground/${data.playgroundId}`);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  // server action imported above

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
            {needsGitHubConnect && (
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
            {loading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            {!loading && repos && repos.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No repositories found.
              </div>
            )}
            {!loading && repos && repos.length > 0 && (
              <div className="max-h-80 overflow-auto border rounded-md">
                {sortedRepos.map((r) => (
                  <button
                    key={r.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between"
                    onClick={() => importRepo(r.full_name)}
                    disabled={loading}
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
            {needsGitHubConnect && (
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
                disabled={loading}
              />
              <Button
                onClick={handleUrlImport}
                disabled={loading || !url.trim()}
              >
                Import
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
