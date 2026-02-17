import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting product export for AI...');

    // Fetch all products
    const products = await prisma.product.findMany();

    console.log(`Found ${products.length} total products.`);

    const productsToProcess = products
        .filter(p => p.description && p.description.trim().length > 0)
        .map(p => ({
            id: p.id,
            current_name: p.name,
            target_name: p.description, // The current description becomes the new name
            instruction: "Generate an SEO optimized description for this product based on the 'target_name'."
        }));

    console.log(`Found ${productsToProcess.length} products with descriptions to process.`);

    if (productsToProcess.length === 0) {
        console.log('No products found with descriptions. Exiting.');
        return;
    }

    const outputPath = path.join(process.cwd(), 'products_for_ai.json');
    fs.writeFileSync(outputPath, JSON.stringify(productsToProcess, null, 2));

    console.log(`Successfully exported ${productsToProcess.length} products to:`);
    console.log(outputPath);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
