import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { notifyStoreService } from '@/app/lib/socket';
import { requireAuth, verifyStoreAccess } from '@/app/lib/apiAuth';
import { logger } from '@/app/lib/logger';
import { productCache } from '@/app/lib/cache';

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
            logger.warn(`[AUTH] Unauthorized store access attempt: User ${userId} -> Store ${storeId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Cache Key
        const cacheKey = `products:${storeId}:${branchId || 'all'}`;
        const cachedProducts = productCache.get<any[]>(cacheKey);

        if (cachedProducts) {
            logger.info(`[CACHE HIT] ${cacheKey}`);
            return NextResponse.json(cachedProducts);
        }

        const whereClause: { storeId: string; branchId?: string } = {
            storeId: storeId
        };

        // Filter by branchId if provided
        if (branchId) {
            whereClause.branchId = branchId;
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                category: true
            },
            orderBy: {
                order: 'asc'
            }
        });

        const formattedProducts = products.map(product => ({
            id: product.id,
            sheetId: product.id.substring(product.id.length - 6), // Use last 6 chars as display ID
            title: product.name,
            price: product.price,
            order: product.order,
            category: product.category?.name || 'Uncategorized',
            categoryId: product.categoryId,
            image: product.imageUrl,
            url: product.affiliateUrl,
            archived: product.archived
        }));

        // Set Cache
        productCache.set(cacheKey, formattedProducts);
        logger.info(`[CACHE MISS] ${cacheKey} - Cached result`);

        return NextResponse.json(formattedProducts);
    } catch (error) {
        logger.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
        const { title, price, image, url, storeId, branchId, categoryId, order } = body;

        // VERIFY STORE ACCESS
        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const hasAccess = await verifyStoreAccess(storeId, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized store post attempt: User ${userId} -> Store ${storeId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validate
        if (!title || !url || !storeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!image) {
            console.warn(`[WARNING] No image provided for product: ${title}`);
        }

        // Parse price with locale awareness
        let parsedPrice = 0;
        if (price !== undefined && price !== null && price !== 'No Price Found') {
            if (typeof price === 'number') {
                parsedPrice = price;
            } else {
                // Remove currency symbols and non-numeric chars except separators
                let cleaned = price.replace(/[^\d.,]/g, '');
                const lastComma = cleaned.lastIndexOf(',');
                const lastDot = cleaned.lastIndexOf('.');

                if (lastComma > lastDot) {
                    // BR/EU format (e.g., 1.200,50 or 29,90) - Remove dots, swap comma to dot
                    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                } else {
                    // US format (e.g., 1,200.50 or 29.90) - Remove commas
                    cleaned = cleaned.replace(/,/g, '');
                }
                parsedPrice = parseFloat(cleaned);
            }

            if (isNaN(parsedPrice)) {
                console.warn(`Failed to parse price: "${price}". Setting to 0.`);
                parsedPrice = 0;
            } else if (parsedPrice < 0) {
                console.warn(`Negative price detected: ${parsedPrice}. Setting to 0.`);
                parsedPrice = 0;
            }
        }

        // Final check for title after potential sanitization (future-proofing)
        const sanitizedTitle = title.trim();
        if (!sanitizedTitle) {
            return NextResponse.json({ error: 'error_title_required' }, { status: 400 });
        }

        // Determine product order
        let productOrder: number;
        if (order !== undefined && order !== null) {
            productOrder = Number(order);
            // Check for conflict
            const conflict = await prisma.product.findFirst({
                where: {
                    storeId,
                    categoryId: categoryId || null,
                    order: productOrder,
                    archived: false // Only conflict with active products
                }
            });
            if (conflict) {
                return NextResponse.json(
                    { error: 'error_order_conflict' },
                    { status: 400 }
                );
            }
        } else {
            // Auto-assign: max(order) + 1 within same category
            const last = await prisma.product.findFirst({
                where: { storeId, categoryId: categoryId ?? null },
                orderBy: { order: 'desc' },
                select: { order: true }
            });
            productOrder = last ? last.order + 1 : 1;
        }

        const productData: {
            name: string;
            price: number;
            order: number;
            imageUrl: string;
            affiliateUrl: string;
            storeId: string;
            archived: boolean;
            branchId?: string;
            categoryId?: string;
        } = {
            name: sanitizedTitle,
            price: parsedPrice,
            order: productOrder,
            imageUrl: image || '',
            affiliateUrl: url,
            storeId: storeId,
            archived: false
        };

        // Add branchId / categoryId if provided
        if (branchId) productData.branchId = branchId;
        if (categoryId) productData.categoryId = categoryId;

        const newProduct = await prisma.product.create({
            data: productData
        });

        // Invalidate cache for this store
        productCache.deletePattern(`products:${storeId}`);
        logger.info(`[CACHE INVALIDATE] POST products:${storeId}`);

        notifyStoreService();
        return NextResponse.json(newProduct);
    } catch (error) {
        logger.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    const { userId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        // VERIFY OWNERSHIP
        const product = await prisma.product.findUnique({
            where: { id },
            select: { storeId: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const hasAccess = await verifyStoreAccess(product.storeId!, userId);
        if (!hasAccess) {
            logger.warn(`[AUTH] Unauthorized delete attempt: User ${userId} -> Product ${id}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.product.delete({
            where: {
                id: id
            }
        });

        // Invalidate all product caches (safer than fetching storeId first)
        productCache.deletePattern('products:');
        logger.info(`[CACHE INVALIDATE] DELETE products:`);

        notifyStoreService();
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        logger.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
