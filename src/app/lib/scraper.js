
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

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
        // Launch options for VPS/Docker environment
        const launchOptions = {
            headless: true, // New mode
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
            ignoreHTTPSErrors: true
        };

        // If we are in production, we might want to use specific executable path if needed
        // But usually pupeteer-extra finds the installed chrome or downloads one.
        // In our Dockerfile, we installed chromium? No, we installed libraries for chrome.
        // We relied on puppeteer downloading it OR using @sparticuz/chromium in the previous code.

        // Let's try standard launch first. If it fails to find chrome, we might need to point to it.
        // In the Dockerfile, we are using node:20-slim.
        // We might need to ensure a browser is installed. The previous code used @sparticuz/chromium for serverless.
        // For VPS, we should treating it like a normal server. 
        // Let's check if we can use the same approach as the original code but in JS.

        browser = await puppeteer.launch(launchOptions);

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

        // Extract page content
        const content = await page.content();

        // Output success result
        console.log(JSON.stringify({ success: true, content }));

    } catch (error) {
        console.error(JSON.stringify({ error: error.message, stack: error.stack }));
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

runScraper();
