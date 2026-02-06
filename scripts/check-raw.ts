import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRaw() {
    console.log('Checking raw MongoDB data...');
    try {
        console.log('Database URL:', process.env.DATABASE_URL);

        // Find products where storeId is null or missing
        const rawProducts = await prisma.$runCommandRaw({
            find: "products",
            filter: {
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ]
            }
        });

        console.log('Raw query result:', JSON.stringify(rawProducts, null, 2));

        // @ts-ignore
        const batch = rawProducts?.cursor?.firstBatch || [];
        console.log(`Found ${batch.length} problematic documents.`);

        if (batch.length > 0) {
            console.log('Sample problematic document:', batch[0]);

            // Fix them using raw update
            console.log('Attempting raw update...');
            const updateResult = await prisma.$runCommandRaw({
                update: "products",
                updates: [
                    {
                        q: { $or: [{ storeId: { $exists: false } }, { storeId: null }] },
                        u: { $set: { storeId: { $oid: "6984f69469a68016b608074b" } } },
                        multi: true
                    }
                ]
            });
            console.log('Update result:', JSON.stringify(updateResult, null, 2));
        } else {
            console.log('No problematic documents found via raw query.');

            // Check total count
            const count = await prisma.$runCommandRaw({
                count: "products"
            });
            console.log('Total documents in collection:', JSON.stringify(count, null, 2));
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkRaw();
