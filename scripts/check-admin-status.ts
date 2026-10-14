
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyAdminStatus() {
    const email = "admin@mxlens.com";
    console.log(`🔍 Checking status for: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            isPlatformAdmin: true,
            adminRole: true
        }
    });

    if (!user) {
        console.error("❌ User NOT FOUND.");
    } else {
        console.log("✅ User Found:");
        console.log(JSON.stringify(user, null, 2));

        if (user.isPlatformAdmin) {
            console.log("\n✅ Database is correct. User IS a platform admin.");
            console.log("👉 If login fails, the session token is likely STALE. Sign out and sign in again.");
        } else {
            console.error("\n❌ Database is INCORRECT. User is NOT a platform admin.");
        }
    }
}

verifyAdminStatus()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
