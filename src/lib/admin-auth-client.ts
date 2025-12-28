"use client";

import { createAuthClient } from "better-auth/react";

export const adminAuthClient = createAuthClient({
    baseURL: typeof window !== "undefined"
        ? window.location.origin
        : "https://admin.mxlens.com",
    basePath: "/api/admin/auth",
});

export const { signIn, signOut, signUp, useSession } = adminAuthClient;
