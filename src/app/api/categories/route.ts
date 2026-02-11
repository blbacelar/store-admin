import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/apiAuth';

export async function GET(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');
        const branchId = searchParams.get('branchId');

        if (!storeId) {
            return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
        }

        const whereClause: any = {
            storeId: storeId
        };

        // Filter by branchId if provided
        if (branchId) {
            whereClause.branchId = branchId;
        }

        const categories = await prisma.category.findMany({
            where: whereClause,
            orderBy: {
                name: 'asc'
            }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (!auth.authorized) {
        return auth.response;
    }

    try {
        const { name, storeId } = await request.json();

        if (!name || !storeId) {
            return NextResponse.json({ error: 'Name and storeId are required' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                storeId
            }
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Category already exists in this store' }, { status: 400 });
        }
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
