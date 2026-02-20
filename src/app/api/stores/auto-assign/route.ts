import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/apiAuth";
import { logger } from "@/app/lib/logger";

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID || "6984f69469a68016b608074b";

export async function POST() {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        if (!DEFAULT_STORE_ID) {
            logger.error('DEFAULT_STORE_ID environment variable not set');
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // Check if default store exists
        const defaultStore = await prisma.store.findUnique({
            where: { id: DEFAULT_STORE_ID }
        });

        if (!defaultStore) {
            logger.warn(`Default store ${DEFAULT_STORE_ID} not found in database`);
            return NextResponse.json({ error: "Default store not found" }, { status: 404 });
        }

        // Check if user already has access to this store
        const existingStoreOwnership = await prisma.store.findFirst({
            where: {
                id: DEFAULT_STORE_ID,
                userId: userId
            }
        });

        if (existingStoreOwnership) {
            return NextResponse.json({ message: "User already has access", store: existingStoreOwnership });
        }

        // Update the store to assign it to this user
        const updatedStore = await prisma.store.update({
            where: { id: DEFAULT_STORE_ID },
            data: { userId: userId }
        });

        logger.info(`Store ${DEFAULT_STORE_ID} auto-assigned to user ${userId}`);
        return NextResponse.json({ message: "User assigned to store", store: updatedStore });
    } catch (error) {
        logger.error("AUTO_ASSIGN_STORE_ERROR", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
