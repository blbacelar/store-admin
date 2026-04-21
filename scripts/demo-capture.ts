import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3000';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'blbacelar@gmail.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'A123#456a';
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'demo');
const VIDEO_DIR = path.join(OUTPUT_DIR, '.video-temp');
const DEMO_VIDEO = 'store-automator-demo.webm';

function outputPath(fileName: string) {
    return path.join(OUTPUT_DIR, fileName);
}

async function pace(page: import('playwright').Page, ms = 500) {
    await page.waitForTimeout(ms);
}

async function captureScreenshot(page: import('playwright').Page, fileName: string) {
    await page.screenshot({
        path: outputPath(fileName),
        fullPage: true
    });
}

async function waitForDashboardReady(page: import('playwright').Page) {
    const loadingText = page.getByText(/loading products/i);
    if (await loadingText.count()) {
        await loadingText.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
    }

    await page.waitForFunction(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return !bodyText.includes('loading products');
    }, { timeout: 30000 });

    await Promise.race([
        page.getByRole('heading', { name: /managed products/i }).waitFor({ state: 'visible', timeout: 30000 }),
        page.getByText(/no_products|no products/i).waitFor({ state: 'visible', timeout: 30000 }),
        page.locator('table').first().waitFor({ state: 'visible', timeout: 30000 })
    ]);
}

async function waitForCategoriesReady(page: import('playwright').Page) {
    await page.waitForFunction(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return !bodyText.includes('loading');
    }, { timeout: 30000 });

    await Promise.race([
        page.getByRole('button', { name: /add|create/i }).waitFor({ state: 'visible', timeout: 30000 }),
        page.locator('table').first().waitFor({ state: 'visible', timeout: 30000 }),
        page.getByText(/no categories|no_categories/i).waitFor({ state: 'visible', timeout: 30000 })
    ]);
}

async function waitForBranchesReady(page: import('playwright').Page) {
    await page.waitForFunction(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return !bodyText.includes('loading');
    }, { timeout: 30000 });

    await Promise.race([
        page.getByRole('button', { name: /add/i }).waitFor({ state: 'visible', timeout: 30000 }),
        page.locator('table').first().waitFor({ state: 'visible', timeout: 30000 }),
        page.getByText(/no branches|no_branches/i).waitFor({ state: 'visible', timeout: 30000 })
    ]);
}

async function waitForProductDetailReady(page: import('playwright').Page) {
    const loadingText = page.getByText(/loading products/i);
    if (await loadingText.count()) {
        await loadingText.first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => undefined);
    }

    await Promise.race([
        page.getByRole('button', { name: /edit|editar/i }).waitFor({ state: 'visible', timeout: 30000 }),
        page.getByText(/product id|id do produto/i).first().waitFor({ state: 'visible', timeout: 30000 }),
        page.locator('img[alt]').first().waitFor({ state: 'visible', timeout: 30000 })
    ]);
}

async function goBackToDashboard(page: import('playwright').Page) {
    const backButton = page.getByRole('button', { name: /back to dashboard|voltar ao início|voltar ao dashboard/i }).first();

    if (await backButton.count()) {
        await Promise.all([
            page.waitForURL(`${BASE_URL}/`, { timeout: 15000 }),
            backButton.click()
        ]);
    } else {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    }

    await waitForDashboardReady(page);
}

async function captureDemo() {
    await fs.rm(VIDEO_DIR, { recursive: true, force: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(VIDEO_DIR, { recursive: true });

    const existingArtifacts = await fs.readdir(OUTPUT_DIR).catch(() => [] as string[]);
    await Promise.all(
        existingArtifacts
            .filter((fileName) => fileName.endsWith('.png') || fileName.endsWith('.webm'))
            .map((fileName) => fs.rm(outputPath(fileName), { force: true }))
    );

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        recordVideo: {
            dir: VIDEO_DIR,
            size: { width: 1440, height: 960 }
        }
    });
    const page = await context.newPage();
    const video = page.video();

    try {
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
        await pace(page, 700);
        await captureScreenshot(page, '01-login.png');

        await page.fill('#email', DEMO_EMAIL);
        await page.fill('#password', DEMO_PASSWORD);
        await pace(page, 300);

        await Promise.all([
            page.locator('button[type="submit"]').click(),
            page.waitForURL(`${BASE_URL}/`, { timeout: 15000 })
        ]);

        await page.waitForLoadState('networkidle');
        await waitForDashboardReady(page);
        await pace(page, 900);
        await captureScreenshot(page, '02-dashboard.png');

        const firstEditButton = page.locator('button[title="Edit"], button[title="Editar"]').first();
        if (await firstEditButton.count()) {
            await Promise.all([
                page.waitForURL(/\/products\/[^/]+$/, { timeout: 15000 }),
                firstEditButton.click()
            ]);
            await waitForProductDetailReady(page);
            await pace(page, 800);
            await captureScreenshot(page, '03-product-detail.png');

            const detailEditButton = page.getByRole('button', { name: /edit|editar/i }).first();
            if (await detailEditButton.count()) {
                await detailEditButton.click();
                await Promise.race([
                    page.getByRole('button', { name: /save|salvar/i }).waitFor({ state: 'visible', timeout: 15000 }),
                    page.getByRole('button', { name: /cancel|cancelar/i }).waitFor({ state: 'visible', timeout: 15000 })
                ]);
                await pace(page, 600);
                await captureScreenshot(page, '04-product-edit.png');

                const cancelButton = page.getByRole('button', { name: /cancel|cancelar/i }).first();
                if (await cancelButton.count()) {
                    await cancelButton.click();
                    await pace(page, 400);
                }
            }

            await goBackToDashboard(page);
            await pace(page, 500);
        }

        const categoriesButton = page.getByRole('button', { name: /categories/i });
        if (await categoriesButton.count()) {
            await Promise.all([
                page.waitForURL(/\/categories$/, { timeout: 15000 }),
                categoriesButton.click()
            ]);
            await page.waitForLoadState('networkidle');
            await waitForCategoriesReady(page);
            await pace(page, 700);
            await captureScreenshot(page, '05-categories.png');
            await goBackToDashboard(page);
        }

        const branchesButton = page.getByRole('button', { name: /branches|locais/i });
        if (await branchesButton.count()) {
            await Promise.all([
                page.waitForURL(/\/branches$/, { timeout: 15000 }),
                branchesButton.click()
            ]);
            await page.waitForLoadState('networkidle');
            await waitForBranchesReady(page);
            await pace(page, 700);
            await captureScreenshot(page, '06-branches.png');
            await goBackToDashboard(page);
        }

        await pace(page, 1000);

        console.log(JSON.stringify({
            success: true,
            baseUrl: BASE_URL,
            outputDir: OUTPUT_DIR,
            files: [
                'docs/demo/01-login.png',
                'docs/demo/02-dashboard.png',
                'docs/demo/03-product-detail.png',
                'docs/demo/04-product-edit.png',
                'docs/demo/05-categories.png',
                'docs/demo/06-branches.png',
                `docs/demo/${DEMO_VIDEO}`
            ]
        }, null, 2));
    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            baseUrl: BASE_URL,
            error: error instanceof Error ? error.message : String(error)
        }, null, 2));
        process.exitCode = 1;
    } finally {
        await context.close();
        if (video) {
            await video.saveAs(outputPath(DEMO_VIDEO));
        }
        await fs.rm(VIDEO_DIR, { recursive: true, force: true });
        await browser.close();
    }
}

captureDemo();