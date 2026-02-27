process.env.NODE_ENV = 'development';
import { scrapeProduct } from './src/app/lib/productScraper';

async function test() {
    try {
        console.log('Testing scraping https://amzn.to/4cbva3j ...');
        const urlToTest = 'https://amzn.to/4cbva3j';
        const result = await scrapeProduct(urlToTest);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
