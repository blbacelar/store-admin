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
        const branchId = searchParams.get('branchId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized category access attempt: User ${userId} -> Store ${storeId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const whereClause: any = {
            storeId: storeId
        };

        // Filter by branchId if provided
        if (branchId) {
            whereClause.OR = [
                { branchId: branchId },
                { branchId: null }
            ];
        }

        const categories = await prisma.category.findMany({
            where: whereClause,
            orderBy: {
                order: 'asc'
            }
        });
        return NextResponse.json(categories);
    } catch (error) {
        logger.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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
        const { name, storeId, branchId, order } = body;

        if (!name || !storeId) {
            return NextResponse.json({ error: 'Name and storeId are required' }, { status: 400 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized category post attempt: User ${userId} -> Store ${storeId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Determine the order value
        let categoryOrder: number;
        if (order !== undefined && order !== null) {
            categoryOrder = Number(order);
        } else {
            // Auto-assign: max(order) + 1 within the same branch
            const last = await prisma.category.findFirst({
                where: { storeId, branchId: branchId ?? null },
                orderBy: { order: 'desc' },
                select: { order: true }
            });
            categoryOrder = last ? last.order + 1 : 1;
        }

        // Validate uniqueness within branch
        const existing = await prisma.category.findFirst({
            where: {
                storeId,
                branchId: branchId ?? null,
                order: categoryOrder
            }
        });
        if (existing) {
            return NextResponse.json(
                { error: `Order ${categoryOrder} is already used by another category in this branch` },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                name,
                storeId,
                branchId: branchId ?? undefined,
                order: categoryOrder
            }
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Category already exists in this store' }, { status: 400 });
        }
        logger.error('Error creating category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
