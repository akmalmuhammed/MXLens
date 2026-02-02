import { db } from "../src/lib/db";
import { hash } from "bcryptjs";

async function main() {
    console.log('\n=== Creating Admin User ===\n');

    const email = 'admin@mxlens.com';
    const password = 'Admin123!';

    // Check if user already exists
    const existing = await db.user.findFirst({
        where: { email }
    });

    if (existing) {
        console.log('User already exists. Updating to ensure admin access...');
        const updated = await db.user.update({
            where: { id: existing.id },
            data: {
                isPlatformAdmin: true,
                adminRole: 'SUPER_ADMIN',
                hashedPassword: await hash(password, 12),
            }
        });
        console.log('✅ User updated:');
        console.log(JSON.stringify({
            id: updated.id,
            email: updated.email,
            isPlatformAdmin: updated.isPlatformAdmin,
            adminRole: updated.adminRole,
        }, null, 2));
    } else {
        console.log('Creating new admin user...');
        const hashedPassword = await hash(password, 12);

        const user = await db.user.create({
            data: {
                email,
                name: 'Platform Admin',
                hashedPassword,
                isPlatformAdmin: true,
                adminRole: 'SUPER_ADMIN',
                emailVerified: new Date(),
            }
        });

        console.log('✅ Admin user created:');
        console.log(JSON.stringify({
            id: user.id,
            email: user.email,
            isPlatformAdmin: user.isPlatformAdmin,
            adminRole: user.adminRole,
        }, null, 2));
    }

    console.log('\n✅ Done! You can now login with:');
    console.log('  Email: admin@mxlens.com');
    console.log('  Password: Admin123!');
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
