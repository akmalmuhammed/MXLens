
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            memberships: {
                include: {
                    organization: true
                }
            }
        }
    });

    const output = users.map(user => ({
        name: user.name,
        email: user.email,
        id: user.id,
        role: user.memberships[0]?.role || 'None',
        org: user.memberships[0]?.organization.name || 'None'
    }));

    fs.writeFileSync('users.json', JSON.stringify(output, null, 2));
    console.log("Wrote " + users.length + " users to users.json");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
