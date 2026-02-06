import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

const TARGET_STORE_ID = '6984f69469a68016b608074b';

export async function POST() {
    try {
        // Verify the store exists
        const store = await prisma.store.findUnique({
            where: { id: TARGET_STORE_ID }
        });

        if (!store) {
            return NextResponse.json(
                { error: `Store with ID ${TARGET_STORE_ID} not found` },
                { status: 404 }
            );
        }

        // Update all products to belong to the target store
        const result = await prisma.product.updateMany({
            where: {
                storeId: { not: TARGET_STORE_ID }
            },
            data: {
                storeId: TARGET_STORE_ID
            }
        });

        return NextResponse.json({
            success: true,
            message: `Migrated ${result.count} products to store: ${store.name}`,
            count: result.count,
            storeName: store.name
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: 'Migration failed', details: error },
            { status: 500 }
        );
    }
}
