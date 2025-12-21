import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db as prisma } from "@/lib/db";

// Temporary auth config until DB is set up
export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" }, // Required for Credentials provider
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                // Mock user for MVP Phase 1 - Database lookup will go here
                if (credentials.email === "demo@mxlens.com" && credentials.password === "mxlens2025") {
                    return {
                        id: "1",
                        name: "Demo Analyst",
                        email: "demo@mxlens.com",
                        role: "analyst",
                    };
                }

                // Example DB lookup (Future)
                // const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                // if (user && bcrypt.compare(credentials.password, user.passwordHash)) return user;

                return null;
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
});
