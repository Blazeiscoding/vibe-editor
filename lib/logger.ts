/**
 * Centralized logging utility with namespace support
 * In production, only error logs are shown unless explicitly enabled
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LoggerOptions {
  /** Show logs even in production */
  forceProduction?: boolean;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private namespace: string;
  private forceProduction: boolean;

  constructor(namespace = "App", options: LoggerOptions = {}) {
    this.namespace = namespace;
    this.forceProduction = options.forceProduction ?? false;
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === "error") return true;
    // In development, log everything
    if (this.isDevelopment) return true;
    // In production, only log if forced
    return this.forceProduction;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    const prefix = `[${timestamp}] [${this.namespace}]`;

    const consoleMethod = level === "debug" ? "log" : level;

    if (context) {
      console[consoleMethod](prefix, message, context);
    } else {
      console[consoleMethod](prefix, message);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string, options?: LoggerOptions): Logger {
  return new Logger(namespace, options);
}

// Default logger
export const logger = new Logger();

// Pre-configured loggers for common features
export const loggers = {
  editor: createLogger("Editor"),
  terminal: createLogger("Terminal"),
  webcontainer: createLogger("WebContainer"),
  suggestions: createLogger("AISuggestions"),
  fileExplorer: createLogger("FileExplorer"),
  dashboard: createLogger("Dashboard"),
};
