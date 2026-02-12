/**
 * Browser Pool Manager for Puppeteer
 * Manages a pool of browser instances to prevent memory leaks and improve performance
 */

import { Browser, Page } from 'puppeteer';
import { logger } from './logger';

class BrowserPool {
    private browser: Browser | null = null;
    private pageCount = 0;
    private readonly MAX_PAGES = 10; // Restart browser after 10 pages to prevent memory leaks
    private isInitializing = false;

    /**
     * Get or create a browser instance
     */
    async getBrowser(): Promise<Browser> {
        // If browser exists and is connected, check if we need to restart
        if (this.browser && this.browser.isConnected()) {
            // Restart browser after MAX_PAGES to prevent memory leaks
            if (this.pageCount >= this.MAX_PAGES) {
                logger.info(`Restarting browser after ${this.pageCount} pages`);
                await this.cleanup();
                return this.getBrowser();
            }
            return this.browser;
        }

        // If already initializing, wait for it to complete
        if (this.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.getBrowser();
        }

        // Initialize new browser
        this.isInitializing = true;
        try {
            logger.debug('Launching new browser instance');

            if (process.env.NODE_ENV === 'production' && process.env.DEPLOYMENT_TYPE !== 'vps') {
                logger.debug('Using production configuration with @sparticuz/chromium');
                // Use dynamic imports to avoid bundling issues
                const chromium = await import('@sparticuz/chromium').then(m => m.default);
                const puppeteerCore = await import('puppeteer-core').then(m => m.default);

                // Optimized args for serverless environment
                const executablePath = await chromium.executablePath();
                logger.debug(`[BROWSER LAUNCH] Executable Path: ${executablePath}`);
                logger.debug(`[BROWSER LAUNCH] Args: ${JSON.stringify(chromium.args)}`);

                this.browser = await puppeteerCore.launch({
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: executablePath,
                    headless: chromium.headless,
                }) as unknown as Browser;
            } else {
                // Use stealth plugin in development OR VPS production
                logger.debug('Using standard configuration with puppeteer-extra and stealth plugin');
                // Use dynamic imports to completely bypass Next.js bundling
                const puppeteerExtra = await import('puppeteer-extra').then(m => m.default);
                const StealthPlugin = await import('puppeteer-extra-plugin-stealth').then(m => m.default);
                puppeteerExtra.use(StealthPlugin());

                // For VPS/Docker, we might need to specify executable path if not found automatically
                const launchOptions: any = {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-zygote',
                        '--disable-accelerated-2d-canvas',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process',
                    ],
                };

                // If on VPS production, we might be using installed chrome. 
                // Puppeteer usually finds it, or we can rely on the one installed in Docker.
                if (process.env.DEPLOYMENT_TYPE === 'vps') {
                    logger.debug('Running in VPS mode with relaxed sandbox');
                }

                this.browser = await puppeteerExtra.launch(launchOptions);
            }

            this.pageCount = 0;
            logger.debug('Browser instance launched successfully');

            if (!this.browser) {
                throw new Error('Failed to initialize browser instance');
            }

            return this.browser;
        } catch (error) {
            logger.error('Failed to launch browser:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Get a new page from the browser pool
     * Automatically manages page lifecycle and resource limits
     */
    async getPage(): Promise<Page> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        this.pageCount++;

        // Set resource limits and optimizations
        // await page.setRequestInterception(true);

        // page.on('request', (req) => {
        //     // Block unnecessary resources to save bandwidth and memory
        //     const resourceType = req.resourceType();
        //     if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        //         req.abort();
        //     } else {
        //         req.continue();
        //     }
        // });

        // Set timeouts
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(30000);

        // Set user agent to avoid detection
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        );

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        logger.debug(`Created page ${this.pageCount}/${this.MAX_PAGES}`);
        return page;
    }

    /**
     * Clean up browser resources
     */
    async cleanup(): Promise<void> {
        if (this.browser) {
            try {
                logger.debug('Closing browser instance');
                await this.browser.close();
                this.browser = null;
                this.pageCount = 0;
            } catch (error) {
                logger.error('Error closing browser:', error);
            }
        }
    }

    /**
     * Get current pool statistics
     */
    getStats() {
        return {
            isActive: this.browser !== null && this.browser.isConnected(),
            pageCount: this.pageCount,
            maxPages: this.MAX_PAGES,
        };
    }
}

// Export singleton instance
export const browserPool = new BrowserPool();

// Cleanup on process exit
if (typeof process !== 'undefined') {
    process.on('exit', () => {
        browserPool.cleanup();
    });

    process.on('SIGINT', async () => {
        await browserPool.cleanup();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await browserPool.cleanup();
        process.exit(0);
    });
}
