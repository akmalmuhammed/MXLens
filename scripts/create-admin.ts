import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "admin@mxlens.com";
    const password = "admin"; // Simple password for testing
    const name = "Super Admin";

    console.log(`Creating Admin User: ${email}`);

    // Hash with bcrypt to match src/lib/admin/auth.ts
    const passwordHash = await hash(password, 12);

    const upsertedUser = await prisma.adminUser.upsert({
        where: { email },
        update: {
            passwordHash,
            role: "SUPER_ADMIN",
        },
        create: {
            email,
            name,
            passwordHash,
            role: "SUPER_ADMIN",
        },
    });

    console.log("Admin User Created/Updated:");
    console.log(upsertedUser);
    console.log(`\nPassword set to: '${password}'`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
