
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdmin() {
    const email = 'admin@mxlens.com';
    const pass = 'MxLens@dmin2024!'; // The password we expect

    try {
        const admin = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (!admin) {
            console.log(`[FAIL] User ${email} NOT FOUND in DB.`);
            return;
        }

        console.log(`[FOUND] User ${email} exists. ID: ${admin.id}`);

        // Check password
        if (admin.passwordHash) {
            const isValid = await bcrypt.compare(pass, admin.passwordHash);
            console.log(`[AUTH] Password match: ${isValid}`);
        } else {
            console.log(`[AUTH] PasswordHash is NULL or missing.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
