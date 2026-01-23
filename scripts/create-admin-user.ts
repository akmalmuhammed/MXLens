
// scripts/create-admin-user.ts
// Run with: npx tsx scripts/create-admin-user.ts

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/admin/auth";

const prisma = new PrismaClient();

async function createAdminUser() {
    console.log("🚀 Starting Admin User Creation (Isolated Auth)...");

    const email = "admin@mxlens.com";
    const password = "MxLens@dmin2024!";
    const name = "MXLens Super Admin";

    console.log(`🔍 Preparing AdminUser: ${email}...`);

    try {
        // 1. Hash Password
        const passwordHash = await hashPassword(password);

        // 2. Upsert AdminUser
        // We use 'upsert' to handle both creation and updates (e.g. password reset)
        const adminUser = await prisma.adminUser.upsert({
            where: { email },
            update: {
                name,
                passwordHash,
                role: "SUPER_ADMIN",
            },
            create: {
                email,
                name,
                passwordHash,
                role: "SUPER_ADMIN",
                // emailVerified: true, // Not needed in schema? Let's check schema again. Schema has no verified field? 
                // schema has emailVerified? No, viewed schema: name, email, passwordHash, role, sessions, createdAt, updatedAt.
                // It does NOT have emailVerified.
            }
        });

        console.log(`✅ AdminUser Successfully Configured: ${adminUser.id}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📧 Email:", email);
        console.log("🔒 Password:", password);
        console.log("🛡️  Admin Login:", "https://admin.mxlens.com/auth/signin");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    } catch (error) {
        console.error("❌ Failed to create admin user:", error);
    }
}

createAdminUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
