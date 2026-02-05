import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const body = await request.json();
        const { archived } = body;

        if (typeof archived !== 'boolean') {
            return NextResponse.json({ error: 'Archived must be a boolean' }, { status: 400 });
        }

        const updatedProduct = await prisma.product.update({
            where: {
                id: idParam
            },
            data: {
                archived
            }
        });

        return NextResponse.json({ success: true, archived: updatedProduct.archived });
    } catch (error) {
        console.error('Error archiving product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
