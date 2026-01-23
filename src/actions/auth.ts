"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signOut, signIn } from "@/auth";

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

import { rateLimit } from "@/lib/rate-limit";

// ... imports

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Rate Limit: 5 registrations per hour per IP (simulated by email domain/hash for now as server actions don't easily give IP without headers())
    // Note: In Next.js Server Actions, obtaining IP requires headers().get("x-forwarded-for")
    // We will use a global limiter for now to prevent massive bot spam.
    const limitStatus = await rateLimit("register_global", 10, "1 m"); // 10 per minute global
    if (!limitStatus.success) {
        return { error: "Too many requests. Please try again later." };
    }

    // Validate fields
    const validatedFields = RegisterSchema.safeParse({
        email,
        password,
        name,
    });

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    const { email: validEmail, password: validPassword, name: validName } = validatedFields.data;

    try {
        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email: validEmail },
        });

        if (existingUser) {
            return { error: "Email already in use!" };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validPassword, 10);

        // Create user AND Organization (Personal Team)
        const baseSlug = (validName || validEmail.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-') + "-team";

        // Use transaction to ensure both are created or neither
        await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: validEmail,
                    hashedPassword: hashedPassword,
                    name: validName || validEmail.split("@")[0],
                },
            });

            await tx.organization.create({
                data: {
                    name: `${user.name || 'User'}'s Team`,
                    slug: baseSlug + "-" + Math.floor(Math.random() * 10000),
                    members: {
                        create: {
                            userId: user.id,
                            role: "OWNER"
                        }
                    }
                }
            });

            return user;
        });

        // Send verification email (non-blocking)
        try {
            const { sendVerificationOnRegistration } = await import("@/actions/email-verification");
            await sendVerificationOnRegistration(validEmail);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // Don't fail registration if email fails
        }
    } catch (error) {
        console.error("[REGISTER_USER_ERROR]", error);
        return { error: "Registration failed. Please try again." };
    }

    // Auto-Login after successful registration
    // Using signIn with redirect:true (default) which properly establishes the session
    // The redirect call inside signIn will throw NEXT_REDIRECT which is expected
    try {
        await signIn("credentials", {
            email: validEmail,
            password: validPassword,
            redirectTo: "/dashboard?welcome=true",
        });
        // This line won't be reached due to redirect
    } catch (error: any) {
        // NEXT_REDIRECT is expected behavior when signIn succeeds
        // It's thrown as an error because signIn triggers a redirect
        if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
            throw error; // Re-throw to let Next.js handle the redirect
        }

        // Actual error - fallback to signin page
        console.error("Auto-login failed:", error);
        redirect("/auth/signin?registered=true");
    }
}

import { cookies } from "next/headers";

export async function logout() {
    // Force expire all variations of session cookies
    // This handles the mismatch between host-only and domain-scoped cookies
    const cookieStore = await cookies();

    const cookieNames = [
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        // Also handle callback URL cookies
        "authjs.callback-url",
        "__Secure-authjs.callback-url",
        // CSRF token
        "authjs.csrf-token",
        "__Secure-authjs.csrf-token"
    ];

    // Use production domain only in production
    const domain = process.env.NODE_ENV === "production" ? ".mxlens.com" : undefined;

    for (const name of cookieNames) {
        // Delete the cookie explicitly
        try {
            cookieStore.delete(name);
        } catch {
            // Some cookies may not exist, ignore
        }

        // Also try to expire with domain (for production subdomain cookies)
        if (domain) {
            cookieStore.set(name, "", {
                expires: new Date(0),
                path: "/",
                domain: domain,
                httpOnly: true,
                secure: true,
                sameSite: "lax"
            });
        }

        // Expire on host (no domain set) - works in both dev and prod
        cookieStore.set(name, "", {
            expires: new Date(0),
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });
    }

    await signOut({ redirectTo: "/" });
}

