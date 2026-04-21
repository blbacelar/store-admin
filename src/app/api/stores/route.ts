import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { requireAuth } from "@/app/lib/apiAuth";
import { logger } from "@/app/lib/logger";

const DEFAULT_STORE_ID = process.env.DEFAULT_STORE_ID || "6984f69469a68016b608074b";

export async function POST(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Missing store name" }, { status: 400 });
        }

        const store = await prisma.store.create({
            data: {
                name,
                userId: userId
            }
        });

        return NextResponse.json(store);
    } catch (error) {
        logger.error("STORE_POST_ERROR", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function GET() {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const ownedStores = await prisma.store.findMany({
            where: {
                userId: userId
            }
        });

        if (!DEFAULT_STORE_ID) {
            return NextResponse.json(ownedStores);
        }

        const defaultStore = await prisma.store.findUnique({
            where: { id: DEFAULT_STORE_ID }
        });

        const stores = defaultStore && !ownedStores.some((store) => store.id === defaultStore.id)
            ? [defaultStore, ...ownedStores]
            : ownedStores;

        return NextResponse.json(stores);
    } catch (error) {
        logger.error("STORES_GET_ERROR", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
