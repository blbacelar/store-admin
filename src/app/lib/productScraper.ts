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
                const scriptPath = path.join(process.cwd(), 'public', 'scripts', 'scraper.js');

                logger.debug(`Spawning scraper script at: ${scriptPath}`);

                const child = spawn('node', [scriptPath, targetUrl], {
                    env: process.env
                });

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
                    if (code !== 0) {
                        logger.error(`Scraper script exited with code ${code}`);
                        reject(new Error(`Scraper failed: ${stderrData || 'Unknown error'}`));
                        return;
                    }

                    try {
                        const result = JSON.parse(stdoutData.trim());
                        if (!result.success || !result.content) {
                            reject(new Error('Invalid scraper output'));
                            return;
                        }

                        const $ = cheerio.load(result.content);

                        const title = $('h1').first().text().trim() ||
                            $('meta[property="og:title"]').attr('content') ||
                            $('title').text().trim();

                        const description = $('meta[name="description"]').attr('content') ||
                            $('meta[property="og:description"]').attr('content') ||
                            '';

                        const image = $('meta[property="og:image"]').attr('content') ||
                            $('img').first().attr('src') ||
                            '';

                        let price = 0;
                        const priceText = $('[class*="price"], [id*="price"]').first().text().trim();
                        if (priceText) {
                            const match = priceText.match(/[\d,.]+/);
                            if (match) {
                                price = parseFloat(match[0].replace(/,/g, ''));
                            }
                        }

                        const product: ScrapedProductData = {
                            url: targetUrl,
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
