import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db as prisma } from "@/lib/db";

import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

declare module "next-auth" {
    interface User {
        role?: string;
        orgId?: string;
        isPlatformAdmin?: boolean;
        adminRole?: string;
    }
    interface Session {
        user: {
            role?: string;
            orgId?: string;
            orgSlug?: string;
            isPlatformAdmin?: boolean;
            adminRole?: string;
        } & import("next-auth").DefaultSession["user"];
    }
}

// Temporary auth config until DB is set up
export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Required for Credentials provider
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                // Set domain to share across subdomains (e.g., .mxlens.com)
                domain: process.env.NODE_ENV === "production" ? ".mxlens.com" : undefined,
            },
        },
    },
    providers: [
        Google,
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await prisma.user.findUnique({
                    where: { email }
                });

                // If user exists but has no password (OAuth account), fail
                if (!user || !user.hashedPassword) return null;

                const passwordsMatch = await bcrypt.compare(password, user.hashedPassword);

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        // role, orgId will be populated in jwt callback
                    };
                }

                return null;
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    events: {
        async createUser({ user }) {
            // "Personal Org" Pattern: Every user gets their own workspace
            if (!user.email) return;

            // Generate a slug from name or email
            const baseSlug = (user.name || user.email.split('@')[0])
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-') + "-team";

            // Create the Org and Membership
            await prisma.organization.create({
                data: {
                    name: `${user.name || 'User'}'s Team`,
                    slug: baseSlug + "-" + Math.floor(Math.random() * 1000), // Ensure uniqueness
                    members: {
                        create: {
                            userId: user.id!,
                            role: "OWNER"
                        }
                    }
                }
            });

            // Note: New user onboarding redirect is handled via signIn callback below
        }
    },
    callbacks: {
        async signIn({ user, account }) {
            // All users can sign in
            return true;
        },
        // authorized callback removed to allow middleware.ts to handle all routing and protection logic
        // preventing conflicts between NextAuth internal logic and our custom middleware.
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }

            // Fetch user data including admin status and org
            if (token.id && (!token.orgId || token.isPlatformAdmin === undefined)) {
                const userData = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: {
                        isPlatformAdmin: true,
                        adminRole: true,
                        memberships: {
                            include: { organization: true },
                            orderBy: { joinedAt: 'asc' },
                            take: 1,
                        },
                    },
                });

                if (userData) {
                    token.isPlatformAdmin = userData.isPlatformAdmin;
                    token.adminRole = userData.adminRole;

                    if (userData.memberships[0]) {
                        token.orgId = userData.memberships[0].orgId;
                        token.orgSlug = userData.memberships[0].organization.slug;
                        token.role = userData.memberships[0].role;
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.orgId = token.orgId as string;
                session.user.orgSlug = token.orgSlug as string;
                session.user.role = token.role as string;
                session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
                session.user.adminRole = token.adminRole as string;
            }
            return session;
        },
    },
});
