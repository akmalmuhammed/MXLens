import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
    [key: string]: any;
}

/**
 * Structured Logger for MXLens Admin
 * Handles console output in development and Sentry reporting in production.
 */
export class Logger {
    static info(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === "development") {
            console.log(`%c[INFO] ${message}`, "color: #3b82f6", context || "");
        } else {
            console.log(`[INFO] ${message}`);
            Sentry.addBreadcrumb({
                category: "log",
                message,
                level: "info",
                data: context,
            });
        }
    }

    static warn(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === "development") {
            console.warn(`%c[WARN] ${message}`, "color: #f59e0b", context || "");
        } else {
            console.warn(`[WARN] ${message}`);
            Sentry.captureMessage(message, {
                level: "warning",
                extra: context,
            });
        }
    }

    static error(message: string, error?: unknown, context?: LogContext) {
        if (process.env.NODE_ENV === "development") {
            console.error(`%c[ERROR] ${message}`, "color: #ef4444", error || "", context || "");
        } else {
            console.error(`[ERROR] ${message}`, error);

            if (error instanceof Error) {
                Sentry.captureException(error, {
                    extra: { message, ...context },
                });
            } else {
                Sentry.captureMessage(message, {
                    level: "error",
                    extra: { error, ...context },
                });
            }
        }
    }

    static debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === "development") {
            // Debug logs only show in dev
            console.debug(`%c[DEBUG] ${message}`, "color: #a8a29e", context || "");
        }
    }
}
