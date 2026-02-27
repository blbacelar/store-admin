import { scrapeProduct } from './src/app/lib/productScraper';

async function test() {
    try {
        console.log('Testing scraping...');
        const urlToTest = 'https://www.amazon.com.br/educativos-pedag%C3%B3gico-administrando-empresario-brinquedos/dp/B0DHYMR49Q?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=2L3GKSWZBG7IV&dib=eyJ2IjoiMSJ9.XFAyrQeCPgayHCJi1ClaPiLaCcdxTKKzn8_yOsYU4fyoSLR0nrE5IYVN1ziVWzhvM2uxHHbTK2Jkt1nWBfEe6dQTdQOdCBcOKr6t9EE4lLzyHEWru-n5MEBr_Ja-z1jaA3PxZQbfZkz03yGYTnD38cF-krS-M5hiLXLoLEdrAku3y5bHNOre0kfyfned_hjetNVkZ5ZZjHOX9Nx5fdIqdmjSHkMUeCmj8KGhPfD_Hp-hTIvmfmfHjII_sVnT6sSHUuYiqVLj6rKdtnlXqnDweAo86L85ViMhgcx8x-0SvEo.e95nMFdS15j3FFmor9Hrd8eJ5-Fc3OGPxotd3KKyOok&dib_tag=se&keywords=jogos+stem,+educa%C3%A7%C3%A3o+financeira&qid=1771789442&sprefix=jogos+stem+educa%C3%A7%C3%A3o+financeira,aps,106&sr=8-13&ufe=app_do:amzn1.fos.db68964d-7c0e-4bb2-a95c-e5cb9e32eb12&linkCode=sl2&tag=gfclittlebig-20&linkId=26f459a1e5772ef54661e1f75cc1743d&ref_=as_li_ss_tl';
        const result = await scrapeProduct(urlToTest);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
