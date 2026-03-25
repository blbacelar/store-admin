import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { logger } from "./logger";
import { isEmailAllowed } from "./security";
import { checkLoginRateLimit, resetLoginRateLimit } from "./rate-limiter";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                rememberMe: { label: "Remember me", type: "text" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const ip = (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim()
                    ?? req?.headers?.["x-real-ip"] as string
                    ?? "unknown";

                try {
                    await checkLoginRateLimit(ip);
                } catch {
                    throw new Error("Too many login attempts. Please try again later.");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user || !user?.hashedPassword) {
                    throw new Error("Invalid credentials");
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );

                if (!isCorrectPassword) {
                    throw new Error("Invalid credentials");
                }

                await resetLoginRateLimit(ip);
                return { ...user, rememberMe: credentials.rememberMe === "true" };
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login", // Redirect to login page on error
    },
    callbacks: {
        async signIn({ user, account, profile: _profile }) {
            logger.debug('SignIn callback - User:', user?.email, 'Account:', account?.provider);

            if (!isEmailAllowed(user.email)) {
                logger.warn(`Login attempt denied for email: ${user.email}`);
                return false; // Or return a URL to a custom error page
            }

            return true;
        },
        async redirect({ url, baseUrl }) {
            logger.debug('Redirect callback - URL:', url, 'BaseURL:', baseUrl);
            // After sign in, always go to dashboard root
            return baseUrl;
        },
        async jwt({ token, user, account: _account }) {
            if (user) {
                token.id = user.id;
                const rememberMe = (user as any).rememberMe;
                const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
                token.exp = Math.floor(Date.now() / 1000) + maxAge;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    debug: process.env.NODE_ENV === "development",
    session: {
        strategy: "jwt",
    },
    logger: {
        error(code, metadata) {
            logger.error('NEXTAUTH_ERROR', code, metadata);
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
