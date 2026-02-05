import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID!;
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function archiveProduct(rowIndex: number, archived: boolean) {
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

        // Update archived column (Column G)
        // Row index is 0-based in our system, but sheets are 1-based and have a header row
        const actualRow = rowIndex + 2; // +1 for 0-index, +1 for header row

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetTitle}!G${actualRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[archived ? 'TRUE' : 'FALSE']]
            }
        });

        return true;
    } catch (error) {
        console.error('Error archiving product:', error);
        return false;
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);
        const body = await request.json();
        const { archived } = body;

        if (typeof archived !== 'boolean') {
            return NextResponse.json({ error: 'Archived must be a boolean' }, { status: 400 });
        }

        const success = await archiveProduct(id, archived);

        if (!success) {
            return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 });
        }

        return NextResponse.json({ success: true, archived });
    } catch (error) {
        console.error('Error archiving product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
