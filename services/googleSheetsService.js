const { google } = require('googleapis');

// Environment variables - these should be set in your .env file
const GOOGLE_SHEETS_SERVICE_ACCOUNT = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT;
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';

// Validate required environment variables
function validateEnvironment() {
    const required = [
        'GOOGLE_SHEETS_SERVICE_ACCOUNT',
        'GOOGLE_SHEETS_PRIVATE_KEY',
        'SPREADSHEET_ID'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Get Google Sheets client using service account
function getGoogleSheetsClient() {
    validateEnvironment();
    
    // Format the private key properly
    let privateKey = GOOGLE_SHEETS_PRIVATE_KEY;
    
    // Clean up the private key format
    privateKey = privateKey.trim();
    
    // Remove leading quote
    if (privateKey.startsWith('"')) {
        privateKey = privateKey.substring(1);
    }
    
    // Remove trailing quote and comma
    if (privateKey.endsWith('",')) {
        privateKey = privateKey.substring(0, privateKey.length - 2);
    } else if (privateKey.endsWith('"')) {
        privateKey = privateKey.substring(0, privateKey.length - 1);
    }
    
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Clean up any remaining whitespace
    privateKey = privateKey.trim();

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_SHEETS_SERVICE_ACCOUNT,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('Error creating Google Auth:', error);
        throw new Error(`Failed to create Google Auth: ${error.message}`);
    }
}

// Append row to Google Sheet using googleapis library
async function appendRowToSheet(rowData) {
    try {
        const sheets = getGoogleSheetsClient();
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:H`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData]
            },
        });

        console.log(`${response.data.updates.updatedCells} cells appended.`);
        return response.data;
        
    } catch (error) {
        console.error('Error appending to sheet:', error);
        throw new Error(`Failed to append to sheet: ${error.message}`);
    }
}

module.exports = {
    appendRowToSheet,
    validateEnvironment
};
