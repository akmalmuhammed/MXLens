
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword() {
    const email = "admin@mxlens.com";
    const newPassword = "Admin123!";

    console.log(`Resetting password for ${email}...`);

    try {
        const hashedPassword = await hash(newPassword, 12);

        const user = await prisma.adminUser.update({
            where: { email },
            data: {
                passwordHash: hashedPassword
            }
        });

        console.log("✅ Password reset successfully.");
        console.log(`User: ${user.email}`);
        console.log(`New Password: ${newPassword}`);
    } catch (error) {
        console.error("Error resetting password:", error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
