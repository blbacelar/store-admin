
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
        console.error('Launching standalone scraper for:', url);

        // Launch options for VPS/Docker environment
        const launchOptions = {
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
            ignoreHTTPSErrors: true
        };

        // If PUPPETEER_EXECUTABLE_PATH is set, use it (although puppeteer usually picks it up automatically)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
            console.error('Using custom executable path:', launchOptions.executablePath);
        }

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
