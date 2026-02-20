import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth, verifyStoreAccess } from '@/app/lib/apiAuth';
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

    const { userId } = auth;

    try {
        const { id } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Check if branch exists
        const branch = await prisma.branch.findUnique({
            where: { id }
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(branch.storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized branch patch attempt: User ${userId} -> Branch ${id}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedBranch = await prisma.branch.update({
            where: { id },
            data: { name }
        });

        return NextResponse.json(updatedBranch);

    } catch (error) {
        logger.error('Error updating branch:', error);
        return NextResponse.json(
            { error: 'Failed to update branch' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const { id } = await params;

        // Check if branch exists
        const branch = await prisma.branch.findUnique({
            where: { id }
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(branch.storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized branch delete attempt: User ${userId} -> Branch ${id}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if branch has products
        const productsCount = await prisma.product.count({
            where: { branchId: id }
        });

        if (productsCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete branch that has products. Please remove or move products first.' },
                { status: 400 }
            );
        }

        await prisma.branch.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Branch deleted successfully' });

    } catch (error) {
        logger.error('Error deleting branch:', error);
        return NextResponse.json(
            { error: 'Failed to delete branch' },
            { status: 500 }
        );
    }
}
