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

        logger.info(`Default store ${DEFAULT_STORE_ID} returned to authenticated user`);
        return NextResponse.json({ message: "Default store available", store: defaultStore });
    } catch (error) {
        logger.error("AUTO_ASSIGN_STORE_ERROR", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
