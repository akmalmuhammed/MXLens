import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://js.stripe.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: https://*.stripe.com;
              font-src 'self';
              connect-src 'self' https://*.sentry.io https://api.stripe.com https://*.googleapis.com;
              frame-src 'self' https://js.stripe.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              block-all-mixed-content;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "admin.mxlens.com",
          },
        ],
        destination: "/admin",
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "admin.mxlens.com",
          },
        ],
        destination: "/admin/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "mxlens-security", // Adjust this if your Sentry org slug is different
  project: "javascript-nextjs", // Adjust this if your Sentry project slug is different

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  sourcemaps: {
    disable: true,
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers)
  // automaticVercelMonitors: true,
});
