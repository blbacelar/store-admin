const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.amazon.com/Mighty-Fun-Brain-Freeze-Board/dp/B019NDGDIW', { waitUntil: 'domcontentloaded' });
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 1000));
    await browser.close();
}
run().catch(console.error);
