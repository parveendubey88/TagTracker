import { google } from 'googleapis';
import fs from 'fs';

const auth = new google.auth.GoogleAuth({
    keyFile: 'creds.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = '11PeR8qaxWESnNJXsoWZoGjWb3I8zPhEqh2dGoUzGo7s';
const SHEET_NAME = 'MonitoringData';

export async function getSheetData() {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:C`,
    });
    return res.data.values || [];
}

export async function updateSheet(rowIndex, dateTime) {
    const range = `${SHEET_NAME}!D${rowIndex + 2}`;
    console.log(`🔄 Updating row ${rowIndex + 2} at range ${range} with value: ${dateTime}`);

    const isoDate = new Date(dateTime);
    const formattedDate = isoDate.toLocaleDateString('en-GB'); // dd/mm/yyyy
    const formattedTime = isoDate.toLocaleTimeString('en-GB'); // hh:mm:ss

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!D${rowIndex + 2}:E${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[formattedDate, formattedTime]] },
    });


    console.log(`✅ Successfully updated ${range}`);
}

