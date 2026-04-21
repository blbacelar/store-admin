import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_STORE_ID = '6984f69469a68016b608074b';

async function migrate() {
    console.log('Starting direct migration...');
    try {
        const result = await prisma.product.updateMany({
            where: {
                OR: [
                    { storeId: { not: TARGET_STORE_ID } },
                    { storeId: { isSet: false } as any }
                ]
            },
            data: {
                storeId: TARGET_STORE_ID
            }
        });

        console.log(`Updated ${result.count} products.`);
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();