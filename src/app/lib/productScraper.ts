import { browserPool } from './browserPool';
import { logger } from './logger';
import type { ScrapedProductData } from '@/types';

export async function scrapeProduct(url: string): Promise<ScrapedProductData | null> {
    let page = null;

    try {
        // Get page from browser pool
        page = await browserPool.getPage();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

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

            return { title, price, image };
        });

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
