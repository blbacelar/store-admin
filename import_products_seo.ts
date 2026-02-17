import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting product SEO import...');

    // Expected filename matches my previous instruction
    const fileName = 'products_with_seo.json';
    const inputPath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(inputPath)) {
        console.error(`Error: Input file not found at ${inputPath}`);
        console.error(`Please ensure you have saved the AI-processed file as "${fileName}" in the project root.`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(inputPath, 'utf-8');
    let productsToImport;

    try {
        productsToImport = JSON.parse(rawData);
    } catch (e) {
        console.error('Error parsing JSON file:', e);
        process.exit(1);
    }

    if (!Array.isArray(productsToImport)) {
        console.error('Error: JSON content must be an array of objects.');
        process.exit(1);
    }

    console.log(`Found ${productsToImport.length} products to update.`);

    let successCount = 0;
    let errorCount = 0;

    for (const item of productsToImport) {
        try {
            // Validate required fields
            if (!item.id || !item.target_name) {
                console.warn(`Skipping item ${item.id || 'unknown'}: Missing id or target_name`);
                continue;
            }

            // flexible check for the description field, prioritizing 'generated_description' as instructed
            const newDescription = item.generated_description || item.seo_description || item.description;

            if (!newDescription) {
                console.warn(`Skipping item ${item.id}: No new description found (looked for generated_description, seo_description, description)`);
                continue;
            }

            await prisma.product.update({
                where: { id: item.id },
                data: {
                    name: item.target_name,
                    description: newDescription
                }
            });

            console.log(`Updated product ${item.id}: ${item.target_name.substring(0, 30)}...`);
            successCount++;

        } catch (error) {
            console.error(`Failed to update product ${item.id}:`, error);
            errorCount++;
        }
    }

    console.log('\n--- Import Summary ---');
    console.log(`Total processed: ${productsToImport.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

    // Invalidate cache if it exists
    try {
        // Dynamic import to avoid issues if cache lib assumes certain env vars
        // purely optional best effort
        // @ts-ignore
        const { productCache } = await import('./src/app/lib/cache');
        if (productCache) {
            productCache.deletePattern('products:');
            console.log('Product cache invalidated.');
        }
    } catch (e) {
        // ignore cache errors in script
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
