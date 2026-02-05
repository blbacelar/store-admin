import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// SCOPES for reading and writing to Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Your Google Sheet ID - Needs to be configured
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';

export async function getAuthClient() {
    // Option 1: Use environment variables (for Vercel/production)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: SCOPES,
        });
        return await auth.getClient();
    }

    // Option 2: Use credentials.json file (for local development)
    const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
    if (fs.existsSync(CREDENTIALS_PATH)) {
        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: SCOPES,
        });
        return await auth.getClient();
    }

    throw new Error('No Google credentials found. Please set environment variables or add credentials.json');
}

export async function getGoogleSheetClient() {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    return sheets;
}

// Helper: Dynamically get the first sheet's name and ID
// This prevents errors if your tab is named "Sheet1", "Hoja 1", "Products", etc.
async function getFirstSheetResult(sheets: any) {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets?.[0];
    return {
        title: sheet?.properties?.title || 'Sheet1',
        sheetId: sheet?.properties?.sheetId || 0
    };
}

export async function getProducts() {
    if (!SPREADSHEET_ID) return [];
    try {
        const sheets = await getGoogleSheetClient();
        const { title } = await getFirstSheetResult(sheets);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${title}!A2:G`, // Start from row 2 (skips header), read all columns A-G
        });
        return response.data.values || [];
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        return [];
    }
}

export async function addProduct(row: string[]) {
    if (!SPREADSHEET_ID) return false;
    try {
        const sheets = await getGoogleSheetClient();
        const { title } = await getFirstSheetResult(sheets);

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${title}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                majorDimension: 'ROWS',
                values: [row], // Add as a new row
            },
        });
        return true;
    } catch (error) {
        console.error('Error adding to Google Sheets:', error);
        return false;
    }
}

export async function deleteProduct(rowIndex: number) {
    if (!SPREADSHEET_ID) return false;
    try {
        const sheets = await getGoogleSheetClient();
        const { sheetId } = await getFirstSheetResult(sheets);

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1,
                        }
                    }
                }]
            }
        };
        await sheets.spreadsheets.batchUpdate(request);
        return true;
    } catch (error) {
        console.error('Error deleting from Google Sheets:', error);
        return false;
    }
}
