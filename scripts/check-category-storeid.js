const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
    console.log('Checking for Categories with null storeId...');
    try {
        // We have to use raw query or blindly findMany because findMany might crash if schema mismatches field type
        // But since we suspect storeId is null in DB but String in schema, Prisma might throw on findMany.
        // Let's try to count first with a WHERE that targets the bad data.

        // Note: If schema says String, we can't easily query where: { storeId: null } in typescript/client gen.
        // But in JS we can try.

        const count = await prisma.category.count({
            where: {
                storeId: null
            }
        });

        console.log(`Found ${count} categories with null storeId.`);

        if (count > 0) {
            console.log('These categories are likely causing the P2032 error when fetched via Product include.');
        }

    } catch (e) {
        console.error('Check Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
