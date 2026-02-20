import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth, verifyStoreAccess } from '@/app/lib/apiAuth';
import { logger } from '@/app/lib/logger';

export async function GET(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized branch access attempt: User ${userId} -> Store ${storeId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const branches = await prisma.branch.findMany({
            where: {
                storeId: storeId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(branches);
    } catch (error) {
        logger.error('Error fetching branches:', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const body = await request.json();
        const { name, storeId } = body;

        if (!name || !storeId) {
            return NextResponse.json({ error: 'Name and Store ID are required' }, { status: 400 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized branch post attempt: User ${userId} -> Store ${storeId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const branch = await prisma.branch.create({
            data: {
                name,
                storeId,
            },
        });

        return NextResponse.json(branch);
    } catch (error) {
        logger.error('Error creating branch:', error);
        return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
    }
}
