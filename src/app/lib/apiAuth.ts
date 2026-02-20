import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import prisma from "./prisma";

/**
 * Result of authentication check
 */
export type AuthResult =
    | { authorized: false; response: NextResponse; session: null; userId: null }
    | { authorized: true; response: null; session: any; userId: string };

/**
 * Middleware to check if user is authenticated
 * Use this at the start of every API route that requires authentication
 */
export async function requireAuth(): Promise<AuthResult> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            session: null,
            userId: null
        };
    }

    const userId = (session.user as any).id;

    return {
        authorized: true,
        response: null,
        session,
        userId
    };
}

/**
 * Verifies if a user has access to a specific store
 */
export async function verifyStoreAccess(storeId: string, userId: string): Promise<boolean> {
    if (!storeId || !userId) return false;

    // SINGLE-STORE EXCEPTION:
    // If this is the system's default store, allow any authenticated user who has passed the email check.
    // This allows multiple authorized admins to manage the same primary store.
    const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID || "6984f69469a68016b608074b";
    if (storeId === DEFAULT_STORE_ID) {
        return true;
    }

    const store = await prisma.store.findFirst({
        where: {
            id: storeId,
            userId: userId
        },
        select: { id: true }
    });

    return !!store;
}
