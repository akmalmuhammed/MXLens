
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function check() {
    console.log("🔍 Verifying Admin Login locally...");
    const email = "admin@mxlens.com";
    const password = "MxLens@dmin2024!";

    // 1. Fetch User
    const user = await prisma.adminUser.findUnique({
        where: { email },
        include: { sessions: true }
    });

    if (!user) {
        console.error("❌ AdminUser NOT FOUND.");
        return;
    }

    console.log("✅ AdminUser FOUND:");
    console.log("   ID:", user.id);
    console.log("   Name:", user.name);
    console.log("   Role:", user.role);
    console.log("   Password Field Present:", !!user.password);
    console.log("   Password Hash Length:", user.password?.length);

    // 2. Fetch Account
    const account = await prisma.adminAccount.findFirst({
        where: { userId: user.id, providerId: "credential" }
    });

    if (!account) {
        console.error("❌ AdminAccount (credential) NOT FOUND.");
    } else {
        console.log("✅ AdminAccount FOUND:");
        console.log("   Provider:", account.providerId);
        console.log("   Password Field Present:", !!account.password);
    }

    // 3. Verify Hash (User Model)
    if (user.password) {
        const validUser = await bcrypt.compare(password, user.password);
        console.log(`🔐 bcrypt.compare(password, User.password): ${validUser ? "✅ MATCH" : "❌ MISMATCH"}`);
    } else {
        console.log("⚠️  Skipping User.password check (field empty)");
    }

    // 4. Verify Hash (Account Model)
    if (account && account.password) {
        const validAccount = await bcrypt.compare(password, account.password);
        console.log(`🔐 bcrypt.compare(password, Account.password): ${validAccount ? "✅ MATCH" : "❌ MISMATCH"}`);
    } else {
        console.log("⚠️  Skipping Account.password check (field empty)");
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
