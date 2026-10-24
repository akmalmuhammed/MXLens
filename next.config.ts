import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy - Defense in Depth
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://*.sentry.io https://js.stripe.com https://clerk.mxlens.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: https://*.stripe.com https://api.ipgeolocation.io https://img.clerk.com;
              font-src 'self';
              connect-src 'self' https://*.sentry.io https://api.stripe.com https://*.googleapis.com https://api.ipgeolocation.io https://ip-api.com https://ipinfo.io https://clerk.mxlens.com https://accounts.mxlens.com;
              frame-src 'self' https://js.stripe.com https://clerk.mxlens.com https://accounts.mxlens.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              block-all-mixed-content;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Disable dangerous browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ];
  },
} as NextConfig;

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

  webpack: {
    reactComponentAnnotation: {
      enabled: true,
    },
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  sourcemaps: {
    disable: true,
  },

});
