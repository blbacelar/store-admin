import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { notifyStoreService } from '@/app/lib/socket';
import { requireAuth, verifyStoreAccess } from '@/app/lib/apiAuth';
import { logger } from '@/app/lib/logger';

export async function PUT(
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
        const { id: idParam } = await params;
        const body = await request.json();
        logger.info(`[PRODUCT UPDATE] PUT called for ID: ${idParam} with body:`, body);

        const { title, categoryId, branchId, description, order } = body;
        const sanitizedTitle = title?.trim();
        if (!sanitizedTitle) {
            logger.warn(`[PRODUCT UPDATE] 400: Valid title is required. Received: "${title}"`);
            return NextResponse.json({ error: 'error_title_required' }, { status: 400 });
        }

        // Fetch current product to know its storeId for access check
        const currentProduct = await prisma.product.findUnique({
            where: { id: idParam },
            select: { id: true, categoryId: true, branchId: true, order: true, description: true, storeId: true }
        });
        if (!currentProduct) {
            logger.warn(`[PRODUCT UPDATE] 404: Product not found: ${idParam}`);
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(currentProduct.storeId!, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized product update attempt: User ${userId} -> Product ${idParam}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // SANITIZATION (Strip HTML tags)
        const sanitizedDescription = description ? description.replace(/<[^>]*>?/gm, '').trim() : null;

        const updateData: any = {
            name: sanitizedTitle,
            categoryId: categoryId === undefined ? currentProduct.categoryId : (categoryId || null),
            branchId: branchId === undefined ? currentProduct.branchId : (branchId || null),
            description: description === undefined ? currentProduct.description : sanitizedDescription
        };

        const finalCategoryId = updateData.categoryId;
        const isChangingCategory = finalCategoryId !== currentProduct.categoryId;

        let newOrder: number | null = null;
        let isChangingOrder = false;

        if (order !== undefined && order !== null && order !== '') {
            newOrder = Number(order);
            isChangingOrder = newOrder !== currentProduct.order;
        } else if (isChangingCategory) {
            // Auto order at the end of the new category
            const last = await prisma.product.findFirst({
                where: { storeId: currentProduct.storeId, categoryId: finalCategoryId },
                orderBy: { order: 'desc' },
                select: { order: true }
            });
            newOrder = last && last.order !== null ? last.order + 1 : 1;
            isChangingOrder = newOrder !== currentProduct.order;
        }

        if (isChangingOrder || isChangingCategory) {
            // If they provided an order to effectively change to what we already have, proceed carefully.
            // If newOrder is null, it means no order provided and category didn't change.
            if (newOrder !== null) {
                logger.info(`[PRODUCT REORDER] Shifting products for ${idParam}. OldCategory: ${currentProduct.categoryId}, NewCategory: ${finalCategoryId}, OldOrder: ${currentProduct.order}, NewOrder: ${newOrder}`);

                await prisma.$transaction(async (tx) => {
                    if (isChangingCategory) {
                        // 1. Fill the gap in the old category
                        if (currentProduct.order !== null) {
                            await tx.product.updateMany({
                                where: {
                                    categoryId: currentProduct.categoryId,
                                    order: { gt: currentProduct.order }
                                },
                                data: { order: { decrement: 1 } }
                            });
                        }

                        // 2. Make space in the new category
                        await tx.product.updateMany({
                            where: {
                                categoryId: finalCategoryId,
                                order: { gte: newOrder }
                            },
                            data: { order: { increment: 1 } }
                        });
                    } else {
                        // Intra-category reorder
                        if (currentProduct.order !== null) {
                            if (newOrder < currentProduct.order) {
                                // Dragged up: shift items in between down
                                await tx.product.updateMany({
                                    where: {
                                        categoryId: finalCategoryId,
                                        order: { gte: newOrder, lt: currentProduct.order }
                                    },
                                    data: { order: { increment: 1 } }
                                });
                            } else if (newOrder > currentProduct.order) {
                                // Dragged down: shift items in between up
                                await tx.product.updateMany({
                                    where: {
                                        categoryId: finalCategoryId,
                                        order: { gt: currentProduct.order, lte: newOrder }
                                    },
                                    data: { order: { decrement: 1 } }
                                });
                            }
                        }
                    }
                });
                updateData.order = newOrder;
            }
        }

        logger.info(`[PRODUCT UPDATE] Updating product ${idParam} with data:`, updateData);
        const updatedProduct = await prisma.product.update({
            where: {
                id: idParam
            },
            data: updateData
        });

        // Invalidate cache for products
        const { productCache } = await import('@/app/lib/cache');
        productCache.deletePattern('products:');
        logger.info(`[CACHE INVALIDATE] PUT products:`);

        notifyStoreService();
        return NextResponse.json(updatedProduct);
    } catch (error) {
        logger.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(
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
        const { id: idParam } = await params;

        const product = await prisma.product.findUnique({
            where: {
                id: idParam
            },
            include: {
                category: true,
                branch: true
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // VERIFY STORE ACCESS
        const hasAccess = await verifyStoreAccess(product.storeId!, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized product get attempt: User ${userId} -> Product ${idParam}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formattedProduct = {
            id: product.id,
            sheetId: product.id.substring(product.id.length - 6),
            title: product.name,
            price: product.price,
            order: product.order,
            category: product.category?.name || 'Uncategorized',
            categoryId: product.categoryId,
            branchName: product.branch?.name,
            branchId: product.branchId,
            image: product.imageUrl,
            url: product.affiliateUrl,
            description: product.description,
            archived: product.archived
        };

        return NextResponse.json(formattedProduct);
    } catch (error) {
        logger.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
