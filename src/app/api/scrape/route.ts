import { NextResponse } from 'next/server';
import { scrapeProduct } from '@/app/lib/productScraper';
import { requireAuth } from '@/app/lib/apiAuth';
import { rateLimit } from '@/app/lib/rateLimit';
import { logger } from '@/app/lib/logger';

// Whitelist allowed domains to prevent SSRF attacks
const ALLOWED_DOMAINS = [
    'amazon.com',
    'amazon.com.br',
    'amazon.co.uk',
    'amazon.de',
    'amazon.fr',
    'amazon.it',
    'amazon.es',
    'amazon.ca',
    'amazon.co.jp'
];

function isValidAmazonUrl(url: string): boolean {
    try {
        const parsed = new URL(url);

        // Block localhost and private IPs
        if (parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1' ||
            parsed.hostname.startsWith('192.168.') ||
            parsed.hostname.startsWith('10.') ||
            parsed.hostname.startsWith('172.16.') ||
            parsed.hostname.startsWith('172.17.') ||
            parsed.hostname.startsWith('172.18.') ||
            parsed.hostname.startsWith('172.19.') ||
            parsed.hostname.startsWith('172.20.') ||
            parsed.hostname.startsWith('172.21.') ||
            parsed.hostname.startsWith('172.22.') ||
            parsed.hostname.startsWith('172.23.') ||
            parsed.hostname.startsWith('172.24.') ||
            parsed.hostname.startsWith('172.25.') ||
            parsed.hostname.startsWith('172.26.') ||
            parsed.hostname.startsWith('172.27.') ||
            parsed.hostname.startsWith('172.28.') ||
            parsed.hostname.startsWith('172.29.') ||
            parsed.hostname.startsWith('172.30.') ||
            parsed.hostname.startsWith('172.31.')) {
            return false;
        }

        // Only allow HTTPS
        if (parsed.protocol !== 'https:') {
            return false;
        }

        // Check if domain is in whitelist
        return ALLOWED_DOMAINS.some(domain =>
            parsed.hostname === domain ||
            parsed.hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
}

export async function POST(request: Request) {
    // Check authentication
    const auth = await requireAuth();
    if (auth.authorized === false) {
        return auth.response;
    }

    // Apply rate limiting - 5 requests per minute per user
    const userId = (auth.session.user as { id: string }).id;
    const rateLimitResult = rateLimit(`scrape:${userId}`, 5, 60000);

    if (rateLimitResult.limited) {
        logger.warn(`Rate limit exceeded for user ${userId}`);
        return rateLimitResult.response!;
    }

    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate URL to prevent SSRF attacks
        if (!isValidAmazonUrl(url)) {
            return NextResponse.json({
                error: 'Invalid URL. Only Amazon URLs are allowed.'
            }, { status: 400 });
        }

        const start = Date.now();
        logger.debug(`Scraping URL: ${url}`);

        const productData = await scrapeProduct(url);

        logger.debug(`Scraping took ${Date.now() - start}ms`);

        if (!productData) {
            return NextResponse.json({ error: 'Failed to scrape product' }, { status: 500 });
        }

        return NextResponse.json(productData);
    } catch (error) {
        logger.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
