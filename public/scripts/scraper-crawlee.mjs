import { PlaywrightCrawler, log } from 'crawlee';
import { chromium } from 'playwright';

// Silence Crawlee logs to prevent stdout pollution
log.setLevel(log.LEVELS.OFF);

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
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        },
        browserPoolOptions: {
            useFingerprints: false, // Turn off for speed
        },
        requestHandlerTimeoutSecs: 30,
        navigationTimeoutSecs: 20,
        maxRequestsPerCrawl: 1,

        async requestHandler({ page, request }) {
            console.error(`Scraping: ${request.url}`);

            try {
                // Wait for DOM content with a timeout
                await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

                // Check for "Continuar comprando" or "Continue shopping"
                const buttons = await page.$$('button, input[type="submit"], span.a-button-text');
                for (const button of buttons) {
                    try {
                        const text = await button.innerText();
                        if (text && (text.includes('Continuar comprando') || text.includes('Continue shopping'))) {
                            console.error('Bypass button found, clicking...');
                            await Promise.all([
                                button.click(),
                                page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { })
                            ]);
                            break;
                        }
                    } catch (err) { }
                }
            } catch (e) {
                console.error(`Bypass/Load check failed: ${e.message}`);
            }

            const content = await page.content();
            console.log(JSON.stringify({ success: true, content }));
        },

        failedRequestHandler({ request }) {
            console.error(JSON.stringify({ error: `Request failed: ${request.url}` }));
        },
    });

    await crawler.run([url]);
    process.exit(0);
}

run().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
});
