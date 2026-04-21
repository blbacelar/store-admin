import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
    console.log('Inspecting products...');
    try {
        const products = await prisma.product.findMany({
            take: 5
        });

        console.log(`Found ${products.length} sample products.`);
        products.forEach((product) => {
            console.log(`ID: ${product.id}, Name: ${product.name}, StoreId: ${product.storeId} (Type: ${typeof product.storeId})`);
        });
    } catch (error) {
        console.error('Inspection Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();