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
    const limitStatus = await rateLimit("register_global", 10, 60); // 10 per minute global
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
        });
    } catch (error) {
        console.error("[REGISTER_USER_ERROR]", error);
        return { error: "Registration failed. Please try again." };
    }

    // Attempt Auto-Login
    let autoLoginSuccess = false;
    try {
        await signIn("credentials", {
            email: validEmail,
            password: validPassword,
            redirect: false,
        });
        autoLoginSuccess = true;
    } catch (error) {
        // Log error but don't crash, redirect to signin
        console.error("Auto-login failed:", error);
    }

    if (autoLoginSuccess) {
        redirect("/dashboard?welcome=true");
    } else {
        redirect("/auth/signin?success=true");
    }
}

export async function logout() {
    await signOut({ redirectTo: "/" });
}
