
import fs from 'fs';
import * as cheerio from 'cheerio';

try {
    let raw = fs.readFileSync('test_output_utf8.json', 'utf8');
    // Remove BOM if present
    if (raw.charCodeAt(0) === 0xFEFF || raw.charCodeAt(0) === 0xFFFE) {
        raw = raw.substring(1);
    }
    const data = JSON.parse(raw.trim());
    if (!data.content) {
        console.log('No content in JSON');
        process.exit(1);
    }

    const $ = cheerio.load(data.content);
    console.log('Document Title:', $('title').text());

    const targetImageUrl = 'https://m.media-amazon.com/images/I/61yWuQuOzwL._AC_SX679_.jpg';
    console.log('\nSearching for target image URL:', targetImageUrl);

    let found = false;
    $('*').each((i, el) => {
        const html = $.html(el);
        if (html.includes(targetImageUrl)) {
            const tagName = el.name;
            const id = $(el).attr('id');
            const cls = $(el).attr('class');
            console.log(`Found in <${tagName}> ID: ${id} Class: ${cls}`);

            // If it's a script or has complex attributes, show some of it
            if (tagName === 'script' || $(el).attr('data-a-dynamic-image')) {
                console.log('Attributes:', JSON.stringify($(el).attr(), null, 2));
            }
            found = true;
        }
    });

    console.log('\n--- Analysis of main-image-container ---');
    const container = $('#main-image-container');
    if (container.length) {
        const imgs = container.find('img');
        console.log(`Found ${imgs.length} images in #main-image-container`);
        imgs.each((i, el) => {
            const img = $(el);
            console.log(`\nImage ${i}:`);
            console.log(`  src: ${img.attr('src')}`);
            console.log(`  id: ${img.attr('id')}`);
            console.log(`  class: ${img.attr('class')}`);
            console.log(`  data-a-dynamic-image present: ${!!img.attr('data-a-dynamic-image')}`);
            if (img.attr('data-a-dynamic-image')) {
                console.log(`  data-a-dynamic-image content: ${img.attr('data-a-dynamic-image').substring(0, 100)}...`);
            }
            console.log(`  data-old-hires: ${img.attr('data-old-hires')}`);
        });
    } else {
        console.log('#main-image-container NOT FOUND');
    }

    console.log('\n--- Searching for target URL across ALL elements ---');
    const targetUrl = 'https://m.media-amazon.com/images/I/61yWuQuOzwL._AC_SX679_.jpg';
    const targetPartial = '61yWuQuOzwL';

    $('*').each((i, el) => {
        const node = $(el);
        const attrs = el.attribs;
        let found = false;

        for (const key in attrs) {
            if (attrs[key].includes(targetPartial)) {
                console.log(`Found partial match in <${el.name}> attribute [${key}]. ID: ${node.attr('id')}`);
                console.log(`  Value: ${attrs[key].substring(0, 200)}...`);
                found = true;
            }
        }
    });

} catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
}
