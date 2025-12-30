import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

export async function generateVerificationToken(email: string) {
    const token = uuidv4();
    const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
        where: { email, type: "EMAIL_VERIFICATION" }
    });

    const verificationToken = await db.verificationToken.create({
        data: {
            email,
            token,
            type: "EMAIL_VERIFICATION",
            expires
        }
    });

    return verificationToken;
}

export async function generatePasswordResetToken(email: string) {
    const token = uuidv4();
    const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete any existing reset tokens for this email
    await db.verificationToken.deleteMany({
        where: { email, type: "PASSWORD_RESET" }
    });

    const resetToken = await db.verificationToken.create({
        data: {
            email,
            token,
            type: "PASSWORD_RESET",
            expires
        }
    });

    return resetToken;
}

export async function getVerificationTokenByToken(token: string) {
    try {
        const verificationToken = await db.verificationToken.findUnique({
            where: { token }
        });
        return verificationToken;
    } catch {
        return null;
    }
}

export async function deleteVerificationToken(id: string) {
    await db.verificationToken.delete({
        where: { id }
    });
}
