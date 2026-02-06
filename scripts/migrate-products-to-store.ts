import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_STORE_ID = '6984f69469a68016b608074b';

async function migrateProducts() {
    try {
        console.log('Starting product migration...');

        // First, verify the store exists
        const store = await prisma.store.findUnique({
            where: { id: TARGET_STORE_ID }
        });

        if (!store) {
            console.error(`❌ Store with ID ${TARGET_STORE_ID} not found!`);
            console.log('Please create the store first or verify the ID is correct.');
            return;
        }

        console.log(`✅ Found store: ${store.name}`);

        // Find all products without a storeId or with a different storeId
        const productsToUpdate = await prisma.product.findMany({
            where: {
                OR: [
                    { storeId: { not: TARGET_STORE_ID } },
                    { storeId: null as any }
                ]
            }
        });

        console.log(`📦 Found ${productsToUpdate.length} products to migrate`);

        if (productsToUpdate.length === 0) {
            console.log('✅ All products are already assigned to the target store!');
            return;
        }

        // Update all products to belong to the target store
        const result = await prisma.product.updateMany({
            where: {
                OR: [
                    { storeId: { not: TARGET_STORE_ID } },
                    { storeId: null as any }
                ]
            },
            data: {
                storeId: TARGET_STORE_ID
            }
        });

        console.log(`✅ Successfully migrated ${result.count} products to store: ${store.name}`);
        console.log('Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateProducts()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
