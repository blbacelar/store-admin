const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Checking for remaining products with null storeId...');
    try {
        const count = await prisma.product.count({
            where: {
                storeId: null
            }
        });

        console.log(`Found ${count} products with null storeId.`);

        if (count > 0) {
            const products = await prisma.product.findMany({
                where: { storeId: null },
                select: { id: true, name: true }
            });
            console.log('Sample IDs:', products.slice(0, 5));
        }

    } catch (e) {
        console.error('Check Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
