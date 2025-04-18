import express from 'express';
import puppeteer from 'puppeteer';
import { getSheetData, updateSheet } from './sheets.js';

const app = express();
const port = process.env.PORT || 3000;

async function checkTag(url, param, rowIndex) {

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    let found = false;

    page.on('request', (req) => {
        if (req.url().includes(param)) {
            console.log(`✅ Found ${param} on ${url}`);
            found = true;
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        try {
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText.toLowerCase(), button);
                if (text.includes('accept') || text.includes('i agree')) {
                    console.log(`🍪 Cookie consent found. Clicking button with text: "${text}"`);
                    await button.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    break;
                }
            }

            // Also check for common known selectors
            const knownSelectors = [
                '#onetrust-accept-btn-handler', // OneTrust
                '.cookie-accept',
                '.cc-allow',
                '[data-testid="accept-button"]'
            ];

            for (const selector of knownSelectors) {
                const element = await page.$(selector);
                if (element) {
                    console.log(`🍪 Cookie consent found. Clicking selector: ${selector}`);
                    await element.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    break;
                }
            }
        } catch (e) {
            console.warn('⚠️ Error while handling cookie consent:', e.message);
        }

        if (!found) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
        }
    } catch (err) {
        console.log(`⚠️ Failed to load: ${url}`);
    }

    if (found) {
        const now = new Date().toISOString();
        await updateSheet(rowIndex, now);
    }

    await browser.close();
}

app.get('/', (req, res) => {
    // Redirect the root URL to /scan-tags
    res.redirect('/scan-tags');
});

app.get('/scan-tags', async (req, res) => {
    try {
        console.log('Starting tag scanning...');
        const rows = await getSheetData();

        for (let i = 0; i < rows.length; i++) {
            const [url, param] = rows[i];
            if (!url || !param) continue;

            console.log(`🌐 Visiting ${url} and looking for param: ${param}`);
            await checkTag(url, param, i);
        }

        console.log('✅ All URLs scanned.');
        res.send('Tag scanning completed!');
    } catch (err) {
        console.error('Error scanning tags:', err);
        res.status(500).send('There was an error while scanning tags.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
