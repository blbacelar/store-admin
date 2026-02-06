const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_STORE_ID = '6984f69469a68016b608074b';

async function migrate() {
    console.log('Starting direct migration (simplified)...');
    try {
        // Update all products that don't match the target store ID.
        // Since storeId is required in the schema, we rely on 'not' to catch records 
        // that have a different ID. For records completely missing the field, 
        // standard Prisma might skip them if they violate the schema, 
        // but 'updateMany' usually works on the raw collection level in MongoDB.
        // If this fails, we will try to update EVERYTHING blindly (no filter).

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
    } catch (e) {
        console.error('Migration error:', e);

        // Fallback: Try RAW query if possible or just log advice
        console.log('Tip: If updateMany skipped records missing the field, you might need to use MongoDB Compass.');
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
