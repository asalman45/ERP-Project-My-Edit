import puppeteer from 'puppeteer';

async function testPuppeteer() {
  try {
    console.log('Testing Puppeteer...');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('Page created successfully');
    
    await page.setContent('<h1>Test PDF</h1><p>This is a test PDF generation.</p>');
    console.log('Content set successfully');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    await browser.close();
    console.log('Browser closed successfully');
    
    // Check if it's a valid PDF (should start with %PDF)
    const firstBytes = pdfBuffer.slice(0, 4);
    const header = String.fromCharCode(...firstBytes);
    console.log('PDF header:', header);
    
    if (header === '%PDF') {
      console.log('✅ Valid PDF generated!');
    } else {
      console.log('❌ Invalid PDF - header is:', header);
    }
    
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    console.error('Full error:', error);
  }
}

testPuppeteer();
