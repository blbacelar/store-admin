import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_STORE_ID = '6984f69469a68016b608074b';

async function fix() {
    console.log('Starting Force Fix for Null StoreIDs...');
    try {
        const result = await prisma.product.updateMany({
            where: {},
            data: {
                storeId: TARGET_STORE_ID
            }
        });

        console.log(`✅ Success! Updated ${result.count} products to store ${TARGET_STORE_ID}`);
    } catch (error) {
        console.error('Fix Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fix();