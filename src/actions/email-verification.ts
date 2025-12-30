"use server";

import { db } from "@/lib/db";
import { generateVerificationToken, getVerificationTokenByToken, deleteVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function verifyEmail(token: string) {
    try {
        const existingToken = await getVerificationTokenByToken(token);

        if (!existingToken || existingToken.type !== "EMAIL_VERIFICATION") {
            return { error: "Invalid verification link" };
        }

        // Check expiry
        if (new Date() > existingToken.expires) {
            await deleteVerificationToken(existingToken.id);
            return { error: "Verification link has expired. Please request a new one." };
        }

        // Find user
        const user = await db.user.findUnique({
            where: { email: existingToken.email }
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Mark email as verified
        await db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() }
        });

        // Delete used token
        await deleteVerificationToken(existingToken.id);

        return { success: true };
    } catch (error) {
        console.error("[VERIFY_EMAIL_ERROR]", error);
        return { error: "Verification failed. Please try again." };
    }
}

export async function resendVerificationEmail(email: string) {
    try {
        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            return { error: "User not found" };
        }

        if (user.emailVerified) {
            return { error: "Email is already verified" };
        }

        // Generate new token and send email
        const token = await generateVerificationToken(email);
        const result = await sendVerificationEmail(email, token.token);

        if (result.error) {
            return { error: "Failed to send verification email" };
        }

        return { success: true };
    } catch (error) {
        console.error("[RESEND_VERIFICATION_ERROR]", error);
        return { error: "Failed to resend verification email" };
    }
}

// Helper to send verification email on registration
export async function sendVerificationOnRegistration(email: string) {
    try {
        const token = await generateVerificationToken(email);
        await sendVerificationEmail(email, token.token);
        return { success: true };
    } catch (error) {
        console.error("[REGISTRATION_VERIFICATION_ERROR]", error);
        return { error: "Failed to send verification email" };
    }
}
