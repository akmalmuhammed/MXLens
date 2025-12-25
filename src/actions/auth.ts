"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
});

export async function registerUser(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

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

    // Redirect to login page
    redirect("/auth/signin?success=true");
}

export async function logout() {
    await signOut({ redirectTo: "/" });
}
