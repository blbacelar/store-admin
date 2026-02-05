import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const body = await request.json();
        const { title, categoryId } = body;

        // Note: categoryId is optional now
        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: idParam
            },
            data: {
                name: title,
                categoryId: categoryId || null // If empty string/undefined, disconnect category
            }
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;

        const product = await prisma.product.findUnique({
            where: {
                id: idParam
            },
            include: {
                category: true
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
            image: product.imageUrl,
            url: product.affiliateUrl,
            archived: product.archived
        };

        return NextResponse.json(formattedProduct);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
