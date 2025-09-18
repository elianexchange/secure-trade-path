const puppeteer = require('puppeteer');
const path = require('path');

async function generateOGImage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to 1200x630 (Open Graph recommended size)
  await page.setViewport({ width: 1200, height: 630 });
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'public', 'tranzio-og-image.html');
  await page.goto(`file://${htmlPath}`);
  
  // Wait for fonts and animations to load
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({
    path: path.join(__dirname, 'public', 'tranzio-og-image.png'),
    type: 'png',
    fullPage: false
  });
  
  await browser.close();
  console.log('✅ Open Graph image generated successfully!');
  console.log('📁 Saved to: public/tranzio-og-image.png');
}

generateOGImage().catch(console.error);
