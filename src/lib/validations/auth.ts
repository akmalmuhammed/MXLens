import { z } from "zod";

// Common weak passwords to reject
const WEAK_PASSWORDS = [
    "password", "12345678", "password1", "123456789", "qwerty123",
    "password123", "abc12345", "letmein", "welcome", "admin123"
];

/**
 * Password Strength Validation Schema
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Not a commonly used password
 */
export const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .refine(
        (password) => /[A-Z]/.test(password),
        "Password must contain at least one uppercase letter"
    )
    .refine(
        (password) => /[a-z]/.test(password),
        "Password must contain at least one lowercase letter"
    )
    .refine(
        (password) => /[0-9]/.test(password),
        "Password must contain at least one number"
    )
    .refine(
        (password) => !WEAK_PASSWORDS.includes(password.toLowerCase()),
        "This password is too common. Please choose something stronger."
    );

/**
 * Email validation schema
 */
export const emailSchema = z.string()
    .email("Please enter a valid email address")
    .min(5, "Email is too short")
    .max(255, "Email is too long");

/**
 * Sign up form validation schema
 */
export const signupSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

/**
 * Password reset form validation schema
 */
export const passwordResetSchema = z.object({
    password: passwordSchema,
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

/**
 * Password Strength Calculator
 * Returns a score from 0-4 and label
 */
export function calculatePasswordStrength(password: string): {
    score: number;
    label: "weak" | "fair" | "good" | "strong";
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++; // special chars

    // Penalize common patterns
    if (WEAK_PASSWORDS.includes(password.toLowerCase())) score = 0;

    // Clamp to 0-4
    score = Math.min(4, Math.max(0, score));

    const labels: Record<number, { label: "weak" | "fair" | "good" | "strong"; color: string }> = {
        0: { label: "weak", color: "bg-red-500" },
        1: { label: "weak", color: "bg-red-500" },
        2: { label: "fair", color: "bg-amber-500" },
        3: { label: "good", color: "bg-green-400" },
        4: { label: "strong", color: "bg-green-500" },
    };

    return { score, ...labels[score] };
}

// Type exports
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
