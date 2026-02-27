import { scrapeProduct } from './src/app/lib/productScraper';

async function test() {
    try {
        console.log('Testing scraping...');
        const result = await scrapeProduct('https://amzn.to/4s6PLdL');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
