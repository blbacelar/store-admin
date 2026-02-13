import { PlaywrightCrawler } from 'crawlee';
import { chromium } from 'playwright';

async function run() {
    const url = process.argv[2];
    if (!url) {
        console.error(JSON.stringify({ error: 'No URL provided' }));
        process.exit(1);
    }

    // Crawlee persists state by default. We should disable persistence for one-off scrape.
    // Or set unique storage dir?
    // We set 'persistStorage: false' if possible, or clean up.

    // Actually, Crawlee uses ./storage by default.
    // We might want to use a unique session or clear storage?

    const crawler = new PlaywrightCrawler({
        launchContext: {
            launcher: chromium,
            launchOptions: {
                headless: process.env.HEADLESS === 'false' ? false : true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Docker friendly
            }
        },
        browserPoolOptions: {
            useFingerprints: true,
        },
        requestHandlerTimeoutSecs: 60,
        maxRequestsPerCrawl: 1, // Only one page

        async requestHandler({ page, request, log }) {
            console.error(`Processing ${request.url}`);

            try {
                // Wait for body or specific element
                await page.waitForLoadState('domcontentloaded');

                // Check for "Continuar comprando" button
                const buttons = await page.$$('button[type="submit"]');
                for (const button of buttons) {
                    const text = await button.innerText();
                    if (text.includes('Continuar comprando')) {
                        console.error('Found Continue Shopping button, clicking...');
                        await button.click();
                        await page.waitForLoadState('networkidle');
                        break;
                    }
                }
            } catch (e) {
                console.error('Wait/Click failed, proceeding...');
            }

            const content = await page.content();

            // Output JSON to stdout for the main app to read
            console.log(JSON.stringify({ success: true, content }));
        },

        failedRequestHandler({ request, log }) {
            console.error(JSON.stringify({ error: `Request failed: ${request.url}` }));
        },
    });

    await crawler.run([url]);
}

run().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
});
