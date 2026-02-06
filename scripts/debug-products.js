const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    console.log('Inspecting products...');
    try {
        const products = await prisma.product.findMany({
            take: 5
        });

        console.log(`Found ${products.length} sample products.`);
        products.forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}, StoreId: ${p.storeId} (Type: ${typeof p.storeId})`);
        });

    } catch (e) {
        console.error('Inspection Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();
