import { browserPool } from './browserPool';
import { logger } from './logger';
import type { ScrapedProductData } from '@/types';

import * as https from 'https';

function resolveRedirect(url: string): Promise<string> {
    return new Promise((resolve) => {
        if (!url.includes('amzn.to')) {
            resolve(url);
            return;
        }

        const req = https.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                logger.debug(`Resolved ${url} to ${res.headers.location}`);
                resolve(res.headers.location);
            } else {
                resolve(url);
            }
        });

        req.on('error', (e) => {
            logger.error('Error resolving redirect:', e);
            resolve(url);
        });

        req.end();
    });
}

export async function scrapeProduct(url: string): Promise<ScrapedProductData | null> {
    let page = null;

    try {
        // Resolve short URLs first to avoid Puppeteer redirect issues
        const targetUrl = await resolveRedirect(url);

        // Get page from browser pool
        page = await browserPool.getPage();

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Check if we hit Amazon's bot detection page
        const pageText = await page.evaluate(() => document.body.innerText);
        if (pageText.includes('Continuar comprando') || pageText.includes('Continue shopping')) {
            logger.warn('Bot detection page detected, waiting for product page...');

            // Try clicking the continue button if it exists
            try {
                await page.click('a[href*="continue"]', { timeout: 5000 });
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
            } catch (e) {
                // Button might not exist or already navigated, continue
                logger.debug('Continue button not found or already navigated');
            }

            // Wait for product title to appear
            try {
                await page.waitForSelector('#productTitle', { timeout: 15000 });
            } catch (e) {
                logger.error('Product title never appeared after bot detection');
                throw new Error('Amazon bot detection: product page did not load');
            }
        }

        // Extract Data
        const data = await page.evaluate(() => {
            const title = document.querySelector('#productTitle')?.textContent?.trim() ||
                document.querySelector('meta[name="title"]')?.getAttribute('content') ||
                'No Title Found';

            // ... selectors ...
            const priceSelectors = [
                '.a-price .a-offscreen',
                '.priceToPay .a-offscreen',
                '#priceblock_ourprice',
                '#priceblock_dealprice',
                '.apexPriceToPay .a-offscreen'
            ];

            let price = 'No Price Found';
            for (const sel of priceSelectors) {
                const el = document.querySelector(sel);
                if (el && el.textContent) {
                    price = el.textContent.trim();
                    break;
                }
            }

            let image = '';
            const imgEl = document.querySelector('#landingImage') ||
                document.querySelector('#imgTagWrapperId img') ||
                document.querySelector('#imgBlkFront') ||
                document.querySelector('#ebooksImgBlkFront') ||
                document.querySelector('.a-dynamic-image');

            if (imgEl) {
                image = imgEl.getAttribute('data-old-hires') ||
                    imgEl.getAttribute('src') || '';

                // Dynamic check
                if (!image) {
                    const dynamicData = imgEl.getAttribute('data-a-dynamic-image');
                    if (dynamicData) {
                        try {
                            const parsed = JSON.parse(dynamicData);
                            const keys = Object.keys(parsed);
                            if (keys.length > 0) image = keys[0];
                        } catch (e) { }
                    }
                }
            }

            if (!title || title === 'No Title Found' || !price || price === 'No Price Found') {
                const bodyText = document.body.innerText.substring(0, 500);
                const pageTitle = document.title;
                return { title, price, image, debug: { bodyText, pageTitle, url: window.location.href } };
            }

            return { title, price, image };
        });

        if (data.debug) {
            logger.warn(`[SCRAPER DEBUG] Missing data for ${url}:`, data.debug);
        }

        return { ...data, url };
    } catch (error) {
        logger.error('Scraper Error:', error);
        return null;
    } finally {
        // Always close the page to free resources
        if (page) {
            try {
                await page.close();
            } catch (e) {
                logger.error('Error closing page:', e);
            }
        }
    }
}
