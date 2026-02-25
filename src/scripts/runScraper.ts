
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Use stealth plugin
puppeteer.use(StealthPlugin());

async function runScraper() {
    const url = process.argv[2];
    if (!url) {
        console.error(JSON.stringify({ error: 'No URL provided' }));
        process.exit(1);
    }

    let browser;
    try {
        browser = await puppeteer.launch({
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
            // @ts-ignore
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();

        // Optimize page loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navigate with generous timeout
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Extract data (simple title extraction for now, matching the original logic's basic need)
        // We can expand this to call the actual scraping logic if we move that logic here too.
        // For now, let's just dump the HTML content so the calling process can parse it,
        // OR better, move the specific extraction logic here if possible. 
        // Given the error was in browser launching, let's just return the page content.

        const content = await page.content();
        console.log(JSON.stringify({ success: true, content }));

    } catch (error: any) {
        console.error(JSON.stringify({ error: error.message, stack: error.stack }));
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

runScraper();
