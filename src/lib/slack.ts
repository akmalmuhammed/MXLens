import "server-only";

/**
 * Slack Alerting Service for MXLens
 * Send notifications for high-risk detections, system anomalies, and billing events.
 * 
 * Setup:
 * 1. Create a Slack App at https://api.slack.com/apps
 * 2. Enable Incoming Webhooks
 * 3. Add webhook URL to environment: SLACK_WEBHOOK_URL
 */

type AlertLevel = "info" | "warning" | "critical";

interface SlackAlert {
    level: AlertLevel;
    title: string;
    message: string;
    fields?: { title: string; value: string; short?: boolean }[];
    timestamp?: Date;
}

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const LEVEL_COLORS: Record<AlertLevel, string> = {
    info: "#0891b2",      // Cyan
    warning: "#f59e0b",   // Amber
    critical: "#ef4444",  // Red
};

const LEVEL_ICONS: Record<AlertLevel, string> = {
    info: "ℹ️",
    warning: "⚠️",
    critical: "🚨",
};

/**
 * Send an alert to the configured Slack webhook
 */
export async function sendSlackAlert(alert: SlackAlert): Promise<{ success: boolean; error?: string }> {
    if (!WEBHOOK_URL) {
        console.warn("[SLACK] Webhook URL not configured - skipping alert:", alert.title);
        return { success: false, error: "SLACK_WEBHOOK_URL not configured" };
    }

    const payload = {
        attachments: [
            {
                color: LEVEL_COLORS[alert.level],
                blocks: [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: `${LEVEL_ICONS[alert.level]} ${alert.title}`,
                            emoji: true,
                        },
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: alert.message,
                        },
                    },
                    ...(alert.fields && alert.fields.length > 0
                        ? [
                            {
                                type: "section",
                                fields: alert.fields.map((f) => ({
                                    type: "mrkdwn",
                                    text: `*${f.title}:*\n${f.value}`,
                                })),
                            },
                        ]
                        : []),
                    {
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: `MXLens • ${(alert.timestamp || new Date()).toISOString()}`,
                            },
                        ],
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("[SLACK] Failed to send alert:", error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// PRE-BUILT ALERT FUNCTIONS
// ============================================================================

/**
 * Alert when a high-risk email is detected
 */
export async function alertHighRiskDetection(details: {
    verdict: string;
    score: number;
    incidentId?: string;
    orgName?: string;
}) {
    return sendSlackAlert({
        level: "critical",
        title: "High-Risk Email Detected",
        message: `A potentially malicious email has been flagged.`,
        fields: [
            { title: "Verdict", value: details.verdict, short: true },
            { title: "Risk Score", value: `${details.score}/100`, short: true },
            ...(details.incidentId ? [{ title: "Incident ID", value: details.incidentId, short: true }] : []),
            ...(details.orgName ? [{ title: "Organization", value: details.orgName, short: true }] : []),
        ],
    });
}

/**
 * Alert for system anomalies (e.g., error spike, DB issues)
 */
export async function alertSystemAnomaly(details: {
    type: string;
    message: string;
    severity: AlertLevel;
}) {
    return sendSlackAlert({
        level: details.severity,
        title: `System Alert: ${details.type}`,
        message: details.message,
    });
}

/**
 * Alert for billing events (subscription changes, failed payments)
 */
export async function alertBillingEvent(details: {
    event: "subscription_created" | "subscription_cancelled" | "payment_failed" | "payment_succeeded";
    orgName: string;
    planName?: string;
    amount?: string;
}) {
    const eventMessages: Record<string, { level: AlertLevel; title: string }> = {
        subscription_created: { level: "info", title: "New Subscription" },
        subscription_cancelled: { level: "warning", title: "Subscription Cancelled" },
        payment_failed: { level: "critical", title: "Payment Failed" },
        payment_succeeded: { level: "info", title: "Payment Received" },
    };

    const config = eventMessages[details.event] || { level: "info", title: "Billing Event" };

    return sendSlackAlert({
        level: config.level,
        title: config.title,
        message: `Organization: *${details.orgName}*`,
        fields: [
            ...(details.planName ? [{ title: "Plan", value: details.planName, short: true }] : []),
            ...(details.amount ? [{ title: "Amount", value: details.amount, short: true }] : []),
        ],
    });
}
