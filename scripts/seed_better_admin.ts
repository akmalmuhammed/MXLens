import { adminAuth } from "../src/lib/admin-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdmin() {
    console.log("Creating admin user...");

    const email = "port3000@test.com";
    const password = "Admin123!";
    const name = "Super Admin";

    // Check if user exists
    // Note: We use prisma.adminUser explicitly here
    const existing = await prisma.adminUser.findUnique({
        where: { email }
    });

    if (existing) {
        console.log("Admin user already exists. Updating password not supported in this simple script (hashing complex).");
        // To update password, we'd need to use adminAuth.api.changePassword if we had a session, 
        // or recreate the user. For now, let's just delete and recreate to be safe and lazy.
        console.log("Deleting existing admin to recreate...");
        await prisma.adminUser.delete({ where: { email } });
    }

    try {
        // Use Better Auth API to create user
        // We mock the request context because signUpEmail usually expects it
        // But better-auth server instance (adminAuth) provides 'api' which can be called directly?
        // Actually, documentation says adminAuth.api.signUpEmail({ body: ... }) returns a Response or object.

        // Wait! We can't call API directly in script easily if it relies on headers/cookies.
        // Instead, we can use `adminAuth.internal.createUser` if exposed, or just use the local API call.

        // Let's try calling the internal sign up method if available, or just mocking.
        // Better Auth exposes `api` which is typed.

        const res = await adminAuth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
            asResponse: false // Returns data object directly
        });

        console.log("Admin user created successfully!", res);

        // Now manually verify the email and set admin flags
        // We know the email, so let's update the DB directly
        await prisma.adminUser.update({
            where: { email },
            data: {
                emailVerified: true, // Bypass verification
                isPlatformAdmin: true,
                role: "super_admin"
            }
        });

        console.log("✅ Admin privileges granted and email verified.");

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
