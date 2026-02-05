import { NextResponse } from 'next/server';
import { getProducts, addProduct, deleteProduct } from '@/app/lib/googleSheets';

export async function GET() {
    const products = await getProducts();

    // Sheet Structure: [ID, Name, Price, Category, ImageURL, AffiliateURL, Archived]
    const formattedProducts = products.map((row, index) => {
        const archivedValue = row[6];
        const isArchived = archivedValue === 'TRUE' || archivedValue === true;

        if (index < 3) { // Log first 3 products for debugging
            console.log(`Product ${index}: archived column value = "${archivedValue}", type = ${typeof archivedValue}, isArchived = ${isArchived}`);
        }

        return {
            id: index, // Row index for deletion logic
            sheetId: row[0], // The visible ID in the sheet
            title: row[1] || 'No Title',
            price: row[2] || '',
            category: row[3] || '',
            image: row[4] || '',
            url: row[5] || '#',
            archived: isArchived
        };
    });
    return NextResponse.json(formattedProducts);
}

export async function POST(request: Request) {
    try {
        const { title, price, image, url } = await request.json();

        // Validate
        if (!title || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Match Sheet Structure: 
        // Col A: ID (Formula to auto-calc row number)
        // Col B: Name
        // Col C: Price
        // Col D: Category (Default to 'General')
        // Col E: ImageURL
        // Col F: AffiliateURL
        // Col G: Archived (Default to FALSE)
        const row = [
            '=ROW()-1', // A: ID
            title,      // B: Name
            price,      // C: Price
            'General',  // D: Category
            image,      // E: ImageURL
            url,        // F: AffiliateURL
            'FALSE'     // G: Archived
        ];

        const success = await addProduct(row);

        if (success) {
            return NextResponse.json({ message: 'Product added' });
        } else {
            return NextResponse.json({ error: 'Failed to add to sheet' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const index = searchParams.get('index');

        if (index === null) {
            return NextResponse.json({ error: 'Index required' }, { status: 400 });
        }

        const rowIndex = parseInt(index, 10);

        // Reminder: Sheet rows are 1-based, array is 0-based.
        // Data usually starts at Row 2 (Index 1) if there's a header.
        // If getProducts() returns data starting from Row 2, then `id: 0` corresponds to Row 2.
        // Our deleteProduct helper expects 'spreadsheet' index. 
        // If we assumed header is Row 1. The data rows start at index 1 (in the whole sheet).
        // So a product with logical id 0 (first item in list) is actually at Sheet Row 2 -> Index 1.
        // Let's adjust: sheetIndex = dataIndex + 1 (if 1 header row).

        // Let's configure `deleteProduct` to take the EXACT index we calculate here.
        // Logic: logicIndex (0) -> Sheet Row 2 -> API Index 1.
        const sheetIndex = rowIndex + 1;

        const success = await deleteProduct(sheetIndex);

        if (success) {
            return NextResponse.json({ message: 'Deleted' });
        } else {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
