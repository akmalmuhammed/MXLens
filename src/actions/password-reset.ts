"use server";

import { db } from "@/lib/db";
import { generatePasswordResetToken, getVerificationTokenByToken, deleteVerificationToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

const ResetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get("email") as string;

    const validatedFields = ForgotPasswordSchema.safeParse({ email });
    if (!validatedFields.success) {
        return { error: "Invalid email address" };
    }

    const { email: validEmail } = validatedFields.data;

    try {
        // Check if user exists
        const user = await db.user.findUnique({
            where: { email: validEmail }
        });

        // Always return success to prevent email enumeration attacks
        if (!user) {
            return { success: true };
        }

        // Generate token and send email
        const token = await generatePasswordResetToken(validEmail);
        const result = await sendPasswordResetEmail(validEmail, token.token);

        if (result.error) {
            return { error: "Failed to send reset email. Please try again." };
        }

        return { success: true };
    } catch (error) {
        console.error("[PASSWORD_RESET_ERROR]", error);
        return { error: "Something went wrong. Please try again." };
    }
}

export async function resetPassword(formData: FormData) {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    const validatedFields = ResetPasswordSchema.safeParse({ token, password });
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.password?.[0] || validatedFields.error.flatten().fieldErrors.token?.[0] || "Invalid input" };
    }

    const { token: validToken, password: validPassword } = validatedFields.data;

    try {
        // Find and validate token
        const existingToken = await getVerificationTokenByToken(validToken);

        if (!existingToken || existingToken.type !== "PASSWORD_RESET") {
            return { error: "Invalid or expired reset link" };
        }

        // Check expiry
        if (new Date() > existingToken.expires) {
            await deleteVerificationToken(existingToken.id);
            return { error: "Reset link has expired. Please request a new one." };
        }

        // Find user
        const user = await db.user.findUnique({
            where: { email: existingToken.email }
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Update password
        const hashedPassword = await bcrypt.hash(validPassword, 10);
        await db.user.update({
            where: { id: user.id },
            data: { hashedPassword }
        });

        // Delete used token
        await deleteVerificationToken(existingToken.id);

        return { success: true };
    } catch (error) {
        console.error("[RESET_PASSWORD_ERROR]", error);
        return { error: "Failed to reset password. Please try again." };
    }
}
