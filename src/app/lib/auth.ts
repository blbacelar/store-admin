import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { logger } from "./logger";
import { isEmailAllowed } from "./security";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
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

                return user;
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login", // Redirect to login page on error
    },
    callbacks: {
        async signIn({ user, account, profile }) {
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
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
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
