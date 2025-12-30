import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'MXLens <onboarding@resend.dev>';

export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${APP_URL}/auth/verify?token=${token}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Verify your MXLens account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0891b2; margin: 0;">MXLens</h1>
                        <p style="color: #64748b; margin-top: 5px;">Email Security Intelligence</p>
                    </div>
                    
                    <h2 style="color: #1e293b;">Verify your email address</h2>
                    <p style="color: #475569; line-height: 1.6;">
                        Thanks for signing up! Please click the button below to verify your email address and activate your account.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #0891b2; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;
                                  display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        If the button doesn't work, copy and paste this URL into your browser:<br>
                        <a href="${verificationUrl}" style="color: #0891b2;">${verificationUrl}</a>
                    </p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('[EMAIL_ERROR] Verification email failed:', error);
        return { error: 'Failed to send verification email' };
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${APP_URL}/auth/new-password?token=${token}`;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Reset your MXLens password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0891b2; margin: 0;">MXLens</h1>
                        <p style="color: #64748b; margin-top: 5px;">Email Security Intelligence</p>
                    </div>
                    
                    <h2 style="color: #1e293b;">Reset your password</h2>
                    <p style="color: #475569; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to choose a new password.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #0891b2; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px;">
                        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        If the button doesn't work, copy and paste this URL into your browser:<br>
                        <a href="${resetUrl}" style="color: #0891b2;">${resetUrl}</a>
                    </p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('[EMAIL_ERROR] Password reset email failed:', error);
        return { error: 'Failed to send password reset email' };
    }
}
