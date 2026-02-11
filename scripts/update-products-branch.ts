import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANCH_ID = '698aa7befb290759f8791c0d';

async function main() {
    console.log(`Updating all products to have branchId: ${BRANCH_ID}...`);

    try {
        const result = await (prisma.product as any).updateMany({
            data: {
                branchId: BRANCH_ID,
            },
        });

        console.log(`Successfully updated ${result.count} products.`);
    } catch (error) {
        console.error('Error updating products:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
