import { logger } from './logger';
import type { ScrapedProductData } from '@/types';
import * as https from 'https';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

declare const process: {
    cwd: () => string;
    env: Record<string, string | undefined>;
};

// Re-validate resolved URLs to prevent SSRF bypass via redirect chains.
// amzn.to is intentionally excluded — it must resolve to a real Amazon domain.
const ALLOWED_AMAZON_DOMAINS = [
    'amazon.com', 'amazon.com.br', 'amazon.co.uk', 'amazon.de',
    'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.co.jp'
];

function isValidResolvedUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        const h = parsed.hostname;
        if (h === 'localhost' || h === '127.0.0.1' ||
            h.startsWith('192.168.') || h.startsWith('10.') ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
        return ALLOWED_AMAZON_DOMAINS.some(d => h === d || h.endsWith(`.${d}`));
    } catch {
        return false;
    }
}

function detectCurrency(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        if (hostname.includes('amazon.com.br')) return 'BRL';
        if (hostname.includes('amazon.co.uk')) return 'GBP';
        if (hostname.includes('amazon.de') || hostname.includes('amazon.fr') ||
            hostname.includes('amazon.it') || hostname.includes('amazon.es') ||
            hostname.includes('amazon.nl')) return 'EUR';
        if (hostname.includes('amazon.ca')) return 'CAD';
        if (hostname.includes('amazon.co.jp')) return 'JPY';
        return 'USD';
    } catch {
        return 'USD';
    }
}

function parsePrice(rawText: string, currency: string): number {
    if (!rawText) return 0;
    let cleaned = rawText.replace(/[^\d.,]/g, '').trim();
    if (!cleaned) return 0;
    // BRL and EUR use dot as thousands separator and comma as decimal (e.g. "1.299,90")
    if (currency === 'BRL' || currency === 'EUR') {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        // USD, GBP, CAD, JPY: comma is thousands separator (e.g. "1,299.99")
        cleaned = cleaned.replace(/,/g, '');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function resolveRedirect(url: string): Promise<string> {
    return new Promise((resolve) => {
        if (!url.includes('amzn.to')) {
            resolve(url);
            return;
        }

        const req = https.get(url, (res: any) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                logger.debug(`Resolved ${url} to ${res.headers.location}`);
                resolve(res.headers.location);
            } else {
                resolve(url);
            }
        });

        req.on('error', (e: any) => {
            logger.error('Error resolving redirect:', e);
            resolve(url);
        });

        req.end();
    });
}

const SCRAPER_TIMEOUT_MS = 60000;

function runScraperProcess(scriptPath: string, targetUrl: string, storageDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath, targetUrl], {
            env: {
                ...process.env,
                CRAWLEE_STORAGE_DIR: storageDir,
                CRAWLEE_SYSTEM_INFO_INTERVAL_MILLIS: '0',
                CRAWLEE_AVAILABLE_MEMORY_RATIO: '0',
                CRAWLEE_SYSTEM_INFO_V2: 'false'
            } as any
        }) as any;

        // Kill the child if it hangs
        const killTimer = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error('Scraper process timed out after 60 seconds'));
        }, SCRAPER_TIMEOUT_MS);

        const stdoutChunks: Buffer[] = [];
        let stderrData = '';

        child.stdout.on('data', (data: Buffer) => stdoutChunks.push(data));
        child.stderr.on('data', (data: any) => {
            stderrData += data.toString();
            logger.debug(`[Scraper Script]: ${data.toString().trim()}`);
        });

        child.on('close', (code: any) => {
            clearTimeout(killTimer);

            try {
                if (fs.existsSync(storageDir)) {
                    fs.rmSync(storageDir, { recursive: true, force: true });
                }
            } catch (e) {
                logger.error(`Failed to cleanup temp storage: ${e}`);
            }

            if (code !== 0) {
                reject(new Error(`Scraper failed (exit ${code}): ${stderrData || 'Unknown error'}`));
                return;
            }

            const stdoutData = Buffer.concat(stdoutChunks).toString('utf8');
            logger.debug(`Parsing scraper output (size: ${stdoutData.length})`);

            let result: any;
            try {
                result = JSON.parse(stdoutData.trim());
            } catch {
                const lines = stdoutData.trim().split('\n');
                try {
                    result = JSON.parse(lines[lines.length - 1]);
                } catch {
                    logger.error(`Failed to parse output. First 100: ${stdoutData.substring(0, 100)}`);
                    reject(new Error('Failed to parse scraper output'));
                    return;
                }
            }

            if (!result.success || !result.content) {
                reject(new Error('Invalid scraper output structure'));
                return;
            }

            resolve(result.content as string);
        });

        child.on('error', (err: any) => {
            clearTimeout(killTimer);
            reject(err);
        });
    });
}

