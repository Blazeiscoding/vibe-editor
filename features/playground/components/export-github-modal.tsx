"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Github,
  Loader2,
  ExternalLink,
  CheckCircle,
  Lock,
  Globe,
} from "lucide-react";

interface ExportGithubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playgroundId: string;
  playgroundTitle: string;
}

interface ExportResult {
  success: boolean;
  repoUrl: string;
  commitUrl: string;
  branch: string;
  filesCount: number;
}

export function ExportGithubModal({
  open,
  onOpenChange,
  playgroundId,
  playgroundTitle,
}: ExportGithubModalProps) {
  const [tab, setTab] = useState<"new" | "existing">("new");
  const [result, setResult] = useState<ExportResult | null>(null);

  // New repo form
  const [repoName, setRepoName] = useState(
    playgroundTitle.toLowerCase().replace(/[^a-z0-9-]/g, "-")
  );
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Existing repo form
  const [existingRepo, setExistingRepo] = useState("");

  // Common options
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState(
    "Export from Vibe Editor"
  );

  const exportMutation = useMutation<ExportResult, Error, void>({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        playgroundId,
        branch,
        commitMessage,
      };

      if (tab === "new") {
        body.repoName = repoName;
        body.description = description;
        body.isPrivate = isPrivate;
      } else {
        body.existingRepo = existingRepo;
      }

      const res = await fetch("/api/github/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Export failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Exported ${data.filesCount} files to GitHub!`);
    },
    onError: (err) => {
      toast.error(err.message || "Export failed");
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  const isValid =
    tab === "new" ? repoName.length > 0 : existingRepo.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Export to GitHub
          </DialogTitle>
          <DialogDescription>
            Push your playground code to a GitHub repository.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Success state
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold">Export Successful!</h3>
              <p className="text-sm text-muted-foreground">
                {result.filesCount} files pushed to {result.branch} branch
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <a
                  href={result.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Repository
                </a>
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "new" | "existing")}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="new">New Repository</TabsTrigger>
                <TabsTrigger value="existing">Existing Repository</TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input
                    id="repo-name"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of your project"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPrivate ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="private">Private Repository</Label>
                  </div>
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="existing" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="existing-repo">Repository</Label>
                  <Input
                    id="existing-repo"
                    value={existingRepo}
                    onChange={(e) => setExistingRepo(e.target.value)}
                    placeholder="owner/repo or GitHub URL"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the repository URL or owner/name format
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commit-message">Commit Message</Label>
                <Input
                  id="commit-message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Export from Vibe Editor"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={!isValid || exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Export to GitHub
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
