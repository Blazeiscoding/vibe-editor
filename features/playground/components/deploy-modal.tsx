"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  ExternalLink,
  CheckCircle,
  Rocket,
  Github,
  ArrowRight,
} from "lucide-react";

interface DeployModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playgroundId: string;
  playgroundTitle: string;
}

type DeployStep = "configure" | "pushing" | "ready";

export function DeployModal({
  open,
  onOpenChange,
  playgroundId,
  playgroundTitle,
}: DeployModalProps) {
  const [step, setStep] = useState<DeployStep>("configure");
  const [repoName, setRepoName] = useState(
    playgroundTitle.toLowerCase().replace(/[^a-z0-9-]/g, "-")
  );
  const [repoUrl, setRepoUrl] = useState("");

  const exportMutation = useMutation({
    mutationFn: async () => {
      setStep("pushing");

      const res = await fetch("/api/github/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playgroundId,
          repoName,
          description: `Deployed from Vibe Editor: ${playgroundTitle}`,
          isPrivate: false,
          branch: "main",
          commitMessage: "Initial commit for Vercel deployment",
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to push to GitHub");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setRepoUrl(data.repoUrl);
      setStep("ready");
      toast.success("Repository created! Ready to deploy.");
    },
    onError: (err: Error) => {
      setStep("configure");
      toast.error(err.message || "Failed to prepare deployment");
    },
  });

  const handleDeploy = () => {
    exportMutation.mutate();
  };

  const handleDeployToVercel = () => {
    // Open Vercel import with the GitHub repo URL
    const vercelUrl = `https://vercel.com/new/import?s=${encodeURIComponent(
      repoUrl
    )}`;
    window.open(vercelUrl, "_blank");
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep("configure");
    setRepoUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deploy to Vercel
          </DialogTitle>
          <DialogDescription>
            Deploy your playground to Vercel in one click.
          </DialogDescription>
        </DialogHeader>

        {step === "configure" && (
          <>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. We&apos;ll push your code to a new GitHub repo</li>
                  <li>2. You&apos;ll be redirected to Vercel</li>
                  <li>3. Authorize Vercel to deploy from GitHub</li>
                  <li>4. Your site will be live in seconds!</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deploy-repo-name">Repository Name</Label>
                <Input
                  id="deploy-repo-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-project"
                />
                <p className="text-xs text-muted-foreground">
                  A new public GitHub repository will be created
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={!repoName || exportMutation.isPending}
              >
                <Github className="mr-2 h-4 w-4" />
                Push to GitHub
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "pushing" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Pushing to GitHub...</p>
              <p className="text-sm text-muted-foreground">
                Creating repository and pushing files
              </p>
            </div>
          </div>
        )}

        {step === "ready" && (
          <>
            <div className="py-6 space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold">Ready to Deploy!</h3>
                <p className="text-sm text-muted-foreground">
                  Your code is now on GitHub. Click below to deploy to Vercel.
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm font-mono truncate">{repoUrl}</span>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleDeployToVercel} className="w-full">
                <Rocket className="mr-2 h-4 w-4" />
                Deploy to Vercel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
