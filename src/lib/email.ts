import { Resend } from 'resend';

// Lazy-load Resend client to prevent build-time failures
let resendInstance: Resend | null = null;

function getResend(): Resend {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn('[EMAIL] RESEND_API_KEY not configured - emails will fail');
            // Return a mock that logs instead of crashing
            resendInstance = new Resend('re_placeholder_key');
        } else {
            resendInstance = new Resend(apiKey);
        }
    }
    return resendInstance;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'MXLens <onboarding@resend.dev>';

export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${APP_URL}/auth/verify?token=${token}`;

    try {
        await getResend().emails.send({
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
        await getResend().emails.send({
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

export async function sendWelcomeEmail(email: string, name: string) {
    try {
        await getResend().emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Welcome to MXLens - Your Email Security Platform',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #e2e8f0;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0891b2; margin: 0;">🛡️ MXLens</h1>
                        <p style="color: #64748b; margin-top: 5px;">Email Security Intelligence</p>
                    </div>
                    
                    <h2 style="color: #f1f5f9;">Welcome, ${name}! 🎉</h2>
                    <p style="color: #94a3b8; line-height: 1.6;">
                        Your MXLens account is ready. You're now equipped with enterprise-grade email threat detection.
                    </p>
                    
                    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #0891b2; margin-top: 0;">Quick Start:</h3>
                        <ul style="color: #94a3b8; line-height: 1.8;">
                            <li>📧 Analyze suspicious emails instantly</li>
                            <li>🔍 Get detailed threat intelligence</li>
                            <li>📊 Track your security posture</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background-color: #0891b2; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;
                                  display: inline-block;">
                            Go to Dashboard →
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
                    
                    <p style="color: #64748b; font-size: 12px; text-align: center;">
                        Questions? Reply to this email or visit our <a href="${APP_URL}/help" style="color: #0891b2;">Help Center</a>
                    </p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('[EMAIL_ERROR] Welcome email failed:', error);
        return { error: 'Failed to send welcome email' };
    }
}

export async function sendTeamInviteEmail(email: string, inviterName: string, orgName: string, inviteToken: string) {
    const inviteUrl = `${APP_URL}/auth/invite?token=${inviteToken}`;

    try {
        await getResend().emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `${inviterName} invited you to join ${orgName} on MXLens`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #e2e8f0;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0891b2; margin: 0;">🛡️ MXLens</h1>
                        <p style="color: #64748b; margin-top: 5px;">Email Security Intelligence</p>
                    </div>
                    
                    <h2 style="color: #f1f5f9;">You're Invited! 🎉</h2>
                    <p style="color: #94a3b8; line-height: 1.6;">
                        <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on MXLens.
                    </p>
                    
                    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                        <p style="color: #64748b; margin: 0;">Organization</p>
                        <p style="color: #f1f5f9; font-size: 24px; font-weight: bold; margin: 10px 0;">${orgName}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteUrl}" 
                           style="background-color: #0891b2; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;
                                  display: inline-block;">
                            Accept Invitation
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; text-align: center;">
                        This invitation expires in 7 days.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
                    
                    <p style="color: #64748b; font-size: 12px; text-align: center;">
                        If you don't recognize this invitation, you can safely ignore this email.
                    </p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('[EMAIL_ERROR] Team invite email failed:', error);
        return { error: 'Failed to send team invite email' };
    }
}

export async function sendSubscriptionConfirmationEmail(email: string, planName: string, amount: string, nextBillingDate: string) {
    try {
        await getResend().emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Your MXLens ${planName} subscription is active`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #e2e8f0;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0891b2; margin: 0;">🛡️ MXLens</h1>
                        <p style="color: #64748b; margin-top: 5px;">Email Security Intelligence</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 48px;">✨</div>
                        <h2 style="color: #f1f5f9;">Subscription Confirmed!</h2>
                    </div>
                    
                    <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; color: #94a3b8;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #334155;">Plan</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #334155; text-align: right; color: #f1f5f9; font-weight: bold;">${planName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #334155;">Amount</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #334155; text-align: right; color: #f1f5f9; font-weight: bold;">${amount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0;">Next Billing</td>
                                <td style="padding: 10px 0; text-align: right; color: #f1f5f9; font-weight: bold;">${nextBillingDate}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="color: #94a3b8; line-height: 1.6;">
                        Thank you for upgrading! You now have access to unlimited scans, team features, and priority support.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard/billing" 
                           style="background-color: #0891b2; color: white; padding: 14px 28px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold;
                                  display: inline-block;">
                            Manage Subscription
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
                    
                    <p style="color: #64748b; font-size: 12px; text-align: center;">
                        Need help? Contact <a href="mailto:support@mxlens.com" style="color: #0891b2;">support@mxlens.com</a>
                    </p>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('[EMAIL_ERROR] Subscription confirmation email failed:', error);
        return { error: 'Failed to send subscription confirmation email' };
    }
}

