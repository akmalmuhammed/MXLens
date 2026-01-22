import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import * as fs from "fs";

const prisma = new PrismaClient();
const email = "port3000@test.com";

// Better Auth uses scrypt by default - we need to match their format
// Format: "s2:salt:N:r:p:hash" where hash is base64
async function hashPasswordScrypt(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16);
        // Better Auth default params: N=16384, r=8, p=1, keylen=32
        crypto.scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
            if (err) reject(err);
            // Format: s2:base64(salt):N:r:p:base64(hash)
            const hash = `s2:${salt.toString("base64")}:16384:8:1:${derivedKey.toString("base64")}`;
            resolve(hash);
        });
    });
}

async function checkAndResetAdminPassword() {
    try {
        // List ALL Admin Users
        console.log("\n--- 🛡️  ADMIN USERS (admin_users) ---");
        const allAdminUsers = await prisma.adminUser.findMany();
        if (allAdminUsers.length === 0) console.log("No admin users found.");
        else allAdminUsers.forEach(u => console.log(`- ${u.email} (ID: ${u.id}, Role: ${u.role})`));

        // List ALL Regular Users
        console.log("\n--- 👤 REGULAR USERS (User) ---");
        const allUsers = await prisma.user.findMany({ take: 10 });
        if (allUsers.length === 0) console.log("No regular users found.");
        else allUsers.forEach(u => console.log(`- ${u.email} (Name: ${u.name})`));

        // Write users to JSON file
        const output = {
            adminUsers: allAdminUsers,
            regularUsers: allUsers
        };
        fs.writeFileSync("db_users.json", JSON.stringify(output, null, 2));
        console.log("✅ Wrote users to db_users.json");

        console.log("\n--------------------------------------------------");

        // Check if user exists in AdminUser table
        const adminUser = await prisma.adminUser.findUnique({
            where: { email },
            include: { accounts: true }
        });

        if (!adminUser) {
            console.log(`❌ User ${email} does NOT exist in AdminUser table (Better Auth).`);
            console.log("   This user is NOT an admin panel user.");
            return;
        }

        console.log(`✅ User ${email} EXISTS in AdminUser table (Better Auth).`);
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   isPlatformAdmin: ${adminUser.isPlatformAdmin}`);
        console.log(`   Role: ${adminUser.role}`);

        // Reset password in AdminAccount table
        const newPassword = "Admin@123456";
        const hashedPassword = await hashPasswordScrypt(newPassword);

        // Find the credential account (providerId = "credential")
        const credentialAccount = adminUser.accounts.find(a => a.providerId === "credential");

        if (credentialAccount) {
            await prisma.adminAccount.update({
                where: { id: credentialAccount.id },
                data: { password: hashedPassword }
            });
            console.log(`\n✅ Password reset successful!`);
        } else {
            // Create credential account if missing
            await prisma.adminAccount.create({
                data: {
                    accountId: adminUser.id,
                    providerId: "credential",
                    userId: adminUser.id,
                    password: hashedPassword,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log(`\n✅ Created credential account and set password!`);
        }

        console.log("--------------------------------------------------");
        console.log(`Email:    ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndResetAdminPassword();
