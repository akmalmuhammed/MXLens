import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding 20 Pro Users...");

    const passwordHash = await bcrypt.hash("password123", 10);

    const users = [];

    for (let i = 1; i <= 20; i++) {
        // Generate varied data
        const isAnalyst = i % 5 === 0; // Every 5th user is an analyst
        const subscription = i % 3 === 0 ? "enterprise" : "pro"; // A mix of Pro and Enterprise
        const usage = Math.floor(Math.random() * 50);

        users.push({
            name: `Pro User ${i}`,
            email: `pro.user${i}@example.com`,
            password: passwordHash,
            role: isAnalyst ? "analyst" : "user",
            subscriptionStatus: subscription,
            messageLimit: subscription === "enterprise" ? 1000 : 100,
            usageCount: usage,
            emailVerified: new Date(),
        });
    }

    for (const user of users) {
        try {
            const createdUser = await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: user,
            });
            console.log(`Created: ${createdUser.email} [${user.subscriptionStatus}]`);

            // Add some mock logs for them
            if (user.usageCount > 0) {
                await prisma.usageLog.create({
                    data: {
                        userId: createdUser.id,
                        verdict: Math.random() > 0.8 ? "High Risk" : "Likely Legitimate",
                        score: Math.floor(Math.random() * 100),
                        hasAttachments: false,
                        hasBody: true,
                        processingTimeMs: Math.floor(Math.random() * 500) + 100,
                        timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000)) // Random time in recent past
                    }
                });
            }

        } catch (e) {
            console.error(`Failed to create ${user.email}:`, e);
        }
    }

    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
