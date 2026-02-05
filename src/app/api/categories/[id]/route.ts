import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { error: 'Falha ao excluir categoria' },
            { status: 500 }
        );
    }
}
