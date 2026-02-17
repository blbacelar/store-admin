/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from './logger';
import type { ScrapedProductData } from '@/types';
import * as https from 'https';
import * as cheerio from 'cheerio';

// Declare process type to avoid "process" not found errors if types are missing
declare const process: {
    cwd: () => string;
    env: Record<string, string | undefined>;
};

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

export async function scrapeProduct(url: string): Promise<ScrapedProductData | null> {
    try {
        // Resolve short URLs first to avoid Puppeteer redirect issues
        const targetUrl = await resolveRedirect(url);

        logger.info(`Starting scrape for URL: ${targetUrl}`);

        return new Promise(async (resolve, reject) => {
            try {
                // Run standalone scraper script
                const { spawn } = await import('child_process');
                const path = await import('path');

                // Path to script inside the Docker container or local environment
                const scriptPath = path.join(process.cwd(), 'public', 'scripts', 'scraper-crawlee.mjs');

                logger.debug(`Spawning scraper script at: ${scriptPath}`);

                const child = spawn('node', [scriptPath, targetUrl], {
                    env: process.env as any
                }) as any;

                let stdoutData = '';
                let stderrData = '';

                child.stdout.on('data', (data: any) => {
                    stdoutData += data.toString();
                });

                child.stderr.on('data', (data: any) => {
                    stderrData += data.toString();
                    logger.debug(`[Scraper Script]: ${data.toString().trim()}`);
                });

                child.on('close', (code: any) => {
                    logger.info(`Scraper process closed with code ${code}`);
                    if (code !== 0) {
                        logger.error(`Scraper script exited with code ${code}`);
                        reject(new Error(`Scraper failed: ${stderrData || 'Unknown error'}`));
                        return;
                    }

                    try {
                        logger.debug(`Parsing scraper output (size: ${stdoutData.length})`);
                        // Try to parse the whole output first
                        let result;
                        try {
                            result = JSON.parse(stdoutData.trim());
                        } catch (e) {
                            // If that fails, try to find the JSON line (usually the last one)
                            const lines = stdoutData.trim().split('\n');
                            const lastLine = lines[lines.length - 1];
                            try {
                                result = JSON.parse(lastLine);
                            } catch (e2) {
                                throw new Error(`Failed to parse scraper output. Raw output: ${stdoutData.substring(0, 200)}...`);
                            }
                        }

                        if (!result.success || !result.content) {
                            reject(new Error('Invalid scraper output structure'));
                            return;
                        }

                        logger.debug('Loading content into Cheerio');
                        const $ = cheerio.load(result.content);
                        // ...

                        const h1 = $('h1').first().text().trim();
                        const ogTitle = $('meta[property="og:title"]').attr('content');
                        const docTitle = $('title').text().trim();
                        logger.info(`[SCRAPER DEBUG] H1: "${h1}", OG:Title: "${ogTitle}", DocTitle: "${docTitle}"`);

                        // Check if we hit a captcha or block page
                        if (docTitle.includes('Robot Check') || docTitle.includes('Captcha')) {
                            logger.warn('[SCRAPER WARNING] Hit Amazon Robot Check/Captcha page.');
                        }

                        const title = h1 || ogTitle || docTitle;

                        const description = $('meta[name="description"]').attr('content') ||
                            $('meta[property="og:description"]').attr('content') ||
                            '';

                        // Improved image extraction for Amazon
                        let image = '';

                        // 1. Try PRIME Amazon selectors first (Main Product Image area)
                        const primeSelectors = [
                            '#main-image-container img',
                            '#imgTagWrapperId img',
                            '#landingImage',
                            '#main-image',
                            '#imgBlkFront'
                        ];

                        let amazonImg = null;
                        for (const selector of primeSelectors) {
                            const elements = $(selector);
                            for (let i = 0; i < elements.length; i++) {
                                const img = $(elements[i]);
                                const src = img.attr('src') || '';
                                const isPlaceholder = src.includes('pixel.gif') || src.includes('transparent-pixel') || src.includes('1x1');

                                if (!isPlaceholder) {
                                    amazonImg = img;
                                    break;
                                }
                            }
                            if (amazonImg) break; // Found something in prime area, stop searching broader
                        }

                        // 2. If nothing in prime area, try secondary selectors
                        if (!amazonImg) {
                            const secondaryImages = $('img.a-dynamic-image');
                            for (let i = 0; i < secondaryImages.length; i++) {
                                const img = $(secondaryImages[i]);
                                const src = img.attr('src') || '';
                                if (!src.includes('pixel.gif')) {
                                    amazonImg = img;
                                    break;
                                }
                            }
                        }

                        if (amazonImg) {
                            // Try dynamic image JSON (best for various resolutions)
                            const dynamic = amazonImg.attr('data-a-dynamic-image');
                            if (dynamic) {
                                try {
                                    const urls = JSON.parse(dynamic);
                                    const allUrls = Object.keys(urls);
                                    if (allUrls.length > 0) {
                                        // Take the last one (usually highest res)
                                        image = allUrls[allUrls.length - 1];
                                    }
                                } catch (e) { }
                            }

                            // Fallback to old-hires or src
                            if (!image) {
                                image = amazonImg.attr('data-old-hires') || amazonImg.attr('src') || '';
                            }
                        }

                        // 2. Metadata fallbacks
                        if (!image) {
                            image = $('meta[property="og:image"]').attr('content') ||
                                $('meta[name="twitter:image"]').attr('content') ||
                                $('link[rel="image_src"]').attr('href') ||
                                '';
                        }

                        // 3. Last resort: first image in content
                        if (!image) {
                            image = $('#imgTagWrapperId img, #altImages img').first().attr('src') ||
                                $('img').first().attr('src') ||
                                '';
                        }

                        logger.info(`[SCRAPER DEBUG] Selected Image URL: "${image}"`);

                        let price = 0;
                        const priceText = $('[class*="price"], [id*="price"]').first().text().trim();
                        if (priceText) {
                            const match = priceText.match(/[\d,.]+/);
                            if (match) {
                                price = parseFloat(match[0].replace(/,/g, ''));
                            }
                        }

                        const product: ScrapedProductData = {
                            url: url, // Use the ORIGINAL URL as requested
                            title: title || 'Unknown Product',
                            description: description,
                            images: image ? [image] : [],
                            price: price,
                            currency: 'USD',
                            originalPrice: price,
                            available: true,
                            specifications: {},
                            rating: 0,
                            reviewsCount: 0
                        };

                        logger.info(`Successfully scraped product: ${product.title}`);
                        resolve(product);

                    } catch (error) {
                        logger.error('Failed to parse scraper output:', error);
                        reject(error);
                    }
                });

                child.on('error', (err: any) => {
                    logger.error('Failed to start scraper process:', err);
                    reject(err);
                });

            } catch (innerError) {
                reject(innerError);
            }
        });

    } catch (error: any) {
        logger.error(`Error in scrapeProduct: ${error.message}`);
        return null;
    }
}
