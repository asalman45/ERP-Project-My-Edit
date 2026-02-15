// src/services/pdf.service.js
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';

export async function generateInvoicePDF(invoiceData) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceData.invoice_no}</title>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .company-info h1 { margin: 0; font-size: 28px; color: #1a56db; }
          .company-info p { margin: 5px 0; font-size: 14px; }
          .invoice-details { text-align: right; }
          .invoice-details h2 { margin: 0; font-size: 24px; color: #1a56db; }
          .invoice-details p { margin: 5px 0; font-size: 14px; }
          
          .billing-section { display: flex; gap: 50px; margin-bottom: 40px; }
          .bill-to { flex: 1; }
          .bill-to h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; font-size: 16px; }
          .bill-to p { margin: 5px 0; font-size: 14px; max-width: 300px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f8fafc; text-align: left; padding: 12px; font-size: 14px; border-bottom: 2px solid #eee; }
          td { padding: 12px; font-size: 14px; border-bottom: 1px solid #eee; }
          
          .totals { display: flex; justify-content: flex-end; }
          .totals-table { width: 250px; }
          .totals-table tr td:first-child { font-weight: bold; text-align: right; padding-right: 20px; }
          .totals-table tr td:last-child { text-align: right; }
          .grand-total { font-size: 18px; font-weight: bold; color: #1a56db; background: #eff6ff; }
          
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
          .notes { margin-top: 30px; font-size: 14px; }
          .notes strong { display: block; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>EPCML ERP</h1>
            <p>123 Industrial Area, Phase-I</p>
            <p>New Delhi, India - 110020</p>
            <p>GSTIN: 07AAAAA0000A1Z5</p>
            <p>Email: accounts@empcl-erp.com | Phone: +91 11 1234 5678</p>
          </div>
          <div class="invoice-details">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> ${invoiceData.invoice_no}</p>
            <p><strong>Date:</strong> ${new Date(invoiceData.invoice_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${invoiceData.due_date ? new Date(invoiceData.due_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> ${invoiceData.payment_status}</p>
          </div>
        </div>

        <div class="billing-section">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${invoiceData.customer_name}</strong></p>
            <p>${invoiceData.customer_address || 'No address provided'}</p>
            <p><strong>GSTIN:</strong> ${invoiceData.gst_number || 'N/A'}</p>
          </div>
          ${invoiceData.so_number ? `
          <div class="bill-to">
            <h3>Reference:</h3>
            <p><strong>Sales Order:</strong>#${invoiceData.so_number}</p>
            <p><strong>Payment Terms:</strong> ${invoiceData.payment_terms || 'NET_30'}</p>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Description / Item</th>
              <th style="width: 80px; text-align: center;">Qty</th>
              <th style="width: 120px; text-align: right;">Unit Price (₹)</th>
              <th style="width: 120px; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.product_name || 'Item'}</td>
                <td style="text-align: center;">${parseFloat(item.quantity).toFixed(2)}</td>
                <td style="text-align: right;">${parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right;">${parseFloat(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td>₹${parseFloat(invoiceData.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td>Tax Amount:</td>
              <td>₹${parseFloat(invoiceData.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="grand-total">
              <td>Total Payable:</td>
              <td>₹${parseFloat(invoiceData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        ${invoiceData.notes ? `
          <div class="notes">
            <strong>Notes:</strong>
            <p>${invoiceData.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </body>
      </html>
    `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        await browser.close();
        return pdfBuffer;

    } catch (error) {
        if (browser) await browser.close();
        logger.error({ error: error.message }, 'Error in PDF generation service');
        throw error;
    }
}

export async function generateQuotationPDF(quoteData) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${quoteData.quote_no}</title>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .company-info h1 { margin: 0; font-size: 28px; color: #1e40af; }
          .quote-details { text-align: right; }
          .quote-details h2 { margin: 0; font-size: 24px; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 14px; }
          td { padding: 12px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
          .grand-total { font-size: 18px; font-bold; color: #1e40af; background: #eff6ff; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>EPCML SOLUTIONS</h1>
            <p>Industrial Procurement Division</p>
          </div>
          <div class="quote-details">
            <h2>FORMAL QUOTATION</h2>
            <p><strong>Quote No:</strong> ${quoteData.quote_no}</p>
            <p><strong>Valid Until:</strong> ${new Date(quoteData.valid_until).toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Customer Details:</h3>
          <p><strong>${quoteData.customer_name}</strong></p>
          <p>Attn: Procurement Manager</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item / Description</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price (₹)</th>
              <th style="text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${quoteData.items.map(item => `
              <tr>
                <td>${item.product_name || 'Standard Component'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${parseFloat(item.unit_price).toLocaleString()}</td>
                <td style="text-align: right;">${(item.quantity * item.unit_price).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
             <tr class="grand-total">
                <td colspan="3" style="text-align: right;"><strong>Estimated Total:</strong></td>
                <td style="text-align: right;"><strong>₹${parseFloat(quoteData.total_amount).toLocaleString()}</strong></td>
             </tr>
          </tfoot>
        </table>

        <div style="margin-top: 50px; font-size: 12px; color: #64748b;">
          <p><strong>Terms and Conditions:</strong></p>
          <ol>
            <li>Prices are inclusive of applicable taxes unless specified otherwise.</li>
            <li>Delivery within 15 days of confirmed Purchase Order.</li>
            <li>This quote is valid for 30 days.</li>
          </ol>
        </div>
      </body>
      </html>
    `;

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        return pdfBuffer;
    } catch (error) {
        if (browser) await browser.close();
        throw error;
    }
}
