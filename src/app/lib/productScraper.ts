import puppeteer from 'puppeteer';

export async function scrapeProduct(url: string) {
    let browser = null;
    let page = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1920,1080',
                '--disable-dev-shm-usage', // Prevent memory issues
                '--disable-gpu'
            ]
        });

        page = await browser.newPage();

        // Set timeout for the entire page
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(30000);

        // Set User Agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
        console.error('Scraper Error:', error);
        return null;
    } finally {
        // Ensure cleanup even if errors occur
        try {
            if (page) await page.close();
        } catch (e) {
            console.error('Error closing page:', e);
        }

        try {
            if (browser) await browser.close();
        } catch (e) {
            console.error('Error closing browser:', e);
        }
    }
}
