import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetAdminPassword() {
    const email = "port3000@test.com";
    const newPassword = "Admin123!"; // Temporary password

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: { hashedPassword },
    });

    console.log("✅ Password reset successful!");
    console.log("📧 Email:", email);
    console.log("🔑 New Password:", newPassword);
    console.log("\n⚠️  Change this password after logging in!");

    await prisma.$disconnect();
}

resetAdminPassword().catch(console.error);
