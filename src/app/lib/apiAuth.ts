import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Middleware to check if user is authenticated
 * Use this at the start of every API route that requires authentication
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            session: null
        };
    }

    return {
        authorized: true,
        response: null,
        session
    };
}
