import { PlaywrightCrawler, log, Configuration } from 'crawlee';
import { chromium } from 'playwright';

// Silence Crawlee logs to prevent stdout pollution
log.setLevel(log.LEVELS.OFF);
if (log.setOptions) log.setOptions({ logger: { log: (level, msg) => console.error(msg) } });

const config = new Configuration({
    systemInfoIntervalMillis: 0,
});

async function run() {
    const url = process.argv[2];
    if (!url) {
        console.error(JSON.stringify({ error: 'No URL provided' }));
        process.exit(1);
    }

    const crawler = new PlaywrightCrawler({
        launchContext: {
            launcher: chromium,
            launchOptions: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        },
        browserPoolOptions: {
            useFingerprints: true, // TRY ENABLING THIS
        },
        requestHandlerTimeoutSecs: 30,
        navigationTimeoutSecs: 20,
        maxRequestsPerCrawl: 1,

        async requestHandler({ page, request }) {
            console.error(`Scraping: ${request.url}`);

            try {
                await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
                // Check if title is Robot Check
                const title = await page.title();
                console.error('Page Title:', title);
            } catch (e) {
                console.error(`Load failed: ${e.message}`);
            }

            const content = await page.content();
            console.log(JSON.stringify({ success: true, content }));
        },

        failedRequestHandler({ request }) {
            console.error(JSON.stringify({ error: `Request failed: ${request.url}` }));
        },
    }, config);

    await crawler.run([url]);
    await new Promise(r => setTimeout(r, 500));
    process.exit(0);
}

run().catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    setTimeout(() => process.exit(1), 500);
});
