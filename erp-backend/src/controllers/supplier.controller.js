// src/controllers/supplier.controller.js
import * as supplierModel from '../models/supplier.model.js';
import { validateSupplierCreate } from '../validators/supplier.validator.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import XLSX from 'xlsx';
import path from 'path';
import db from '../utils/db.js';
// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';

export const listSuppliers = async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const rows = await supplierModel.findAll({ limit: Number(limit), offset: Number(offset) });
  return res.json({ data: rows });
};

export const getSupplier = async (req, res) => {
  const supplier = await supplierModel.findById(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  return res.json({ data: supplier });
};

export const createSupplier = async (req, res) => {
  const { error, value } = validateSupplierCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const supplier = await supplierModel.create(value);
    logger.info({ supplier_id: supplier.supplier_id }, 'supplier created');
    return res.status(201).json({ data: supplier });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'supplier_code_key') {
      return res.status(409).json({ 
        error: `Supplier code '${value.code}' already exists. Please use a different supplier code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, supplier_code: value.code }, 'Failed to create supplier');
    return res.status(500).json({ error: 'Failed to create supplier. Please try again.' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await supplierModel.update(req.params.id, req.body);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    return res.json({ data: supplier });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'supplier_code_key') {
      return res.status(409).json({ 
        error: `Supplier code '${req.body.code}' already exists. Please use a different supplier code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, supplier_id: req.params.id }, 'Failed to update supplier');
    return res.status(500).json({ error: 'Failed to update supplier. Please try again.' });
  }
};

export const deleteSupplier = async (req, res) => {
  await supplierModel.remove(req.params.id);
  return res.status(204).send();
};

// Configure multer for supplier import
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  }
});

export const uploadMiddleware = upload.single('file');

// Import suppliers data from CSV/Excel
export const importSuppliers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let supplierData = [];

    if (fileExtension === '.csv') {
      const csvData = file.buffer.toString('utf8');
      const cleanData = csvData.replace(/^\uFEFF/, '');
      const lines = cleanData.split('\n').filter(line => line.trim());

      if (!lines.length) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (!values.length) continue;
        const row = {};
        headers.forEach((header, index) => {
          row[header] = (values[index] || '').toString();
        });
        supplierData.push(row);
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      supplierData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (!supplierData.length) {
      return res.status(400).json({ error: 'Uploaded file has no data' });
    }

    const errors = [];
    const processed = [];

    for (let i = 0; i < supplierData.length; i++) {
      const row = supplierData[i];
      try {
        const code = String(row.code || '').trim();
        const name = String(row.name || '').trim();
        const contact = String(row.contact || '').trim() || null;
        const phone = String(row.phone || '').trim() || null;
        const email = String(row.email || '').trim() || null;
        const address = String(row.address || '').trim() || null;
        const lead_time_days_raw = String(row.lead_time_days || row['lead time days'] || row['lead_time_days'] || '').trim();
        const lead_time_days = lead_time_days_raw ? Number(lead_time_days_raw) : null;

        if (!code || !name) {
          errors.push(`Row ${i + 2}: code and name are required`);
          continue;
        }

        if (lead_time_days_raw && Number.isNaN(lead_time_days)) {
          errors.push(`Row ${i + 2}: lead_time_days must be a number`);
          continue;
        }

        processed.push({
          code,
          name,
          contact,
          phone,
          email,
          address,
          lead_time_days
        });
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    if (!processed.length) {
      return res.status(400).json({
        error: 'No valid rows to import',
        details: errors,
        processed: 0,
        total: supplierData.length,
        sampleRow: supplierData[0] || null,
        sampleRowKeys: supplierData[0] ? Object.keys(supplierData[0]) : []
      });
    }

    const results = [];
    for (const item of processed) {
      try {
        const existing = await supplierModel.findByCode(item.code);
        if (existing) {
          errors.push(`Supplier code '${item.code}' already exists`);
          continue;
        }
        const created = await supplierModel.create(item);
        results.push(created);
      } catch (err) {
        logger.error({ err, code: item.code }, 'Failed to import supplier');
        errors.push(`Supplier code '${item.code}': ${err.message}`);
      }
    }

    return res.json({
      success: true,
      message: `Imported ${results.length} suppliers`,
      data: {
        imported: results.length,
        total: processed.length,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to import suppliers data');
    return res.status(500).json({ error: 'Failed to import suppliers data' });
  }
};

// Export suppliers data
export const exportSuppliers = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Get suppliers data
    const suppliersData = await supplierModel.findAll({ 
      limit: 10000,
      offset: 0
    });
    
    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = 'Supplier ID,Code,Name,Contact,Phone,Email,Address,Lead Time (Days),Created At\n';
      const csvRows = suppliersData.map(supplier => 
        `"${supplier.supplier_id}","${supplier.code}","${supplier.name}","${supplier.contact || ''}","${supplier.phone || ''}","${supplier.email || ''}","${supplier.address || ''}","${supplier.lead_time_days || ''}","${supplier.created_at}"`
      ).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="suppliers-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
      
    } else if (format === 'pdf') {
      try {
        // Generate PDF using Puppeteer
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Suppliers Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .company-header { text-align: center; margin-bottom: 30px; }
            .company-header h1 { color: #333; margin: 0; }
            .company-header p { color: #666; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="company-header">
            <h1>Enterprising Manufacturing Co Pvt. Ltd.</h1>
            <p>Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900</p>
            <p>Tel: (+9221) 3507 5579 | (+92300) 9279500</p>
            <p>NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <h2>Suppliers Report</h2>
            <p>Generated on: ${new Date().toLocaleDateString()} &nbsp; | &nbsp; Total Suppliers: ${suppliersData.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Lead Time (Days)</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${suppliersData.map(supplier => `
                <tr>
                  <td>${supplier.code || ''}</td>
                  <td>${supplier.name || ''}</td>
                  <td>${supplier.contact || ''}</td>
                  <td>${supplier.phone || ''}</td>
                  <td>${supplier.email || ''}</td>
                  <td>${supplier.address || ''}</td>
                  <td>${supplier.lead_time_days || ''}</td>
                  <td>${new Date(supplier.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated automatically by the ERP system.</p>
          </div>
        </body>
        </html>
      `;
      
        await page.setContent(htmlContent);
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });
        
        await browser.close();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="suppliers-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
        
      } catch (pdfError) {
        logger.error({ error: pdfError }, 'Failed to generate PDF');
        await browser?.close();
        return res.status(500).json({ 
          error: 'Failed to generate PDF', 
          message: 'PDF generation failed. Please try again or use CSV export instead.' 
        });
      }
      
    } else {
      // Return JSON data for other formats
      return res.json({ data: suppliersData });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to export suppliers data');
    return res.status(500).json({ error: 'Failed to export suppliers data' });
  }
};
