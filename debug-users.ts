import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Starting user dump...");
        const admins = await prisma.adminUser.findMany();
        const users = await prisma.user.findMany({ take: 50 });

        fs.writeFileSync("db_users_dump.json", JSON.stringify({ admins, users }, null, 2));
        console.log("Success: Written to db_users_dump.json");
    } catch (e: any) {
        console.error("Error:", e);
        fs.writeFileSync("db_users_error.txt", JSON.stringify(e, null, 2) + "\n" + e.toString());
    } finally {
        await prisma.$disconnect();
    }
}

main();