function parseProductHtml(html: string, originalUrl: string, resolvedUrl: string): ScrapedProductData {
    const $ = cheerio.load(html);
    const currency = detectCurrency(resolvedUrl);

    const h1 = $('h1').first().text().trim();
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const docTitle = $('title').text().trim();
    logger.info(`[SCRAPER DEBUG] H1: "${h1}", OG:Title: "${ogTitle}", DocTitle: "${docTitle}"`);

    // Detect captcha/block pages — throw so the caller gets null, not garbage data
    const isBlocked =
        ['Robot Check', 'Captcha', 'Verificação de Segurança', 'Sécurité',
            'Sicherheitsüberprüfung', 'Comprobación de seguridad',
            'Enter the characters you see below'
        ].some(ind => docTitle.includes(ind)) ||
        $('form[action="/errors/validateCaptcha"]').length > 0;

    if (isBlocked) {
        throw new Error('Amazon returned a captcha/security check page');
    }

    const title = h1 || ogTitle || docTitle;
    const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') || '';

    // --- Image extraction ---
    let image = '';
    const primeSelectors = [
        '#main-image-container img', '#imgTagWrapperId img',
        '#landingImage', '#main-image', '#imgBlkFront'
    ];

    let amazonImg: ReturnType<typeof $> | null = null;
    for (const selector of primeSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
            const img = $(elements[i]);
            const src = img.attr('src') || '';
            if (!src.includes('pixel.gif') && !src.includes('transparent-pixel') && !src.includes('1x1')) {
                amazonImg = img;
                break;
            }
        }
        if (amazonImg) break;
    }

    if (!amazonImg) {
        const secondaryImages = $('img.a-dynamic-image');
        for (let i = 0; i < secondaryImages.length; i++) {
            const img = $(secondaryImages[i]);
            if (!(img.attr('src') || '').includes('pixel.gif')) {
                amazonImg = img;
                break;
            }
        }
    }

    if (amazonImg) {
        const dynamic = amazonImg.attr('data-a-dynamic-image');
        if (dynamic) {
            try {
                const urls = JSON.parse(dynamic) as Record<string, [number, number]>;
                // Sort by area (width × height) descending to pick highest resolution
                const best = Object.entries(urls)
                    .sort(([, a], [, b]) => (b[0] * b[1]) - (a[0] * a[1]))[0];
                if (best) image = best[0];
            } catch { }
        }
        if (!image) {
            image = amazonImg.attr('data-old-hires') || amazonImg.attr('src') || '';
        }
    }

    if (!image) {
        image = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('link[rel="image_src"]').attr('href') || '';
    }

    if (!image) {
        image = $('#imgTagWrapperId img, #altImages img').first().attr('src') ||
            $('img').first().attr('src') || '';
    }

    logger.info(`[SCRAPER DEBUG] Selected Image URL: "${image}"`);

    // --- Price ---
    let priceText = '';
    const priceSelectors = [
        '.priceToPay .a-offscreen',
        '#corePrice_feature_div .a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price .a-offscreen',
        '[class*="price"] [class*="offscreen"]',
        '[class*="price"]',
        '[id*="price"]'
    ];
    for (const sel of priceSelectors) {
        const text = $(sel).first().text().trim();
        if (text && /\d/.test(text)) { priceText = text; break; }
    }
    const price = parsePrice(priceText, currency);

    // --- Rating ---
    let rating = 0;
    for (const sel of [
        '#acrPopover .a-icon-alt',
        '[data-hook="average-star-rating"] .a-icon-alt',
        '#averageCustomerReviews .a-icon-alt',
        'span[data-hook="rating-out-of-text"]'
    ]) {
        const text = $(sel).first().text().trim();
        if (text) {
            const m = text.match(/^([\d.]+)/);
            if (m) { rating = parseFloat(m[1]); break; }
        }
    }

    // --- Review count ---
    let reviewsCount = 0;
    for (const sel of [
        '#acrCustomerReviewText',
        '[data-hook="total-review-count"]',
        '#acrCustomerReviewLink'
    ]) {
        const text = $(sel).first().text().trim();
        if (text) {
            const m = text.match(/[\d,]+/);
            if (m) { reviewsCount = parseInt(m[0].replace(/,/g, ''), 10); break; }
        }
    }

    // --- Availability ---
    let available = true;
    const availText = $('#availability span').first().text().trim().toLowerCase();
    if (availText) {
        const unavailableTerms = ['unavailable', 'out of stock', 'indisponível', 'não disponível', 'épuisé', 'nicht verfügbar'];
        available = !unavailableTerms.some(t => availText.includes(t));
    }
    if ($('#outOfStock').length > 0) available = false;

    // --- Specifications ---
    const specifications: Record<string, string> = {};
    $('#productDetails_techSpec_section_1 tr, #productDetails_feature_div .a-expander-content tr, #prodDetails .a-section tr').each((_, row) => {
        const key = $(row).find('th').text().trim();
        const val = $(row).find('td').text().trim().replace(/\s+/g, ' ');
        if (key && val) specifications[key] = val;
    });

    return {
        url: originalUrl,
        title: title || 'Unknown Product',
        description,
        images: image ? [image] : [],
        price,
        currency,
        originalPrice: price,
        available,
        specifications,
        rating,
        reviewsCount
    };
}

export async function scrapeProduct(url: string): Promise<ScrapedProductData | null> {
    try {
        const targetUrl = await resolveRedirect(url);

        // Validate the resolved URL — prevents SSRF bypass via amzn.to redirect chains
        if (!isValidResolvedUrl(targetUrl)) {
            logger.error(`Resolved URL failed SSRF validation: ${targetUrl}`);
            return null;
        }

        logger.info(`Starting scrape for URL: ${targetUrl}`);

        const uniqueStorageDir = path.join(os.tmpdir(), `crawlee-temp-${crypto.randomUUID()}`);
        const scriptPath = path.join(process.cwd(), 'public', 'scripts', 'scraper-crawlee.mjs');

        logger.debug(`Spawning scraper script at: ${scriptPath} with storage ${uniqueStorageDir}`);

        const html = await runScraperProcess(scriptPath, targetUrl, uniqueStorageDir);
        return parseProductHtml(html, url, targetUrl);

    } catch (error: any) {
        logger.error(`Error in scrapeProduct: ${error.message}`);
        return null;
    }
}
