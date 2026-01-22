import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("\n🔍 Fetching users from Neon Database...\n");

    // 1. Admin Users (for Admin Panel)
    console.log("--- 🛡️  ADMIN USERS (admin_users) ---");
    try {
        const adminUsers = await prisma.adminUser.findMany();
        if (adminUsers.length === 0) {
            console.log("No admin users found.");
        } else {
            adminUsers.forEach(u => {
                console.log(`- [${u.email}] (Name: ${u.name}, Role: ${u.role}, PlatformAdmin: ${u.isPlatformAdmin})`);
            });
        }
    } catch (e: any) {
        console.log("Error fetching admin users: " + e.message);
    }

    // 2. Regular Users (for Main App)
    console.log("\n--- 👤 REGULAR USERS (User) ---");
    try {
        const users = await prisma.user.findMany({
            take: 20 // Limit to 20 just in case
        });
        if (users.length === 0) {
            console.log("No regular users found.");
        } else {
            users.forEach(u => {
                console.log(`- [${u.email}] (Name: ${u.name})`);
            });
        }
    } catch (e: any) {
        console.log("Error fetching regular users: " + e.message);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
