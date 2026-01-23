
import { createAdminSession, verifyPassword } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit"; // Assuming we have this or similar

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        // Rate Limit (Global or IP based if possible)
        // Simple global protection for now
        const limit = await rateLimit("admin-login-global", 10, "1 m");
        if (!limit.success) {
            return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
        }

        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        // 1. Find Admin User
        const admin = await db.adminUser.findUnique({
            where: { email },
        });

        if (!admin) {
            // Timing attack protection (fake delay)
            await new Promise(r => setTimeout(r, 500));
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 2. Verify Password
        const isValid = await verifyPassword(password, admin.passwordHash);

        if (!isValid) {
            await new Promise(r => setTimeout(r, 500));
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 3. Create Session (Sets Cookie)
        // We can get IP/UA from headers if needed
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const ua = req.headers.get("user-agent") || "unknown";

        await createAdminSession(admin.id, ua, ip);

        return NextResponse.json({ success: true, user: { email: admin.email, role: admin.role } });

    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json({ error: "Login failed" }, { status: 400 });
    }
}
