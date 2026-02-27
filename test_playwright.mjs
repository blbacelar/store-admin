import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://amzn.to/4s6PLdL', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // wait a bit
    await page.waitForTimeout(5000);

    const html = await page.content();
    fs.writeFileSync('debug_dom.html', html);

    const elements = await page.$$('a, button');
    let out = '';
    for (const el of elements) {
        try {
            const text = await el.innerText();
            if (text.toLowerCase().includes('continuar') || text.toLowerCase().includes('shopping')) {
                const tag = await el.evaluate(e => e.tagName);
                const className = await el.getAttribute('class') || '';
                const href = await el.getAttribute('href') || '';
                out += `[${tag}] class="${className}" href="${href}" text="${text.replace(/\n/g, ' ')}"\n`;
            }
        } catch (e) { }
    }
    fs.writeFileSync('debug_elements.txt', out);

    await browser.close();
}

run().catch(console.error);
