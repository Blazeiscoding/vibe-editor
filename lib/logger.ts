/**
 * Centralized logging utility
 * In production, logs can be sent to external services (e.g., Sentry, LogRocket)
 */

type LogLevel = "log" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context) {
      if (this.isDevelopment) {
        console[level](logMessage, context);
      } else {
        // In production, send to external service
        // Example: Sentry.captureMessage(logMessage, { level, extra: context });
        console[level](logMessage);
      }
    } else {
      console[level](logMessage);
    }
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

  // Only log in development
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("log", message, context);
    }
  }
}

export const logger = new Logger();

