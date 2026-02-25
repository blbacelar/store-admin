import { PlaywrightCrawler, log, Configuration } from 'crawlee';
import { chromium } from 'playwright';

// Silence Crawlee logs to prevent stdout pollution
log.setLevel(log.LEVELS.OFF);
// Make sure ANY active logger writes to stderr instead of stdout
if (log.setOptions) log.setOptions({ logger: { log: (level, msg) => console.error(msg) } });

// Disable system info tracking to avoid wmic serialization bug on non-English Windows
const config = new Configuration({
    systemInfoIntervalMillis: 0,
});

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
                try {
                    // Make sure we are not already on the actual product page.
                    // The product page has a navigation flyout link that also says "Continuar comprando".
                    const isProductPage = await page.locator('#productTitle, #title').count() > 0;

                    if (!isProductPage) {
                        const continueButton = page.locator('text=/Continuar comprando|Continue shopping/i >> visible=true').nth(0);
                        const count = await continueButton.count();

                        if (count > 0) {
                            // Verify it's not a navigation link just in case
                            const className = await continueButton.getAttribute('class').catch(() => '');
                            if (!className || (!className.includes('nav-') && !className.includes('nav_'))) {
                                console.error('Bypass button found, clicking forcefully...');
                                await Promise.all([
                                    page.waitForSelector('#productTitle, #title', { timeout: 15000 }).catch(() => { }),
                                    continueButton.evaluate(b => b.click())
                                ]);
                            }
                        }
                    }
                } catch (e) { }
            } catch (e) {
                console.error(`Bypass/Load check failed: ${e.message}`);
            }

            const content = await page.content();
            console.log(JSON.stringify({ success: true, content }));
        },

        failedRequestHandler({ request }) {
            console.error(JSON.stringify({ error: `Request failed: ${request.url}` }));
        },
    }, config); // Pass configuration to specific crawler instance

    await crawler.run([url]);
    await new Promise(r => setTimeout(r, 500)); // Ensure stdout is flushed to pipe
    process.exit(0);
}

run().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    setTimeout(() => process.exit(1), 500);
});
