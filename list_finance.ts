import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const cat = await prisma.category.findFirst({
        where: { name: { contains: 'Financeiro', mode: 'insensitive' } },
    });
    if (!cat) { console.log('Not found'); return; }
    console.log('Category:', cat.name, cat.id);

    const products = await prisma.product.findMany({
        where: { categoryId: cat.id },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, order: true },
    });
    products.forEach(p => console.log(`  id=${p.id} [order:${p.order}] "${p.name}"`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
