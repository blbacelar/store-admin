import puppeteer from 'puppeteer';

export async function scrapeAmazonProduct(url: string) {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
        });
        const page = await browser.newPage();

        // Set User Agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Extract Data
        // Selectors are subject to change, multiple fallbacks are good practice.
        const data = await page.evaluate(() => {
            const title = document.querySelector('#productTitle')?.textContent?.trim() ||
                document.querySelector('meta[name="title"]')?.getAttribute('content') ||
                'No Title Found';

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
                document.querySelector('#imgBlkFront') || // Books
                document.querySelector('#ebooksImgBlkFront') || // Kindle
                document.querySelector('.a-dynamic-image');

            if (imgEl) {
                // 1. Try high-res attribute
                image = imgEl.getAttribute('data-old-hires') || '';

                // 2. Try dynamic image JSON (common in main images)
                if (!image) {
                    const dynamicData = imgEl.getAttribute('data-a-dynamic-image');
                    if (dynamicData) {
                        try {
                            // It looks like {"https://url...": [x,y], ...}
                            // We want the first key (url)
                            const parsed = JSON.parse(dynamicData);
                            const keys = Object.keys(parsed);
                            if (keys.length > 0) image = keys[0];
                        } catch (e) { }
                    }
                }

                // 3. Fallback to src
                if (!image) {
                    image = imgEl.getAttribute('src') || '';
                }
            }

            return { title, price, image };
        });

        await browser.close();
        return { ...data, url };
    } catch (error) {
        console.error('Scraper Error:', error);
        return null;
    }
}
