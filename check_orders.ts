import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function isPortuguese(name: string): boolean {
    if (/[çãõâêôáéíóúàü]/.test(name)) return true;
    const ptWords = /\b(guia|finanças|empreendedorismo|dinheiro|pequeno|empreendedor|sonhos|moleque|cuidar|aprenda|seu|sua|livro|para\s+o|turma\s+da|infantil|limocraft)\b/i;
    return ptWords.test(name);
}

async function main() {
    for (const catName of ['Home & Comfort', 'School Supplies']) {
        const cat = await prisma.category.findFirst({ where: { name: { equals: catName, mode: 'insensitive' } } });
        if (!cat) { console.log(`Not found: ${catName}`); continue; }
        const products = await prisma.product.findMany({
            where: { categoryId: cat.id },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, order: true },
        });
        console.log(`\n${catName} (${products.length} products):`);
        for (const p of products) {
            const lang = isPortuguese(p.name) ? 'PT' : 'EN';
            console.log(`  [order:${p.order}][${lang}] ${p.name}`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
