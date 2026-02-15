// src/services/pdfGenerator.service.js
// PDF Generation Service for Purchase Orders

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGeneratorService {
  constructor() {
    this.purchaseOrdersDir = path.join(__dirname, '../../purchase_orders');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.purchaseOrdersDir)) {
      fs.mkdirSync(this.purchaseOrdersDir, { recursive: true });
    }
  }

  // Convert number to words (for amount in words)
  numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[Math.floor(num)];
    if (num < 20) return teens[Math.floor(num) - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = Math.floor(num % 10);
      return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return ones[hundred] + ' Hundred' + (remainder ? ' ' + this.numberToWords(remainder) : '');
    }
    if (num < 100000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      return this.numberToWords(thousand) + ' Thousand' + (remainder ? ' ' + this.numberToWords(remainder) : '');
    }
    if (num < 10000000) {
      const lakh = Math.floor(num / 100000);
      const remainder = num % 100000;
      return this.numberToWords(lakh) + ' Lakh' + (remainder ? ' ' + this.numberToWords(remainder) : '');
    }
    const crore = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return this.numberToWords(crore) + ' Crore' + (remainder ? ' ' + this.numberToWords(remainder) : '');
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Format date as DD-MMM-YY (e.g., 2-Oct-25)
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }

  // Generate HTML template for Purchase Order
  generateHTMLTemplate(poData) {
    const {
      po_number,
      order_date,
      supplier_name,
      contact_person,
      contact_phone,
      supplier_address,
      supplier_email,
      supplier_ntn,
      supplier_strn,
      items = [],
      subtotal: providedSubtotal = 0,
      tax_amount = 0,
      total_amount = 0
    } = poData;
    
    // Calculate subtotal from items if not provided or zero
    const subtotal = providedSubtotal > 0 ? providedSubtotal : items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    // Use tax_percentage from poData if available, otherwise default to 18%
    const taxPercentage = poData.tax_percentage || 18;
    const salesTax = subtotal * (taxPercentage / 100);
    const finalTotal = subtotal + salesTax;
    
    // Format amount in words
    const wholePart = Math.floor(finalTotal);
    const decimalPart = Math.round((finalTotal % 1) * 100);
    let amountInWordsSimple;
    if (decimalPart === 0) {
      amountInWordsSimple = this.numberToWords(wholePart) + ' Only/-';
    } else {
      amountInWordsSimple = this.numberToWords(wholePart) + ' & ' + this.numberToWords(decimalPart) + '/100 Only/-';
    }

    const itemsHTML = items.map((item, index) => {
      const itemDescription = item.description ? `${item.item_name}<br/><small style="color: #666; font-size: 8pt;">${item.description}</small>` : item.item_name;
      const unitPrice = item.unit_price || 0;
      const totalAmount = (item.quantity || 0) * unitPrice;
      return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px;">${itemDescription}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.quantity || 0}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">${unitPrice > 0 ? this.formatCurrency(unitPrice) : ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">${totalAmount > 0 ? this.formatCurrency(totalAmount) : ''}</td>
      </tr>
    `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 15mm 20mm;
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #000;
          line-height: 1.3;
          font-size: 10pt;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .company-name {
          font-size: 16pt;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
        }
        .company-address {
          font-size: 9pt;
          margin-bottom: 3px;
        }
        .contact-info {
          font-size: 9pt;
          margin-bottom: 3px;
        }
        .tax-info {
          font-size: 9pt;
          margin-bottom: 10px;
        }
        .document-title {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          padding: 5px;
          border: none;
        }
        .po-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 10pt;
        }
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin: 10px 0 5px 0;
          background-color: #f3f4f6;
          padding: 5px;
        }
        .supplier-details {
          border: 2px solid #000;
          padding: 8px;
          margin-bottom: 10px;
          font-size: 9pt;
        }
        .supplier-row {
          display: flex;
          margin-bottom: 4px;
        }
        .supplier-label {
          font-weight: bold;
          min-width: 110px;
        }
        .supplier-value {
          flex: 1;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 9pt;
        }
        .items-table th {
          background-color: #000;
          color: white;
          padding: 6px 5px;
          text-align: center;
          font-weight: bold;
        }
        .items-table td {
          border: 1px solid #000;
          padding: 5px;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .totals-table {
          border-collapse: collapse;
          font-size: 10pt;
        }
        .totals-table td {
          border: 1px solid #000;
          padding: 5px 12px;
          text-align: right;
        }
        .totals-table .label {
          text-align: left;
          font-weight: bold;
          background-color: #f3f4f6;
        }
        .amount-words {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 8px;
          text-align: center;
        }
        .terms-section {
          margin-top: 10px;
        }
        .terms-title {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
          background-color: #f3f4f6;
          padding: 5px;
        }
        .terms-subtitle {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .terms-list {
          font-size: 9pt;
          line-height: 1.4;
        }
        .terms-list ol {
          margin: 0;
          padding-left: 18px;
        }
        .terms-list li {
          margin-bottom: 3px;
        }
        .footer {
          margin-top: 10px;
          text-align: center;
          font-size: 8pt;
          color: #666;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <!-- Header Section -->
      <div class="header">
        <div class="company-name">Enterprising Manufacturing Co Pvt Ltd.</div>
        <div class="company-address">Factory : Plot # 9, Sector 26, Korangi Industrial Area, Karachi-Pakistan-74900</div>
        <div class="contact-info">Tel: (+9221) 3507-5379 (+92300) 9279500</div>
        <div class="tax-info">NTN No.: 7268495-5 , Sales Tax No: 3277-87612-9785</div>
      </div>

      <!-- Document Title -->
      <div class="document-title">Purchase Order</div>

      <!-- PO Details -->
      <div class="po-details">
        <div><strong>PO No :</strong> ${po_number}</div>
        <div><strong>Date :</strong> ${this.formatDate(order_date)}</div>
      </div>

      <!-- Supplier Details -->
      <div class="section-title">Supplier Details</div>
      <div class="supplier-details">
        <div class="supplier-row">
          <span class="supplier-label">Name:</span>
          <span class="supplier-value">${supplier_name || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">NTN No:</span>
          <span class="supplier-value">${supplier_ntn || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">Contact Person:</span>
          <span class="supplier-value">${contact_person || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">STRN No:</span>
          <span class="supplier-value">${supplier_strn || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">Phone No:</span>
          <span class="supplier-value">${contact_phone || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">Address:</span>
          <span class="supplier-value">${supplier_address || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">Email:</span>
          <span class="supplier-value">${supplier_email || 'N/A'}</span>
        </div>
        <div class="supplier-row">
          <span class="supplier-label">Delivery:</span>
          <span class="supplier-value">Plot # 9 Sector 26 Korangi Industrial Area Karachi</span>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Item Description</th>
            <th>Qty</th>
            <th>Price / pc</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals Section -->
      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td class="label">Total:</td>
            <td>${this.formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td class="label">Sales Tax ${taxPercentage}%:</td>
            <td>${this.formatCurrency(salesTax)}</td>
          </tr>
          <tr>
            <td class="label">Total Amount:</td>
            <td>${this.formatCurrency(finalTotal)}</td>
          </tr>
        </table>
      </div>

      <!-- Amount in Words -->
      <div class="amount-words">
        Amount In Words : ${amountInWordsSimple}
      </div>

      <!-- Terms & Conditions -->
      <div class="terms-section">
        <div class="terms-title">TERMS & CONDITIONS</div>
        <div class="terms-subtitle">*** Delivery shall get accept on following documents ***</div>
        <div class="terms-list">
          <ol>
            <li>Original Delivery Challan having reference of attached PO.</li>
            <li>Prices mentioned above are final for the total quantity and during the entire delivery schedule.</li>
            <li>Items to be delivered in a Package / Packing (which should specifically be mentioned on PO) as agreed at the time of negotiation</li>
            <li>All goods delivered are subject to approval by EMCPL quality department and if found unsatisfactory, EMCPL reserve the right to reject the same</li>
            <li>Warranty Card of the product must be Provided with delivery.</li>
          </ol>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>This is a computer generated document and does not require a signature.</p>
        <p>Page 1 of 1</p>
      </div>
    </body>
    </html>
    `;
  }

  // Generate PDF using Puppeteer
  async generatePDF(poData) {
    let browser = null;
    try {
      console.log('Starting PDF generation for PO:', poData.po_number);
      
      const puppeteer = await import('puppeteer');
      console.log('Puppeteer imported successfully');
      
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      console.log('Browser launched successfully');

      const page = await browser.newPage();
      console.log('New page created');
      
      const html = this.generateHTMLTemplate(poData);
      console.log('HTML template generated, length:', html.length);
      
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log('Page content set');
      
      const safeFileName = (poData.po_number || 'PO').replace(/[^a-zA-Z0-9]/g, '_');
      const safeSupplierName = (poData.supplier_name || 'Supplier').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const fileName = `PO_${safeFileName}_${safeSupplierName}.pdf`;
      const filePath = path.join(this.purchaseOrdersDir, fileName);
      
      console.log('Generating PDF to:', filePath);
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '20mm',
          bottom: '15mm',
          left: '20mm'
        },
        timeout: 30000,
        preferCSSPageSize: false
      });

      console.log('PDF generated successfully');

      if (browser) {
        await browser.close();
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('PDF file was not created at expected path');
      }

      return {
        success: true,
        fileName,
        filePath,
        fileSize: fs.statSync(filePath).size
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Generate PDF and return file info
  async createPurchaseOrderPDF(poData) {
    try {
      console.log('createPurchaseOrderPDF called with:', {
        po_number: poData.po_number,
        items_count: poData.items?.length || 0,
        has_items: !!poData.items
      });

      // Validate required data
      if (!poData.po_number) {
        throw new Error('PO number is required');
      }

      if (!poData.items || !Array.isArray(poData.items) || poData.items.length === 0) {
        console.warn('No items found in PO data, using empty array');
        poData.items = [];
      }

      // Calculate totals from items
      const subtotal = poData.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        return sum + (quantity * unitPrice);
      }, 0);

      console.log('Calculated subtotal:', subtotal);

      // Use tax_percentage from poData if available, otherwise default to 18%
      const taxPercentage = poData.tax_percentage || 18;
      const taxAmount = subtotal * (taxPercentage / 100);
      
      const enrichedPoData = {
        ...poData,
        subtotal,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount
      };

      console.log('Enriched PO data prepared, calling generatePDF');
      const result = await this.generatePDF(enrichedPoData);
      
      return {
        success: true,
        message: 'Purchase Order PDF generated successfully',
        ...result
      };

    } catch (error) {
      console.error('Error in createPurchaseOrderPDF:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during PDF generation'
      };
    }
  }

  // Get PDF file info
  getPDFInfo(fileName) {
    const filePath = path.join(this.purchaseOrdersDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    return {
      fileName,
      filePath,
      fileSize: stats.size,
      createdDate: stats.birthtime,
      modifiedDate: stats.mtime
    };
  }

  // List all generated PDFs
  listPDFs() {
    try {
      const files = fs.readdirSync(this.purchaseOrdersDir)
        .filter(file => file.endsWith('.pdf'))
        .map(file => this.getPDFInfo(file))
        .filter(info => info !== null);

      return files;
    } catch (error) {
      console.error('Error listing PDFs:', error);
      return [];
    }
  }

  // Delete PDF file
  deletePDF(fileName) {
    try {
      const filePath = path.join(this.purchaseOrdersDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true, message: 'PDF deleted successfully' };
      } else {
        return { success: false, error: 'PDF file not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate HTML template for Dispatch Invoice (based on PO format)
  generateDispatchInvoiceHTMLTemplate(dispatchData) {
    const {
      dispatch_no,
      dispatch_date,
      customer_name,
      customer_code,
      contact_person,
      contact_phone,
      customer_address,
      customer_email,
      customer_ntn,
      customer_strn,
      so_number,
      items = [],
      subtotal: providedSubtotal = 0,
      tax_amount = 0,
      total_amount = 0,
      vehicle_no,
      driver_name,
      oem_name,
      model_name,
      oem_info
    } = dispatchData;
    
    // Use provided amounts from sales order if available, otherwise calculate from items
    const subtotal = providedSubtotal !== null && providedSubtotal !== undefined ? providedSubtotal : items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    // Use provided tax_amount and total_amount from sales order if available
    // Otherwise calculate using tax_percentage
    const taxPercentage = dispatchData.tax_percentage || 18;
    const salesTax = tax_amount !== null && tax_amount !== undefined ? tax_amount : (subtotal * (taxPercentage / 100));
    const finalTotal = total_amount !== null && total_amount !== undefined ? total_amount : (subtotal + salesTax);
    
    // Format amount in words
    const wholePart = Math.floor(finalTotal);
    const decimalPart = Math.round((finalTotal % 1) * 100);
    let amountInWordsSimple;
    if (decimalPart === 0) {
      amountInWordsSimple = this.numberToWords(wholePart) + ' Only/-';
    } else {
      amountInWordsSimple = this.numberToWords(wholePart) + ' & ' + this.numberToWords(decimalPart) + '/100 Only/-';
    }

    const itemsHTML = items.map((item, index) => {
      const itemDescription = item.description ? `${item.product_name || item.item_name}<br/><small style="color: #666; font-size: 8pt;">${item.description}</small>` : (item.product_name || item.item_name || 'N/A');
      const unitPrice = parseFloat(item.unit_price) || 0;  // Ensure numeric conversion
      const totalAmount = (parseFloat(item.quantity) || 0) * unitPrice;
      return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px;">${itemDescription}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.quantity || 0}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">${unitPrice > 0 ? this.formatCurrency(unitPrice) : ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right;">${totalAmount > 0 ? this.formatCurrency(totalAmount) : ''}</td>
      </tr>
    `;
    }).join('');

    // Build OEM/Model display for customer details section
    let oemModelRows = '';
    if (oem_info && Array.isArray(oem_info) && oem_info.length > 0) {
      const uniqueOEMs = [...new Set(oem_info.map(info => info.oem_name).filter(Boolean))];
      const uniqueModels = [...new Set(oem_info.map(info => info.model_name).filter(Boolean))];
      
      if (uniqueOEMs.length > 0) {
        oemModelRows += `
        <div class="customer-row">
          <span class="customer-label">OEM:</span>
          <span class="customer-value">${uniqueOEMs.join(', ')}</span>
        </div>
        `;
      }
      if (uniqueModels.length > 0) {
        oemModelRows += `
        <div class="customer-row">
          <span class="customer-label">Model:</span>
          <span class="customer-value">${uniqueModels.join(', ')}</span>
        </div>
        `;
      }
    } else if (oem_name || model_name) {
      if (oem_name) {
        oemModelRows += `
        <div class="customer-row">
          <span class="customer-label">OEM:</span>
          <span class="customer-value">${oem_name}</span>
        </div>
        `;
      }
      if (model_name) {
        oemModelRows += `
        <div class="customer-row">
          <span class="customer-label">Model:</span>
          <span class="customer-value">${model_name}</span>
        </div>
        `;
      }
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 15mm 20mm;
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #000;
          line-height: 1.3;
          font-size: 10pt;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .company-name {
          font-size: 16pt;
          font-weight: bold;
          color: #000;
          margin-bottom: 5px;
        }
        .company-address {
          font-size: 9pt;
          margin-bottom: 3px;
        }
        .contact-info {
          font-size: 9pt;
          margin-bottom: 3px;
        }
        .tax-info {
          font-size: 9pt;
          margin-bottom: 10px;
        }
        .document-title {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          padding: 5px;
          border: none;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 10pt;
        }
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin: 10px 0 5px 0;
          background-color: #f3f4f6;
          padding: 5px;
        }
        .customer-details {
          border: 2px solid #000;
          padding: 8px;
          margin-bottom: 10px;
          font-size: 9pt;
        }
        .customer-row {
          display: flex;
          margin-bottom: 4px;
        }
        .customer-label {
          font-weight: bold;
          min-width: 110px;
        }
        .customer-value {
          flex: 1;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 9pt;
        }
        .items-table th {
          background-color: #000;
          color: white;
          padding: 6px 5px;
          text-align: center;
          font-weight: bold;
        }
        .items-table td {
          border: 1px solid #000;
          padding: 5px;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }
        .totals-table {
          border-collapse: collapse;
          font-size: 10pt;
        }
        .totals-table td {
          border: 1px solid #000;
          padding: 5px 12px;
          text-align: right;
        }
        .totals-table .label {
          text-align: left;
          font-weight: bold;
          background-color: #f3f4f6;
        }
        .amount-words {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 8px;
          text-align: center;
        }
        .terms-section {
          margin-top: 10px;
        }
        .terms-title {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
          background-color: #f3f4f6;
          padding: 5px;
        }
        .terms-subtitle {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .terms-list {
          font-size: 9pt;
          line-height: 1.4;
        }
        .terms-list ol {
          margin: 0;
          padding-left: 18px;
        }
        .terms-list li {
          margin-bottom: 3px;
        }
        .footer {
          margin-top: 10px;
          text-align: center;
          font-size: 8pt;
          color: #666;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <!-- Header Section -->
      <div class="header">
        <div class="company-name">Enterprising Manufacturing Co Pvt Ltd.</div>
        <div class="company-address">Factory : Plot # 9, Sector 26, Korangi Industrial Area, Karachi-Pakistan-74900</div>
        <div class="contact-info">Tel: (+9221) 3507-5379 (+92300) 9279500</div>
        <div class="tax-info">NTN No.: 7268495-5 , Sales Tax No: 3277-87612-9785</div>
      </div>

      <!-- Document Title -->
      <div class="document-title">Dispatch Invoice</div>

      <!-- Invoice Details -->
      <div class="invoice-details">
        <div><strong>Invoice No :</strong> ${dispatch_no}</div>
        <div><strong>Date :</strong> ${this.formatDate(dispatch_date)}</div>
      </div>

      ${so_number ? `<div class="invoice-details"><div><strong>Sales Order No :</strong> ${so_number}</div></div>` : ''}

      <!-- Customer Details -->
      <div class="section-title">Customer Details</div>
      <div class="customer-details">
        <div class="customer-row">
          <span class="customer-label">Name:</span>
          <span class="customer-value">${customer_name || 'N/A'}</span>
        </div>
        ${customer_code ? `
        <div class="customer-row">
          <span class="customer-label">Customer Code:</span>
          <span class="customer-value">${customer_code}</span>
        </div>
        ` : ''}
        ${oemModelRows}
        ${customer_ntn ? `
        <div class="customer-row">
          <span class="customer-label">NTN No:</span>
          <span class="customer-value">${customer_ntn}</span>
        </div>
        ` : ''}
        ${contact_person ? `
        <div class="customer-row">
          <span class="customer-label">Contact Person:</span>
          <span class="customer-value">${contact_person}</span>
        </div>
        ` : ''}
        ${customer_strn ? `
        <div class="customer-row">
          <span class="customer-label">STRN No:</span>
          <span class="customer-value">${customer_strn}</span>
        </div>
        ` : ''}
        ${contact_phone ? `
        <div class="customer-row">
          <span class="customer-label">Phone No:</span>
          <span class="customer-value">${contact_phone}</span>
        </div>
        ` : ''}
        ${customer_address ? `
        <div class="customer-row">
          <span class="customer-label">Address:</span>
          <span class="customer-value">${customer_address}</span>
        </div>
        ` : ''}
        ${customer_email ? `
        <div class="customer-row">
          <span class="customer-label">Email:</span>
          <span class="customer-value">${customer_email}</span>
        </div>
        ` : ''}
        ${vehicle_no ? `
        <div class="customer-row">
          <span class="customer-label">Vehicle No:</span>
          <span class="customer-value">${vehicle_no}</span>
        </div>
        ` : ''}
        ${driver_name ? `
        <div class="customer-row">
          <span class="customer-label">Driver Name:</span>
          <span class="customer-value">${driver_name}</span>
        </div>
        ` : ''}
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Item Description</th>
            <th>Qty</th>
            <th>Price / pc</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals Section -->
      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td class="label">Total:</td>
            <td>${this.formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td class="label">Sales Tax ${taxPercentage}%:</td>
            <td>${this.formatCurrency(salesTax)}</td>
          </tr>
          <tr>
            <td class="label">Total Amount:</td>
            <td>${this.formatCurrency(finalTotal)}</td>
          </tr>
        </table>
      </div>

      <!-- Amount in Words -->
      <div class="amount-words">
        Amount In Words : ${amountInWordsSimple}
      </div>

      <!-- Terms & Conditions -->
      <div class="terms-section">
        <div class="terms-title">TERMS & CONDITIONS</div>
        <div class="terms-subtitle">*** Delivery Terms ***</div>
        <div class="terms-list">
          <ol>
            <li>Goods dispatched as per Sales Order ${so_number || 'N/A'}.</li>
            <li>All goods are subject to quality inspection at the time of delivery.</li>
            <li>Please verify the quantity and quality of goods upon receipt.</li>
            <li>Any discrepancies must be reported within 48 hours of delivery.</li>
            <li>Payment terms as per agreed contract.</li>
          </ol>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>This is a computer generated document and does not require a signature.</p>
        <p>Page 1 of 1</p>
      </div>
    </body>
    </html>
    `;
  }

  // Generate Dispatch Invoice PDF
  async createDispatchInvoicePDF(dispatchData) {
    try {
      console.log('createDispatchInvoicePDF called with:', {
        dispatch_no: dispatchData.dispatch_no,
        items_count: dispatchData.items?.length || 0,
        has_items: !!dispatchData.items
      });

      // Validate required data
      if (!dispatchData.dispatch_no) {
        throw new Error('Dispatch number is required');
      }

      if (!dispatchData.items || !Array.isArray(dispatchData.items) || dispatchData.items.length === 0) {
        console.warn('No items found in dispatch data, using empty array');
        dispatchData.items = [];
      }

      // Calculate totals from items
      const subtotal = dispatchData.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        return sum + (quantity * unitPrice);
      }, 0);

      console.log('Calculated subtotal:', subtotal);

      // Use tax_percentage from dispatchData if available, otherwise default to 18%
      const taxPercentage = dispatchData.tax_percentage || 18;
      const taxAmount = subtotal * (taxPercentage / 100);
      
      const enrichedDispatchData = {
        ...dispatchData,
        subtotal,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount
      };

      console.log('Enriched dispatch data prepared, calling generatePDF');
      const result = await this.generateDispatchInvoicePDF(enrichedDispatchData);
      
      return {
        success: true,
        message: 'Dispatch Invoice PDF generated successfully',
        ...result
      };

    } catch (error) {
      console.error('Error in createDispatchInvoicePDF:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during PDF generation'
      };
    }
  }

  // Generate PDF using Puppeteer for Dispatch Invoice
  async generateDispatchInvoicePDF(dispatchData) {
    let browser = null;
    try {
      console.log('Starting PDF generation for Dispatch Invoice:', dispatchData.dispatch_no);
      
      const puppeteer = await import('puppeteer');
      console.log('Puppeteer imported successfully');
      
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      console.log('Browser launched successfully');

      const page = await browser.newPage();
      console.log('New page created');
      
      const html = this.generateDispatchInvoiceHTMLTemplate(dispatchData);
      console.log('HTML template generated, length:', html.length);
      
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log('Page content set');
      
      const safeFileName = (dispatchData.dispatch_no || 'DISPATCH').replace(/[^a-zA-Z0-9]/g, '_');
      const safeCustomerName = (dispatchData.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const fileName = `DispatchInvoice_${safeFileName}_${safeCustomerName}.pdf`;
      const filePath = path.join(this.purchaseOrdersDir, fileName);
      
      console.log('Generating PDF to:', filePath);
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '20mm',
          bottom: '15mm',
          left: '20mm'
        },
        timeout: 30000,
        preferCSSPageSize: false
      });

      console.log('PDF generated successfully');

      if (browser) {
        await browser.close();
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('PDF file was not created at expected path');
      }

      return {
        success: true,
        fileName,
        filePath,
        fileSize: fs.statSync(filePath).size
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}

export default new PDFGeneratorService();
