
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Starting database cleanup...");

    try {
        // Delete all analysis logs
        const result = await prisma.analysisLog.deleteMany({});
        console.log(`✅ Deleted ${result.count} analysis logs.`);

        // Optional: Delete other test data if needed, e.g. notifications?
        // const notifications = await prisma.notification.deleteMany({});
        // console.log(`✅ Deleted ${notifications.count} notifications.`);

        console.log("✨ Cleanup complete! The dashboard should now be empty.");
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
