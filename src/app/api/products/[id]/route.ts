import { NextResponse } from 'next/server';
import { getProducts } from '@/app/lib/googleSheets';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function updateProduct(rowIndex: number, title: string, category: string) {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client as any });

        // Get sheet metadata
        const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheetTitle = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

        // Update title (Column B) and category (Column D)
        // Row index is 0-based in our system, but sheets are 1-based and have a header row
        const actualRow = rowIndex + 2; // +1 for 0-index, +1 for header row

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: [
                    {
                        range: `${sheetTitle}!B${actualRow}`,
                        values: [[title]]
                    },
                    {
                        range: `${sheetTitle}!D${actualRow}`,
                        values: [[category]]
                    }
                ]
            }
        });

        return true;
    } catch (error) {
        console.error('Error updating Google Sheets:', error);
        return false;
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);
        const body = await request.json();
        const { title, category } = body;

        if (!title || !category) {
            return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
        }

        const products = await getProducts();

        if (isNaN(id) || id < 0 || id >= products.length) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const success = await updateProduct(id, title, category);

        if (!success) {
            return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);
        const products = await getProducts();

        if (isNaN(id) || id < 0 || id >= products.length) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const row = products[id];
        const product = {
            id: id,
            sheetId: row[0],
            title: row[1] || 'No Title',
            price: row[2] || '',
            category: row[3] || '',
            image: row[4] || '',
            url: row[5] || '#'
        };

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
