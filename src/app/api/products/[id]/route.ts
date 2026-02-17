import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { notifyStoreService } from '@/app/lib/socket';
import { requireAuth } from '@/app/lib/apiAuth';
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

    try {
        const { id: idParam } = await params;
        const body = await request.json();
        const { title, categoryId, branchId, description } = body;
        const sanitizedTitle = title?.trim();
        if (!sanitizedTitle) {
            return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: idParam
            },
            data: {
                name: sanitizedTitle,
                categoryId: categoryId || null, // If empty string/undefined, disconnect category
                branchId: branchId || null,
                description: description || null
            }
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

        const formattedProduct = {
            id: product.id,
            sheetId: product.id.substring(product.id.length - 6),
            title: product.name,
            price: product.price,
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
