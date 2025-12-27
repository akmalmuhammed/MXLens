import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // First, list all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            isPlatformAdmin: true,
            adminRole: true,
        }
    });

    console.log("\n=== Current Users ===");
    users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email} - Admin: ${user.isPlatformAdmin}, Role: ${user.adminRole || 'None'}`);
    });

    // Make the first user a super admin if no admins exist
    const admins = users.filter(u => u.isPlatformAdmin);

    if (admins.length === 0 && users.length > 0) {
        const firstUser = users[0];
        await prisma.user.update({
            where: { id: firstUser.id },
            data: {
                isPlatformAdmin: true,
                adminRole: 'SUPER_ADMIN',
            }
        });
        console.log(`\n✅ Made ${firstUser.email} a SUPER_ADMIN`);
    } else if (admins.length > 0) {
        console.log(`\n✅ Admin(s) already exist: ${admins.map(a => a.email).join(', ')}`);
    } else {
        console.log("\n⚠️ No users found. Create an account first.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
