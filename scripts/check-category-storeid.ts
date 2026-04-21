import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
    console.log('Checking for Categories with null storeId...');
    try {
        const count = await prisma.category.count({
            where: {
                storeId: null as any
            }
        });

        console.log(`Found ${count} categories with null storeId.`);

        if (count > 0) {
            console.log('These categories are likely causing the P2032 error when fetched via Product include.');
        }
    } catch (error) {
        console.error('Check Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();