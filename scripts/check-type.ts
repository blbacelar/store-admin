import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkType() {
    console.log('Checking storeId BSON type...');
    try {
        // use $type operator to check if it's an ObjectId (type 7) or String (type 2) or Object (type 3)

        const objectIds = await prisma.$runCommandRaw({
            find: "products",
            filter: { storeId: { $type: 7 } } // 7 = ObjectId
        });

        // @ts-ignore
        const oidCount = objectIds?.cursor?.firstBatch?.length ?? 0;
        console.log(`Documents with ObjectId type: ${oidCount}`);

        const strings = await prisma.$runCommandRaw({
            find: "products",
            filter: { storeId: { $type: 2 } } // 2 = String
        });

        // @ts-ignore
        const stringCount = strings?.cursor?.firstBatch?.length ?? 0;
        console.log(`Documents with String type: ${stringCount}`);

        const objects = await prisma.$runCommandRaw({
            find: "products",
            filter: { storeId: { $type: 3 } } // 3 = Object
        });

        // @ts-ignore
        const objectCount = objects?.cursor?.firstBatch?.length ?? 0;
        console.log(`Documents with Object type (BAD): ${objectCount}`);

        const nulls = await prisma.$runCommandRaw({
            find: "products",
            filter: { storeId: { $type: 10 } } // 10 = Null
        });

        // @ts-ignore
        const nullCount = nulls?.cursor?.firstBatch?.length ?? 0;
        console.log(`Documents with Null type: ${nullCount}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkType();
