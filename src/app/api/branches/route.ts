import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        const branches = await prisma.branch.findMany({
            where: {
                storeId: storeId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, storeId } = body;

        if (!name || !storeId) {
            return NextResponse.json({ error: 'Name and Store ID are required' }, { status: 400 });
        }

        const branch = await prisma.branch.create({
            data: {
                name,
                storeId,
            },
        });

        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error creating branch:', error);
        return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
    }
}
