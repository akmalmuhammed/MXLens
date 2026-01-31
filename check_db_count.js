
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    try {
        const userCount = await prisma.user.count();
        const orgCount = await prisma.organization.count();
        console.log(`JSON_OUTPUT: {"users": ${userCount}, "orgs": ${orgCount}}`);
    } catch (e) {
        console.error("Error connecting to DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
