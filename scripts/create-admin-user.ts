
// scripts/create-admin-user.ts
// Run with: npx tsx scripts/create-admin-user.ts

import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
    console.log("🚀 Starting Admin User Migration (Unified Identity)...");

    const email = "admin@mxlens.com";
    const password = "MxLens@dmin2024!";
    const name = "MXLens Super Admin";

    // 1. Cleanup Old "AdminUser" (Better Auth) tables if they exist
    // We catch errors in case the tables were already dropped or schema changed
    try {
        console.log("🧹 Cleaning up old Better Auth admin tables...");
        // Use raw query or try/catch delete to be safe if schema changed
        // But since we have the client, we can try to use it if types exist
        // Note: If schema was updated but client not generated, this might fail, 
        // but 'create-admin-user' is usually run locally where we control generation.

        // We will just try to delete if the model exists on the client
        if ((prisma as any).adminUser) {
            const oldAdmin = await (prisma as any).adminUser.findUnique({ where: { email } });
            if (oldAdmin) {
                await (prisma as any).adminUser.delete({ where: { id: oldAdmin.id } });
                console.log("   ✅ Deleted legacy AdminUser record");
            }
        }
    } catch (e) {
        console.log("   ⚠️  Failed to clean legacy tables (ignoring):", e);
    }

    // 2. Create/Update Standard User
    console.log(`🔍 Checking for standard User: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upsert User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            // Update existing user to be admin
            name,
            hashedPassword, // Reset password to ensure known state
            isPlatformAdmin: true,
            adminRole: AdminRole.SUPER_ADMIN,
        },
        create: {
            email,
            name,
            hashedPassword,
            isPlatformAdmin: true,
            adminRole: AdminRole.SUPER_ADMIN,
            emailVerified: new Date(),
        }
    });

    console.log(`✅ User configured as Platform Admin: ${user.id}`);

    // 3. Ensure Personal Organization Exists
    // Every user needs an organization context for the dashboard to work
    const existingMembership = await prisma.membership.findFirst({
        where: { userId: user.id, role: "OWNER" }
    });

    if (!existingMembership) {
        console.log("⚙️  Creating personal organization...");
        const slug = "admin-team-" + Math.floor(Math.random() * 10000);

        await prisma.organization.create({
            data: {
                name: "Admin Personal Team",
                slug: slug,
                members: {
                    create: {
                        userId: user.id,
                        role: "OWNER"
                    }
                }
            }
        });
        console.log("   ✅ Created Organization");
    } else {
        console.log("   ℹ️  Organization membership already exists");
    }

    console.log("\n🎉 Admin Migration Complete!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", email);
    console.log("🔒 Password:", password);
    console.log("🌐 Main Login:", "https://mxlens.com/auth/signin");
    console.log("🛡️  Admin Panel:", "https://admin.mxlens.com");
    console.log("   (Note: Use 'Sign In with Email' on the main login page)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

createAdminUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
