/**
 * Type definitions for WebContainer API
 * Provides type safety for terminal and container operations
 */

import type { WebContainer, WebContainerProcess, FileSystemTree } from "@webcontainer/api";

// Re-export for convenience
export type { WebContainer, WebContainerProcess, FileSystemTree };

/**
 * Process spawn result
 */
export interface SpawnResult {
  /** The spawned process */
  process: WebContainerProcess;
  /** Exit code when process completes */
  exit: Promise<number>;
}

/**
 * Terminal writer interface
 */
export interface TerminalWriter {
  write: (data: string) => void;
}

/**
 * Terminal input/output stream
 */
export interface TerminalStream {
  /** Write data to the stream */
  write: (data: string) => Promise<void>;
  /** Close the stream */
  close: () => void;
}

/**
 * WebContainer spawn options
 */
export interface SpawnOptions {
  /** Current working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Terminal size */
  terminal?: {
    cols: number;
    rows: number;
  };
}

/**
 * File system operations interface
 */
export interface FileSystemOperations {
  readFile: (path: string, encoding?: "utf-8") => Promise<string>;
  writeFile: (path: string, contents: string) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  rm: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
}

/**
 * WebContainer service state
 */
export type WebContainerState = 
  | "idle"
  | "booting"
  | "ready"
  | "installing"
  | "running"
  | "error";

/**
 * WebContainer event handlers
 */
export interface WebContainerEvents {
  onServerReady?: (port: number, url: string) => void;
  onError?: (error: Error) => void;
  onExit?: (code: number) => void;
}
