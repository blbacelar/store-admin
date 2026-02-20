import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth, verifyStoreAccess } from '@/app/lib/apiAuth';
import { logger } from '@/app/lib/logger';

export async function POST(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const { categoryIds } = await request.json();

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return NextResponse.json({ error: 'categoryIds array is required' }, { status: 400 });
        }

        // VERIFY STORE ACCESS
        // Check the first category to get the storeId and verify ownership
        const firstCategory = await prisma.category.findUnique({
            where: { id: categoryIds[0] },
            select: { storeId: true }
        });

        if (!firstCategory) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        const hasAccess = await verifyStoreAccess(firstCategory.storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized category reorder attempt: User ${userId} -> Category ${categoryIds[0]}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Use a transaction to ensure all updates succeed or fail together
        await prisma.$transaction(
            categoryIds.map((id: string, index: number) =>
                prisma.category.update({
                    where: { id },
                    data: { order: index + 1 }
                })
            )
        );

        return NextResponse.json({ success: true, message: 'Categories reordered successfully' });
    } catch (error) {
        logger.error('Error reordering categories:', error);
        return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
    }
}
