'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

    useEffect(() => {
        if (!posthogKey) return

        posthog.init(posthogKey, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
            capture_pageview: true, // Automatically capture pageviews
            capture_pageleave: true, // Capture when users leave a page
            disable_session_recording: true,

            // Enable debug mode in development
            loaded: (posthog) => {
                if (process.env.NODE_ENV === 'development') posthog.debug()
            }
        })
    }, [posthogKey])

    if (!posthogKey) return <>{children}</>
    return <PHProvider client={posthog}>{children}</PHProvider>
}
