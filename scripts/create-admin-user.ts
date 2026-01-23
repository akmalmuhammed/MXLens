// scripts/create-admin-user.ts
// Run with: npx tsx scripts/create-admin-user.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
    const email = "admin@mxlens.com";
    const password = "MxLens@dmin2024!";
    const name = "MXLens Admin";

    console.log("🔍 Checking for existing admin user...");

    // Check if user already exists
    const existing = await prisma.adminUser.findUnique({
        where: { email }
    });

    if (existing) {
        console.log("⚠️  Admin user already exists, deleting to recreate...");
        // Delete existing account and user
        await prisma.adminAccount.deleteMany({
            where: { userId: existing.id }
        });
        await prisma.adminUser.delete({
            where: { id: existing.id }
        });
        console.log("🗑️  Deleted existing admin user");
    }

    // Hash password using bcrypt (Better Auth default)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed with bcrypt");

    // Create AdminUser
    const user = await prisma.adminUser.create({
        data: {
            name,
            email,
            emailVerified: true,
            role: "super_admin",
            isPlatformAdmin: true,
            password: hashedPassword, // Added password here
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    });
    console.log("👤 Created AdminUser:", user.id);

    // Create AdminAccount for credential-based auth
    // Better Auth stores password in the 'password' field, NOT accessToken
    await prisma.adminAccount.create({
        data: {
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password: hashedPassword, // THIS IS THE CORRECT FIELD
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    });
    console.log("🔑 Created AdminAccount with credential provider");

    console.log("\n✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", email);
    console.log("🔒 Password:", password);
    console.log("🌐 URL: https://admin.mxlens.com");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

createAdminUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
