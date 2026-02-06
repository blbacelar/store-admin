import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { notifyStoreService } from '@/app/lib/socket';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const products = await prisma.product.findMany({
            where: {
                storeId: storeId
            },
            include: {
                category: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedProducts = products.map(product => ({
            id: product.id,
            sheetId: product.id.substring(product.id.length - 6), // Use last 6 chars as display ID
            title: product.name,
            price: product.price,
            category: product.category?.name || 'Uncategorized',
            image: product.imageUrl,
            url: product.affiliateUrl,
            archived: product.archived
        }));

        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { title, price, image, url, storeId } = await request.json();

        // Validate
        if (!title || !url || !storeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Parse price with locale awareness
        let parsedPrice = 0;
        if (price && price !== 'No Price Found') {
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
            if (isNaN(parsedPrice)) parsedPrice = 0;
        }

        // Final check for title after potential sanitization (future-proofing)
        const sanitizedTitle = title.trim();
        if (!sanitizedTitle) {
            return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                name: sanitizedTitle,
                price: parsedPrice,
                imageUrl: image || '',
                affiliateUrl: url,
                storeId: storeId,
                archived: false
            }
        });

        notifyStoreService();
        return NextResponse.json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await prisma.product.delete({
            where: {
                id: id
            }
        });

        notifyStoreService();
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
