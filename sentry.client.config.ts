import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
    // Tracing - reduced for production efficiency
    tracesSampleRate: 0.2, // Capture 20% of transactions (was 100%)
    // Session Replay - reduced to minimize bandwidth
    replaysSessionSampleRate: 0.01, // 1% of sessions (was 10%)
    replaysOnErrorSampleRate: 1.0, // Always capture sessions with errors
});
