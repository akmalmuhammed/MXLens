# MXLens Monitoring & Alerting Guide

## Overview

This document describes how to configure monitoring alerts for MXLens based on the defined severity levels.

## Health Check Endpoint

**URL:** `https://your-domain.com/api/health`

### Response Format
```json
{
  "status": "healthy",
  "timestamp": "2024-12-30T15:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "up", "latencyMs": 15 },
    "memory": { "usedMB": 128, "percentUsed": 45 }
  },
  "responseTimeMs": 25
}
```

### HTTP Status Codes
- `200 OK` - Healthy or degraded
- `503 Service Unavailable` - Unhealthy (database down)

---

## Alert Configuration

### P0 Critical Alerts

#### 1. Site Down
**Threshold:** 2 failed checks in 1 minute

**Configuration:**
1. Use an uptime monitoring service:
   - [UptimeRobot](https://uptimerobot.com) (Free tier available)
   - [Better Uptime](https://betterstack.com/uptime)
   - [Pingdom](https://www.pingdom.com)

2. Configure monitor:
   - **URL:** `https://mxlens.vercel.app/api/health`
   - **Interval:** 1 minute
   - **Alert after:** 2 consecutive failures

#### 2. Error Spike
**Threshold:** > 10 errors in 5 minutes

**Sentry Configuration:**
1. Go to [Sentry Dashboard](https://sentry.io) → Alerts → Create Alert Rule
2. Configure:
   ```
   When: count() > 10
   In: 5 minutes
   Filter: is:unresolved
   Action: Send notification to team
   ```

---

### P1 High Alerts

#### 3. Response Time Degradation
**Threshold:** p95 > 3 seconds for 5 minutes

**Sentry Configuration:**
1. Create alert in Sentry → Alerts → Create Alert
2. Select "Performance Alert"
3. Configure:
   ```
   Metric: p95(transaction.duration)
   Threshold: > 3000 ms
   Time Window: 5 minutes
   ```

#### 4. Stripe Webhook Failures
**Threshold:** > 3 failures in 1 hour

**Sentry Configuration:**
1. Create alert in Sentry
2. Configure:
   ```
   When: count() > 3
   In: 1 hour
   Filter: tags[webhook.provider]:stripe AND level:error
   Action: Email + Slack
   ```

#### 5. Database Connection Exhaustion
**Threshold:** > 80% connections used

**Options:**
- **Neon Dashboard:** Enable alerts in Neon console for connection limits
- **Health Endpoint:** Monitor `/api/health` response for database latency spikes

---

### P2 Medium Alerts

#### 6. SSL Certificate Expiring
**Threshold:** < 14 days to expiry

**Configuration:**
- **Vercel-hosted:** Automatic SSL renewal, no action needed
- **Custom Domain:** Use [SSL Labs](https://www.ssllabs.com) or uptime monitor with SSL check

---

## Notification Channels

Configure in Sentry → Settings → Integrations:

1. **Email:** Default, always enabled
2. **Slack:** Install Sentry Slack app
3. **PagerDuty:** For P0 Critical on-call alerts
4. **Webhooks:** Custom integrations

---

## Dashboard URLs

- **Sentry:** https://sentry.io (configure DSN in `.env`)
- **Vercel Analytics:** https://vercel.com/analytics
- **Neon Console:** https://console.neon.tech

---

## Quick Setup Checklist

- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel environment variables
- [ ] Deploy health endpoint (`/api/health`)
- [ ] Configure uptime monitor (UptimeRobot/Better Uptime)
- [ ] Create Sentry alert rules:
  - [ ] Error spike alert (>10 in 5min)
  - [ ] Performance degradation (p95 > 3s)
  - [ ] Stripe webhook failures (>3 in 1hr)
- [ ] Test alerts with deliberate error
- [ ] Configure notification channels (Slack, email)
