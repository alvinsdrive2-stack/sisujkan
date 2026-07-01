// Export HTML to PDF using puppeteer
// Run: npm install puppeteer && node export-pdf.js

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load the HTML file
  const htmlPath = path.resolve(__dirname, 'skdirektur-template.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  // Export to PDF
  await page.pdf({
    path: 'skdirektur-output.pdf',
    format: 'A4',
    printBackground: true, // Important for background image
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });

  console.log('PDF exported: skdirektur-output.pdf');

  await browser.close();
})();
