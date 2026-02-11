const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env' });

// Branch IDs from .env.local
const BRAZIL_BRANCH_ID = '698aa7befb290759f8791c0d';
const USA_BRANCH_ID = '698aa7c2fb290759f8791c0e';

// Portuguese category names (to be assigned to Brazil branch)
const portugueseCategories = [
    'Financeiro & Passatempo',
    'Papelaria & Escola',
    'Brinquedos STEM',
    'Esporte & Lazer',
    'Tecnologia',
    'Casa & Conforto',
    'Testing',
    'RealTime'
];

// English category names (to be assigned to USA branch)
const englishCategories = [
    'Stem Toys',
    'Home & Comfort',
    'Sports & Leisure',
    'Finance',
    'School Supplies',
    'Technology'
];

async function migrateCategories() {
    const client = new MongoClient(process.env.DATABASE_URL);

    try {
        console.log('Starting category migration...\n');

        await client.connect();
        console.log('✅ Connected to database\n');

        const db = client.db();
        const categoriesCollection = db.collection('categories');

        // Get all categories
        const allCategories = await categoriesCollection.find({}).toArray();
        console.log(`Found ${allCategories.length} categories\n`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const category of allCategories) {
            // Skip if already has a branch assigned
            if (category.branchId) {
                console.log(`⏭️  Skipping "${category.name}" - already has branch`);
                skippedCount++;
                continue;
            }

            let targetBranchId = null;

            // Check if category name is in Portuguese list
            if (portugueseCategories.includes(category.name)) {
                targetBranchId = new ObjectId(BRAZIL_BRANCH_ID);
                console.log(`🇧🇷 Assigning "${category.name}" to Brazil branch`);
            }
            // Check if category name is in English list
            else if (englishCategories.includes(category.name)) {
                targetBranchId = new ObjectId(USA_BRANCH_ID);
                console.log(`🇺🇸 Assigning "${category.name}" to USA branch`);
            }
            else {
                console.log(`⚠️  Unknown category: "${category.name}" - skipping`);
                skippedCount++;
                continue;
            }

            // Update category with branchId
            await categoriesCollection.updateOne(
                { _id: category._id },
                { $set: { branchId: targetBranchId } }
            );

            updatedCount++;
        }

        console.log('\n✅ Migration complete!');
        console.log(`   Updated: ${updatedCount} categories`);
        console.log(`   Skipped: ${skippedCount} categories`);

    } catch (error) {
        console.error('❌ Error during migration:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

migrateCategories();
