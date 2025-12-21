"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

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

    // Create user
    await db.user.create({
        data: {
            email: validEmail,
            password: hashedPassword,
            name: validName || validEmail.split("@")[0],
        },
    });

    return { success: "User created!" };
}

import { signOut } from "@/auth";

export async function logout() {
    await signOut({ redirectTo: "/" });
}
