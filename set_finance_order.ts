/**
 * Script: Set display order for specified categories
 * 
 * Target sequences based on visual layout (left-to-right, top-to-bottom):
 * 
 * Home & Comfort:
 *  1. Kids couch for playroom...
 *  2. Astronaut galaxy projector...
 *  3. Glow in the dark blanket...
 * 
 * School Supplies:
 *  1. 3D Printing pen...
 *  2. Hardshell luggage scooter...
 *  3. 46-Piece washable...
 *  4. Shuttle art 102 PCS...
 *  5. Rocketbook core...
 *  6. 80 Colors alcohol based...
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MANUAL_ORDERS: Record<string, string[]> = {
    "Home & Comfort": [
        "Kids couch for playroom",
        "Astronaut galaxy projector",
        "Glow in the dark blanket"
    ],
    "Casa & Conforto": [
        "Móveis secionais para engatinhar", // Kids couch
        "Projetor galáxia astronauta",
        "Manta infantil que brilha no escuro"
    ],
    "School Supplies": [
        "3D Printing pen",
        "Hardshell luggage scooter",
        "46-Piece washable",
        "Shuttle art 102 PCS",
        "Rocketbook core",
        "80 Colors alcohol based"
    ],
    "Papelaria & Escola": [
        "Caneta Impressora 3D",
        "Bagagem p/crianças Baotree", // Luggage scooter equivalent
        "Kit Material Escolar (42 Itens)", // Washable supplies equiv
        "Cores de lencinho", // Placeholder if needed, but let's use what's in logs
        "Caderno ecológico inteligente", // Rocketbook
        "Caneta marcador p/colorir (80 cores)"
    ],
    "Finance": [
        "Children's mystery board game",
        "Money activity set for kids",
        "Torlam money board games",
        "Financial literacy flash cards",
        "Guia de finanças",
        "Como cuidar do seu dinheiro"
    ],
    "Financeiro & Passatempo": [
        "Jogo suspeito", // mystery board game
        "Administrando o seu dinheiro", // Money activity set
        "Turma da Mônica", // Placeholder if applicable
        "Finanças",
        "Guia de finanças",
        "Como cuidar do seu dinheiro"
    ],
    "Sports & Leisure": [
        "Truck with back trailer",
        "Self-balancing toddler kick",
        "Maxshot electric scooter",
        "Arcade Basketball game",
        "Silent basketball dribbling",
        "Kids bike helmet set"
    ],
    "Esporte & Lazer": [
        "Carro elétrico infantil Eclipse", // Truck
        "Patinete p/adolescentes", // Kick scooter
        "Maxshot", // Electric scooter
        "Cesta de basquete",
        "Bola de basquete silenciosa",
        "Zippy Toys Kit de Proteção" // Helmet set
    ],
    "Stem Toys": [
        "Handheld game for kids",
        "Science experiment kit",
        "Kids Musical Instruments",
        "Fun Memory game",
        "2 in 1 Water Doodle",
        "Dimple building blocks"
    ],
    "Brinquedos STEM": [
        "Console portátil de videogame", // Handheld game
        "Laboratório manual do mundo", // Science kit
        "Instrumentos musicais em madeira",
        "Jogo educacional terapêutico para ativar memoria", // Fun Memory
        "Tapete de rabiscos de água", // Water Doodle
        "Coordenação motora, criatividade" // Dimple blocks equiv
    ],
    "Technology": [
        "HeroMask VR headset",
        "PlayStation 5 console",
        "Nintendo switch OLED",
        "Drawing robot for kids",
        "Kids watch, boys watch",
        "Redragon H510 PRO"
    ],
    "Tecnologia": [
        "Óculos realidade virtual 3D",
        "5 Disc Edition console",
        "Nintendo switch OLED",
        "Robô de desenho inteligente",
        "Relógio digital infantil",
        "Redragon Zeus Pro"
    ]
};

async function processCategory(catName: string, keywords: string[]) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Searching for categories named: "${catName}"`);

    const categories = await prisma.category.findMany({
        where: { name: { equals: catName, mode: 'insensitive' } },
        include: { branch: true }
    });

    if (categories.length === 0) {
        console.warn(`  ⚠  Category "${catName}" not found — skipping.`);
        return;
    }

    console.log(`  Found ${categories.length} category instance(s).`);

    for (const category of categories) {
        const branchName = category.branch?.name || 'Main Store';
        console.log(`\n  Processing category instance in branch: "${branchName}" (ID: ${category.id})`);

        const products = await prisma.product.findMany({
            where: { categoryId: category.id },
            select: { id: true, name: true, order: true },
        });

        console.log(`    ${products.length} products found in this category instance`);

        let counter = 1;
        let matchedIds = new Set<string>();

        for (const keyword of keywords) {
            const match = products.find(p =>
                p.name.toLowerCase().includes(keyword.toLowerCase()) && !matchedIds.has(p.id)
            );

            if (match) {
                await prisma.product.update({
                    where: { id: match.id },
                    data: { order: counter }
                });
                console.log(`    [${counter}] Match: "${match.name}"`);
                matchedIds.add(match.id);
                counter++;
            } else {
                console.warn(`    ⚠  No match found for keyword: "${keyword}"`);
            }
        }

        // Assign order to remaining products
        const remaining = products.filter(p => !matchedIds.has(p.id));
        if (remaining.length > 0) {
            console.log(`\n    Handling ${remaining.length} remaining products (alphabetic sequence)...`);
            remaining.sort((a, b) => a.name.localeCompare(b.name));
            for (const p of remaining) {
                await prisma.product.update({
                    where: { id: p.id },
                    data: { order: counter }
                });
                console.log(`    [${counter}] Rem: "${p.name}"`);
                counter++;
            }
        }
    }

    console.log(`\n  ✅ Finished all instances of "${catName}"`);
}

async function main() {
    for (const [catName, keywords] of Object.entries(MANUAL_ORDERS)) {
        await processCategory(catName, keywords);
    }
    console.log(`\n${'─'.repeat(50)}`);
    console.log('All done!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
