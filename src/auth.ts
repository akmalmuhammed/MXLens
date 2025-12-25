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
    }
    interface Session {
        user: {
            role?: string;
            orgId?: string;
            orgSlug?: string;
        } & import("next-auth").DefaultSession["user"];
    }
}

// Temporary auth config until DB is set up
export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Required for Credentials provider
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
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');

            // Protect dashboard and onboarding
            if (isOnDashboard || isOnOnboarding) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                const isAuthPage = nextUrl.pathname.startsWith('/auth');
                if (isAuthPage) {
                    // Check if this is a new user redirect (via query param)
                    if (nextUrl.searchParams.get('welcome') === 'true') {
                        return Response.redirect(new URL('/onboarding/welcome', nextUrl));
                    }
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }

            // Fetch the active organization (Just get the first one for now)
            if (!token.orgId && token.id) {
                const membership = await prisma.membership.findFirst({
                    where: { userId: token.id as string },
                    include: { organization: true },
                    orderBy: { joinedAt: 'asc' } // Default to oldest (likely personal) org
                });

                if (membership) {
                    token.orgId = membership.orgId;
                    token.orgSlug = membership.organization.slug;
                    token.role = membership.role;
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
            }
            return session;
        },
    },
});
