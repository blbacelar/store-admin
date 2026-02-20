import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth, verifyStoreAccess } from '@/app/lib/apiAuth';
import { logger } from '@/app/lib/logger';

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

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(category.storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized category delete attempt: User ${userId} -> Category ${id}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productsCount > 0) {
            return NextResponse.json(
                { error: 'Não é possível excluir uma categoria que contém produtos. Remova ou mova os produtos primeiro.' },
                { status: 400 } // Bad Request
            );
        }

        await prisma.category.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Categoria excluída com sucesso' });

    } catch (error) {
        logger.error('Error deleting category:', error);
        return NextResponse.json(
            { error: 'Falha ao excluir categoria' },
            { status: 500 }
        );
    }
}

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
        const { name, order } = body;

        if (!name && order === undefined) {
            return NextResponse.json(
                { error: 'At least name or order is required' },
                { status: 400 }
            );
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(category.storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized category patch attempt: User ${userId} -> Category ${id}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validate order uniqueness within the same branch if order is being changed
        if (order !== undefined && order !== null) {
            const newOrder = Number(order);
            const conflict = await prisma.category.findFirst({
                where: {
                    storeId: category.storeId,
                    branchId: category.branchId,
                    order: newOrder,
                    id: { not: id } // exclude self
                }
            });
            if (conflict) {
                return NextResponse.json(
                    { error: `Order ${newOrder} is already used by category "${conflict.name}"` },
                    { status: 400 }
                );
            }
        }

        const updateData: { name?: string; order?: number } = {};
        if (name) updateData.name = name;
        if (order !== undefined && order !== null) updateData.order = Number(order);

        const updatedCategory = await prisma.category.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedCategory);

    } catch (error) {
        logger.error('Error updating category:', error);
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}
