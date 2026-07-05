import "server-only";

import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import type { AdminRole, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export interface AppSession {
    user: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        orgId: string;
        orgSlug: string;
        role: UserRole;
        isPlatformAdmin: boolean;
        adminRole: AdminRole | null;
    };
}

type SessionUser = AppSession["user"];
type OrgMembershipWriter = Pick<typeof db, "organization" | "membership">;

export async function getAppSession(): Promise<AppSession | null> {
    const { userId } = await clerkAuth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
        throw new Error("Clerk user is missing an email address");
    }

    const name = fullName(clerkUser.firstName, clerkUser.lastName) || clerkUser.username || email.split("@")[0];
    const image = clerkUser.imageUrl || null;
    const localUser = await upsertLocalUserWithOrg({ email, name, image });

    return { user: localUser };
}

export async function requireAppSession(): Promise<AppSession> {
    const session = await getAppSession();
    if (!session) {
        redirect("/sign-in");
    }
    return session;
}

export async function requireOrgRole(roles: UserRole[]): Promise<AppSession> {
    const session = await requireAppSession();
    if (!roles.includes(session.user.role)) {
        throw new Error("Unauthorized");
    }
    return session;
}

async function upsertLocalUserWithOrg(input: {
    email: string;
    name: string | null;
    image: string | null;
}): Promise<SessionUser> {
    const existing = await db.user.findUnique({
        where: { email: input.email },
        include: {
            memberships: {
                include: { organization: true },
                orderBy: { joinedAt: "asc" },
                take: 1
            }
        }
    });

    if (existing) {
        if (existing.name !== input.name || existing.image !== input.image) {
            await db.user.update({
                where: { id: existing.id },
                data: {
                    name: input.name,
                    image: input.image
                }
            });
        }

        const membership = existing.memberships[0] || await createPersonalOrgMembership(existing.id, input);
        return toSessionUser(existing, membership);
    }

    const created = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: input.email,
                name: input.name,
                image: input.image,
                emailVerified: new Date()
            }
        });

        const membership = await createPersonalOrgMembership(user.id, input, tx);
        return { user, membership };
    });

    return toSessionUser(created.user, created.membership);
}

async function createPersonalOrgMembership(
    userId: string,
    input: { email: string; name: string | null },
    tx: OrgMembershipWriter = db
) {
    const baseSlug = slugify(`${input.name || input.email.split("@")[0]} team`);
    const organization = await tx.organization.create({
        data: {
            name: `${input.name || input.email.split("@")[0]}'s Team`,
            slug: `${baseSlug}-${Math.floor(Math.random() * 100000)}`
        }
    });

    return tx.membership.create({
        data: {
            userId,
            orgId: organization.id,
            role: "OWNER"
        },
        include: { organization: true }
    });
}

function toSessionUser(
    user: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        isPlatformAdmin: boolean;
        adminRole: AdminRole | null;
    },
    membership: {
        role: UserRole;
        orgId: string;
        organization: { slug: string };
    }
): SessionUser {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        orgId: membership.orgId,
        orgSlug: membership.organization.slug,
        role: membership.role,
        isPlatformAdmin: user.isPlatformAdmin,
        adminRole: user.adminRole
    };
}

function fullName(firstName: string | null, lastName: string | null) {
    return [firstName, lastName].filter(Boolean).join(" ").trim() || null;
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) || "user-team";
}
