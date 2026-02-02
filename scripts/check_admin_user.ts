import { db } from "../src/lib/db";

async function main() {
    console.log('\n=== Checking Admin User Configuration ===\n');

    // 1. Find admin user
    const adminUser = await db.user.findFirst({
        where: { email: 'admin@mxlens.com' },
        select: {
            id: true,
            email: true,
            name: true,
            isPlatformAdmin: true,
            adminRole: true,
            createdAt: true,
        }
    });

    if (!adminUser) {
        console.log('❌ Admin user not found!');
        return;
    }

    console.log('✅ Admin User Found:');
    console.log(JSON.stringify(adminUser, null, 2));

    // 2. Check admin sessions
    const sessions = await db.adminSession.findMany({
        where: { userId: adminUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    console.log(`\n=== Admin Sessions (${sessions.length} found) ===`);
    sessions.forEach((s, i) => {
        console.log(`\nSession ${i + 1}:`);
        console.log(`  - Token: ${s.token.substring(0, 30)}...`);
        console.log(`  - Created: ${s.createdAt}`);
        console.log(`  - Expires: ${s.expiresAt}`);
        console.log(`  - Expired: ${s.expiresAt < new Date() ? 'YES' : 'NO'}`);
    });

    // 3. Fix isPlatformAdmin if needed
    if (!adminUser.isPlatformAdmin) {
        console.log('\n⚠️ isPlatformAdmin is FALSE! Fixing...');
        await db.user.update({
            where: { id: adminUser.id },
            data: { isPlatformAdmin: true, adminRole: 'SUPER_ADMIN' }
        });
        console.log('✅ Updated isPlatformAdmin to true');
    } else {
        console.log('\n✅ isPlatformAdmin is already TRUE');
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
