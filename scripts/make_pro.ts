
import { PrismaClient, PlanTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = "akmalmuhammed93@gmail.com";

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            memberships: {
                where: { role: 'OWNER' },
                include: { organization: true }
            }
        }
    });

    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    // Assuming we upgrade the organization where they are OWNER
    const membership = user.memberships[0];

    if (!membership) {
        console.error(`User ${user.name} does not own any organization.`);
        return;
    }

    const orgId = membership.orgId;
    const orgName = membership.organization.name;

    console.log(`Found Organization: ${orgName} (ID: ${orgId})`);
    console.log(`Current Tier: ${membership.organization.planTier}`);

    const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: { planTier: 'PRO' }
    });

    console.log(`✅ Organization '${orgName}' upgraded to ${updatedOrg.planTier}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
