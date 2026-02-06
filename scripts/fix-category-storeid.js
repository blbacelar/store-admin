const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_STORE_ID = '6984f69469a68016b608074b';

async function fixCategories() {
    console.log('Starting Force Fix for Category StoreIDs...');
    try {
        // Update ALL categories blindly.
        // This bypasses the validation issue where we can't filter by { storeId: null }
        const result = await prisma.category.updateMany({
            where: {},
            data: {
                storeId: TARGET_STORE_ID
            }
        });

        console.log(`✅ Success! Updated ${result.count} categories to store ${TARGET_STORE_ID}`);
    } catch (e) {
        console.error('Fix Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixCategories();
