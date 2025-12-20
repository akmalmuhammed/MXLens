# Implementation Plan - MXLens Phase 2

This phase focuses on replacing mocks with real persistence and monetization infrastructure.

## Goals
1.  **Supabase Integration**: Set up database for reliable usage tracking and user management.
2.  **Stripe Integration**: Implement subscription checkout and webhook handling.
3.  **User Dashboard**: Create a personal area for users to view usage and manage subscriptions.

## Tasks

### 1. Supabase Setup
- [ ] Initialize Supabase project (User to provide credentials).
- [ ] Create schema:
    - `profiles`: Extends auth users with `stripe_customer_id`, `subscription_status`, `usage_count`, `last_reset_date`.
    - `usage_logs`: (Optional) Detailed log of analysis events (metadata only, no content).
- [ ] Configure Row Level Security (RLS) policies.
- [ ] Update `checkAndTrackUsage` server action to use Supabase client.

### 2. Stripe Integration
- [ ] Set up Stripe account (User to provide keys).
- [ ] Create subscription products (Free, Pro, Enterprise).
- [ ] Implement Checkout Session API route.
- [ ] Implement Webhook Handler (`/api/webhooks/stripe`) to sync status with Supabase `profiles`.

### 3. User Dashboard (`/dashboard`)
- [ ] Create layout with sidebar navigation.
- [ ] **Overview Tab**: Show current usage vs limit, plan details.
- [ ] **Billing Tab**: Manage subscription (Portal Link).
- [ ] **History Tab**: List past analysis summaries (if enabled).

### 4. Refinement
- [ ] Protect `/dashboard` routes with middleware.
- [ ] Ensure guest tracking in `localStorage` gracefully prompts for signup when limits hit.

## Dependencies
- `@supabase/supabase-js`
- `@supabase/ssr`
- `stripe`
