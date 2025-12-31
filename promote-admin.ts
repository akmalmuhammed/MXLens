import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address: npx tsx promote-admin.ts <email>");
    process.exit(1);
}

async function promoteAdmin() {
    try {
        const user = await prisma.adminUser.findUnique({
            where: { email }
        });

        if (!user) {
            console.error(`User ${email} not found in admin_users table.`);
            console.error("Please sign up at /admin/auth/signup first.");
            process.exit(1);
        }

        await prisma.adminUser.update({
            where: { email },
            data: {
                isPlatformAdmin: true,
                role: "admin"
            }
        });

        console.log(`✅ User ${email} has been promoted to Platform Admin (Admin Panel).`);

    } catch (error) {
        console.error("Error promoting user:", error);
    } finally {
        await prisma.$disconnect();
    }
}

promoteAdmin();
