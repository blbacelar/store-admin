import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_STORE_ID = '6984f69469a68016b608074b';

async function migrate() {
    console.log('Starting direct migration (simplified)...');
    try {
        const count = await prisma.product.count();
        console.log(`Total products: ${count}`);

        const result = await prisma.product.updateMany({
            where: {
                storeId: { not: TARGET_STORE_ID }
            },
            data: {
                storeId: TARGET_STORE_ID
            }
        });

        console.log(`Updated ${result.count} products.`);
    } catch (error) {
        console.error('Migration error:', error);
        console.log('Tip: If updateMany skipped records missing the field, you might need to use MongoDB Compass.');
    } finally {
        await prisma.$disconnect();
    }
}

migrate();