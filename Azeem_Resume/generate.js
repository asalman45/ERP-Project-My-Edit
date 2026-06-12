const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        const filePath = path.resolve(__dirname, 'resume.html');
        await page.goto(`file://${filePath}`, {waitUntil: 'networkidle0'});
        
        await page.pdf({
            path: 'Abdul_Azeem_Resume.pdf',
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
            }
        });
        
        await browser.close();
        console.log('PDF generated successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
})();
