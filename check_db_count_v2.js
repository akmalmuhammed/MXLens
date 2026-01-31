
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    try {
        const userCount = await prisma.user.count();
        const orgCount = await prisma.organization.count();
        const adminCount = await prisma.adminUser.count();
        console.log(`JSON_OUTPUT: {"users": ${userCount}, "orgs": ${orgCount}, "admins": ${adminCount}}`);

        // List first 5 users if any exist, just to be sure
        if (userCount > 0) {
            const users = await prisma.user.findMany({ take: 5, select: { email: true } });
            console.log("Sample Users:", users);
        }
    } catch (e) {
        console.error("Error connecting to DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
