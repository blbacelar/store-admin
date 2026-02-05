import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
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
        const { title, price, image, url } = await request.json();

        // Validate
        if (!title || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                name: title,
                price: parseFloat(price.replace(/[^0-9.]/g, '')) || 0, // Ensure float
                imageUrl: image || '',
                affiliateUrl: url,
                archived: false
                // category is optional, so we don't set it initially
            }
        });

        return NextResponse.json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('index'); // Maintaining query param name 'index' but it contains the ID now

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await prisma.product.delete({
            where: {
                id: id
            }
        });

        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
