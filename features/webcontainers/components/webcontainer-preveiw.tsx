/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { TemplateFolder } from "@/features/playground/libs/path-to-json";
import { transformToWebContainerFormat } from "../hooks/transformer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { WebContainer } from "@webcontainer/api";
import { TerminalSkeleton } from "@/components/loading/terminal-skeleton";

// Dynamically import Terminal component with no SSR for code splitting
const TerminalComponent = dynamic(
  () => import("./terminal"),
  { 
    ssr: false, 
    loading: () => <TerminalSkeleton /> 
  }
);

interface WebContainerPreviewProps {
  templateData: TemplateFolder;
  serverUrl: string;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  forceResetup?: boolean; // Optional prop to force re-setup
}

const WebContainerPreview: React.FC<WebContainerPreviewProps> = ({
  templateData,
  error,
  instance,
  isLoading,
  serverUrl,
  writeFileSync,
  forceResetup = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingState, setLoadingState] = useState({
    transforming: false,
    mounting: false,
    installing: false,
    starting: false,
    ready: false,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);

  // Ref to access terminal methods
  const terminalRef = useRef<any>(null);

  // Reset setup state when forceResetup changes
  useEffect(() => {
    if (forceResetup) {
      setIsSetupComplete(false);
      setIsSetupInProgress(false);
      setPreviewUrl("");
      setCurrentStep(0);
      setLoadingState({
        transforming: false,
        mounting: false,
        installing: false,
        starting: false,
        ready: false,
      });
    }
  }, [forceResetup]);

  useEffect(() => {
    async function setupContainer() {
      // Don't run setup if it's already complete or in progress
      if (!instance || isSetupComplete || isSetupInProgress) return;

      try {
        setIsSetupInProgress(true);
        setSetupError(null);

        // Check if server is already running by testing if files are already mounted
        try {
          const packageJsonExists = await instance.fs.readFile(
            "package.json",
            "utf8"
          );
          if (packageJsonExists) {
            // Files are already mounted, just reconnect to existing server
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                "🔄 Reconnecting to existing WebContainer session...\r\n"
              );
            }

            // Check if server is already running
            instance.on("server-ready", (port: number, url: string) => {
              console.log(`Reconnected to server on port ${port} at ${url}`);
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(
                  `🌐 Reconnected to server at ${url}\r\n`
                );
              }
              setPreviewUrl(url);
              setLoadingState((prev) => ({
                ...prev,
                starting: false,
                ready: true,
              }));
              setIsSetupComplete(true);
              setIsSetupInProgress(false);
            });

            setCurrentStep(4);
            setLoadingState((prev) => ({ ...prev, starting: true }));
            return;
          }
        } catch (e) {
          // Files don't exist, proceed with normal setup
        }

        // Step 1: Transform data
        setLoadingState((prev) => ({ ...prev, transforming: true }));
        setCurrentStep(1);

        // Write to terminal
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "🔄 Transforming template data...\r\n"
          );
        }

        // @ts-ignore
        const files = transformToWebContainerFormat(templateData);

        setLoadingState((prev) => ({
          ...prev,
          transforming: false,
          mounting: true,
        }));
        setCurrentStep(2);

        // Step 2: Mount files
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "📁 Mounting files to WebContainer...\r\n"
          );
        }

        await instance.mount(files);

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "✅ Files mounted successfully\r\n"
          );
        }

        setLoadingState((prev) => ({
          ...prev,
          mounting: false,
          installing: true,
        }));
        setCurrentStep(3);

        // Step 3: Install dependencies (skip if node_modules exists)
        let shouldInstall = true;
        try {
          await instance.fs.readdir("node_modules");
          shouldInstall = false;
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "⏭️ Skipping install (node_modules exists)\r\n"
            );
          }
        } catch {}

        // Determine if there are any dependencies at all
        let hasDependencies = true;
        let hasLockfile = false;
        try {
          const pkgRaw = await instance.fs.readFile("package.json", "utf8");
          const pkg = JSON.parse(pkgRaw);
          const deps = Object.keys(pkg.dependencies || {});
          const devDeps = Object.keys(pkg.devDependencies || {});
          hasDependencies = deps.length > 0 || devDeps.length > 0;
        } catch {
          hasDependencies = false;
        }
        try {
          await instance.fs.readFile("package-lock.json", "utf8");
          hasLockfile = true;
        } catch {
          hasLockfile = false;
        }

        if (shouldInstall && hasDependencies) {
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `📦 Installing dependencies using ${
                hasLockfile ? "npm ci" : "npm install"
              }...\r\n`
            );
          }

          // Prefer npm ci when lockfile exists
          const primaryArgs = hasLockfile
            ? [
                "ci",
                "--prefer-offline",
                "--no-audit",
                "--fund=false",
                "--loglevel=warn",
                "--omit=optional",
              ]
            : [
                "install",
                "--prefer-offline",
                "--no-audit",
                "--fund=false",
                "--loglevel=warn",
                "--legacy-peer-deps",
                "--omit=optional",
              ];

          const runInstall = async (args: string[]) => {
            const proc = await instance.spawn("npm", args, {
              env: {
                CI: "true",
                NEXT_TELEMETRY_DISABLED: "1",
                PRISMA_SKIP_POSTINSTALL_GENERATE: "true",
                npm_config_audit: "false",
                npm_config_fund: "false",
              },
            } as any);
            proc.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (terminalRef.current?.writeToTerminal) {
                    terminalRef.current.writeToTerminal(data);
                  }
                },
              })
            );
            return await proc.exit;
          };

          let exitCode = await runInstall(primaryArgs);

          // Fallback: if ci failed, try a regular install
          if (exitCode !== 0 && hasLockfile) {
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                "↩️ npm ci failed, retrying with npm install --legacy-peer-deps...\r\n"
              );
            }
            exitCode = await runInstall([
              "install",
              "--prefer-offline",
              "--no-audit",
              "--fund=false",
              "--loglevel=warn",
              "--legacy-peer-deps",
              "--omit=optional",
            ]);
          }

          if (exitCode !== 0) {
            throw new Error(
              `Failed to install dependencies. Exit code: ${exitCode}`
            );
          }

          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "✅ Dependencies installed successfully\r\n"
            );
          }
        } else if (shouldInstall && !hasDependencies) {
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              "⏭️ Skipping install (no dependencies found)\r\n"
            );
          }
        }

        setLoadingState((prev) => ({
          ...prev,
          installing: false,
          starting: true,
        }));
        setCurrentStep(4);

        // Step 4: Start the server (prefer dev script if available)
        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(
            "🚀 Starting development server...\r\n"
          );
        }

        let scriptToRun = "start";
        try {
          const pkgRaw = await instance.fs.readFile("package.json", "utf8");
          const pkg = JSON.parse(pkgRaw);
          if (pkg?.scripts?.dev) {
            scriptToRun = "dev";
            if (terminalRef.current?.writeToTerminal) {
              terminalRef.current.writeToTerminal(
                "⚙️ Using `npm run dev` for faster startup\r\n"
              );
            }
          }
        } catch {}

        const startProcess = await instance.spawn(
          "npm",
          ["run", scriptToRun, "--silent"],
          {
            env: {
              PORT: "5173",
              HOST: "0.0.0.0",
              BROWSER: "none",
              NEXT_TELEMETRY_DISABLED: "1",
              CHOKIDAR_USEPOLLING: "false",
            },
          } as any
        );

        // Listen for server ready event
        instance.on("server-ready", (port: number, url: string) => {
          console.log(`Server ready on port ${port} at ${url}`);
          if (terminalRef.current?.writeToTerminal) {
            terminalRef.current.writeToTerminal(
              `🌐 Server ready at ${url}\r\n`
            );
          }
          setPreviewUrl(url);
          setLoadingState((prev) => ({
            ...prev,
            starting: false,
            ready: true,
          }));
          setIsSetupComplete(true);
          setIsSetupInProgress(false);
        });

        // Handle start process output - stream to terminal
        startProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (terminalRef.current?.writeToTerminal) {
                terminalRef.current.writeToTerminal(data);
              }
            },
          })
        );
      } catch (err) {
        console.error("Error setting up container:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (terminalRef.current?.writeToTerminal) {
          terminalRef.current.writeToTerminal(`❌ Error: ${errorMessage}\r\n`);
        }

        setSetupError(errorMessage);
        setIsSetupInProgress(false);
        setLoadingState({
          transforming: false,
          mounting: false,
          installing: false,
          starting: false,
          ready: false,
        });
      }
    }

    setupContainer();
  }, [instance, templateData, isSetupComplete, isSetupInProgress]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Don't kill processes or cleanup when component unmounts
      // The WebContainer should persist across component re-mounts
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 rounded-lg bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-medium">Initializing WebContainer</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Setting up the environment for your project...
          </p>
        </div>
      </div>
    );
  }

  if (error || setupError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error</h3>
          </div>
          <p className="text-sm">{error || setupError}</p>
        </div>
      </div>
    );
  }

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepText = (stepIndex: number, label: string) => {
    const isActive = stepIndex === currentStep;
    const isComplete = stepIndex < currentStep;

    return (
      <span
        className={`text-sm font-medium ${
          isComplete
            ? "text-green-600"
            : isActive
            ? "text-blue-600"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {!previewUrl ? (
        <div className="h-full flex flex-col">
          <div className="w-full max-w-md p-6 m-5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm mx-auto">
            <Progress
              value={(currentStep / totalSteps) * 100}
              className="h-2 mb-6"
            />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {getStepIcon(1)}
                {getStepText(1, "Transforming template data")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(2)}
                {getStepText(2, "Mounting files")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(3)}
                {getStepText(3, "Installing dependencies")}
              </div>
              <div className="flex items-center gap-3">
                {getStepIcon(4)}
                {getStepText(4, "Starting development server")}
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="flex-1 p-4">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Preview */}
          <div className="flex-1">
            <iframe
              src={previewUrl}
              className="w-full h-full border-none"
              title="WebContainer Preview"
            />
          </div>

          {/* Terminal at bottom when preview is ready */}
          <div className="h-64 border-t">
            <TerminalComponent
              ref={terminalRef}
              webContainerInstance={instance}
              theme="dark"
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebContainerPreview;
