import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment and release tracking for alerting
    environment: process.env.NODE_ENV || "development",

    // Performance Monitoring - sample 20% of transactions
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Capture all uncaught errors
    debug: process.env.NODE_ENV !== "production",

    // Custom tags for alert filtering
    initialScope: {
        tags: {
            "app.component": "server",
            "app.name": "mxlens"
        }
    },

    // Before sending, add performance context
    beforeSend(event) {
        // Add server-specific context
        event.contexts = {
            ...event.contexts,
            runtime: {
                name: "node",
                version: process.version
            }
        };
        return event;
    }
});

