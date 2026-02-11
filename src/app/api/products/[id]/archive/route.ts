import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { notifyStoreService } from '@/app/lib/socket';
import { requireAuth } from '@/app/lib/apiAuth';
import { logger } from '@/app/lib/logger';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    try {
        const { id: idParam } = await params;
        const body = await request.json();
        const { archived } = body;

        logger.debug(`Updating archive status for ${idParam} to ${archived}`);

        if (typeof archived !== 'boolean') {
            return NextResponse.json({ error: 'Archived must be a boolean' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: idParam
            },
            data: {
                archived
            }
        });

        notifyStoreService();
        return NextResponse.json({ success: true, archived: updatedProduct.archived });
    } catch (error) {
        logger.error('Error archiving product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
