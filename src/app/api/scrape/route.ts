import { NextResponse } from 'next/server';
import { scrapeProduct } from '@/app/lib/productScraper';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const start = Date.now();
        console.log(`Scraping URL: ${url}`);

        const productData = await scrapeProduct(url);

        console.log(`Scraping took ${Date.now() - start}ms`);

        if (!productData) {
            return NextResponse.json({ error: 'Failed to scrape product' }, { status: 500 });
        }

        return NextResponse.json(productData);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
