import { db } from "../src/lib/db";
import { hash } from "bcryptjs";

async function main() {
    console.log('\n=== Checking AdminUser Table ===\n');

    const email = 'admin@mxlens.com';
    const password = 'Admin123!';

    // 1. Check AdminUser
    const adminUser = await db.adminUser.findUnique({
        where: { email }
    });

    if (adminUser) {
        console.log('✅ AdminUser exists:', JSON.stringify(adminUser, null, 2));
    } else {
        console.log('❌ AdminUser NOT found. Creating...');
        const hashedPassword = await hash(password, 12);

        const newAdmin = await db.adminUser.create({
            data: {
                email,
                name: 'Platform Admin',
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ AdminUser created:', JSON.stringify(newAdmin, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
