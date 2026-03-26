import { chromium } from 'playwright';

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
        await page.fill('#email', 'blbacelar@gmail.com');
        await page.fill('#password', 'A123#456a');

        await Promise.all([
            page.locator('button[type="submit"]').click(),
            page.waitForURL('http://localhost:3000/', { timeout: 15000 })
        ]);

        console.log(JSON.stringify({
            success: true,
            url: page.url(),
            title: await page.title()
        }, null, 2));
    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            url: page.url(),
            error: error instanceof Error ? error.message : String(error)
        }, null, 2));
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

run();