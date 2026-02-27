import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
    const url = process.argv[2];
    if (!url) {
        console.error(JSON.stringify({ error: 'No URL provided' }));
        process.exit(1);
    }

    // Launch Puppeteer with optimal stealth settings
    const browser = await puppeteer.launch({
        headless: 'new', // Try modern headless mode
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ],
        ignoreDefaultArgs: ['--enable-automation']
    });

    try {
        const page = await browser.newPage();

        // Anti-bot evasions
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
        });

        // Randomize viewport size slightly inside standard bounds
        await page.setViewport({
            width: 1366 + Math.floor(Math.random() * 100),
            height: 768 + Math.floor(Math.random() * 100)
        });

        console.error(`Scraping: ${url}`);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a small amount for dynamic rendering
        await new Promise(r => setTimeout(r, 2000));

        // Check for "Continuar comprando" or "Continue shopping" block
        try {
            const isProductPage = await page.$('#productTitle, #title') !== null;

            if (!isProductPage) {
                // Find button by xpath containing text
                const continueButtons = await page.$$("::-p-xpath(//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'continuar') or contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'continue')])");

                if (continueButtons.length > 0) {
                    const btn = continueButtons[0];
                    console.error('Bypass button found, clicking forcefully...');
                    // Use a more robust click using page.evaluate
                    await page.evaluate(b => b.click(), btn);
                    // Wait for navigation after clicking
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => { });
                } else {
                    console.error('Bypass block detected, but no continue button found. Returning HTML to caller.');
                }
            }
        } catch (e) {
            console.error(`Bypass/Load check failed: ${e.message}`);
        }

        const content = await page.content();
        console.log(JSON.stringify({ success: true, content }));

    } catch (err) {
        console.error(JSON.stringify({ error: `Request failed: ${err.message}` }));
    } finally {
        await browser.close();
    }
}

run().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    setTimeout(() => process.exit(1), 500);
});
