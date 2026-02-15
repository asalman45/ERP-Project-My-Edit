// src/controllers/raw_material.controller.js
import * as rawMaterialModel from '../models/raw_material.model.js';
import { validateRawMaterialCreate, validateRawMaterialUpdate } from '../validators/raw_material.validator.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import XLSX from 'xlsx';
import path from 'path';
import db from '../utils/db.js';
// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';

export const listRawMaterials = async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const rows = await rawMaterialModel.findAll({ limit: Number(limit), offset: Number(offset) });
  return res.json({ data: rows });
};

export const getRawMaterial = async (req, res) => {
  const rawMaterial = await rawMaterialModel.findById(req.params.id);
  if (!rawMaterial) return res.status(404).json({ error: 'Raw material not found' });
  return res.json({ data: rawMaterial });
};

export const createRawMaterial = async (req, res) => {
  const { error, value } = validateRawMaterialCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const rawMaterial = await rawMaterialModel.create(value);
    logger.info({ raw_material_id: rawMaterial.raw_material_id }, 'raw material created');
    return res.status(201).json({ data: rawMaterial });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'raw_material_material_code_key') {
      return res.status(409).json({ 
        error: `Material code '${value.material_code}' already exists. Please use a different material code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, material_code: value.material_code }, 'Failed to create raw material');
    return res.status(500).json({ error: 'Failed to create raw material. Please try again.' });
  }
};

export const updateRawMaterial = async (req, res) => {
  const { error, value } = validateRawMaterialUpdate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const rawMaterial = await rawMaterialModel.update(req.params.id, value);
    if (!rawMaterial) return res.status(404).json({ error: 'Raw material not found' });
    return res.json({ data: rawMaterial });
  } catch (err) {
    // Handle other database errors
    logger.error({ err, raw_material_id: req.params.id }, 'Failed to update raw material');
    return res.status(500).json({ error: 'Failed to update raw material. Please try again.' });
  }
};

export const deleteRawMaterial = async (req, res) => {
  try {
    const result = await rawMaterialModel.remove(req.params.id);
    if (!result) return res.status(404).json({ error: 'Raw material not found' });
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, raw_material_id: req.params.id }, 'Failed to delete raw material');
    
    // Handle foreign key constraint violations with detailed reference information
    if (err.code === '23503' || err.issues) {
      // Build detailed error message
      let errorMessage = 'Cannot delete this raw material. It is currently being used in:\n';
      
      if (err.issues && err.issues.length > 0) {
        errorMessage += err.issues.join(', ');
      } else {
        errorMessage += 'inventory, BOM items, purchase orders, or other transactions';
      }
      
      errorMessage += '\n\nPlease remove all references first.';
      
      return res.status(409).json({ 
        error: errorMessage,
        references: err.references || {},
        issues: err.issues || []
      });
    }
    
    // Handle other database constraint violations
    if (err.code && err.code.startsWith('23')) {
      return res.status(409).json({ 
        error: `Cannot delete this raw material: ${err.message || 'Database constraint violation'}` 
      });
    }
    
    return res.status(500).json({ error: 'Failed to delete raw material. Please try again.' });
  }
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Import raw materials data from CSV/Excel
export const importRawMaterials = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let rawMaterialData = [];

    // Parse CSV
    if (fileExtension === '.csv') {
      const csvData = file.buffer.toString('utf8');
      // Remove BOM if present
      const cleanData = csvData.replace(/^\uFEFF/, '');
      const lines = cleanData.split('\n').filter(line => line.trim());
      
      if (!lines.length) {
        return res.status(400).json({ error: 'CSV file is empty' });
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      logger.debug({ headers, headerCount: headers.length }, 'CSV headers parsed');
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = (values[index] || '').toString();
        });
        logger.debug({ row, lineNumber: i + 1, values, valueCount: values.length }, 'CSV row parsed');
        rawMaterialData.push(row);
      }
    } 
    // Parse Excel
    else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawMaterialData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (!rawMaterialData.length) {
      return res.status(400).json({ error: 'Uploaded file has no data' });
    }

    // Validate and process data
    const errors = [];
    const processed = [];

    for (let i = 0; i < rawMaterialData.length; i++) {
      const row = rawMaterialData[i];
      try {
        // Debug: Log the row to see what we're getting
        logger.debug({ row, rowKeys: Object.keys(row) }, 'Processing row');
        
        // Map CSV/Excel columns to raw material fields
        // Headers are converted to lowercase, so use lowercase keys
        const material_code = String(row.material_code || row['material_code'] || '').trim();
        const name = String(row.name || '').trim();
        const description = String(row.description || '').trim();
        const uom_id = row.uom_id ? String(row.uom_id).trim() : null;
        const uom_code = String(row.uom_code || '').trim();

        // Validate required fields
        if (!material_code || !name) {
          errors.push(`Row ${i + 2}: material_code and name are required. Got material_code: "${material_code}", name: "${name}"`);
          continue;
        }

        // Look up UOM ID if uom_code is provided
        let resolvedUomId = uom_id;
        if (!resolvedUomId && uom_code) {
          const uomResult = await db.query(
            'SELECT uom_id FROM uom WHERE code = $1',
            [uom_code]
          );
          if (uomResult.rows.length > 0) {
            resolvedUomId = uomResult.rows[0].uom_id;
          } else {
            errors.push(`Row ${i + 2}: UOM code '${uom_code}' not found`);
            continue;
          }
        }

        processed.push({
          material_code,
          name,
          description: description || '',
          uom_id: resolvedUomId
        });
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    if (processed.length === 0) {
      logger.error({ 
        errors, 
        rawMaterialDataLength: rawMaterialData.length,
        sampleRow: rawMaterialData[0],
        sampleRowKeys: rawMaterialData[0] ? Object.keys(rawMaterialData[0]) : []
      }, 'No valid rows to import');
      
      return res.status(400).json({
        error: 'No valid rows to import',
        details: errors,
        processed: 0,
        total: rawMaterialData.length,
        sampleRow: rawMaterialData[0] || null,
        sampleRowKeys: rawMaterialData[0] ? Object.keys(rawMaterialData[0]) : []
      });
    }

    // Bulk insert raw materials
    const results = [];
    for (const item of processed) {
      try {
        // Check if material_code already exists
        const existing = await rawMaterialModel.findByMaterialCode(item.material_code);
        if (existing) {
          errors.push(`Material code '${item.material_code}' already exists`);
          continue;
        }

        const created = await rawMaterialModel.create(item);
        results.push(created);
      } catch (err) {
        logger.error({ err, item }, 'Failed to create raw material during import');
        if (err.code === '23505' && err.constraint === 'raw_material_material_code_key') {
          errors.push(`Material code '${item.material_code}' already exists`);
        } else {
          errors.push(`Failed to create '${item.material_code}': ${err.message}`);
        }
      }
    }

    logger.info({
      imported: results.length,
      total: processed.length,
      errors: errors.length
    }, 'Raw materials import completed');

    return res.json({
      success: true,
      message: `Successfully imported ${results.length} raw materials`,
      data: {
        imported: results.length,
        total: processed.length,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to import raw materials data');
    return res.status(500).json({ error: 'Failed to import raw materials data' });
  }
};

// Export raw materials data to PDF
export const exportRawMaterials = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const rawMaterialsData = await rawMaterialModel.findAll({ 
      limit: 10000,
      offset: 0,
    });

    if (format === 'csv') {
      const csvHeaders =
        'Raw Material ID,Material Code,Name,Description,UOM Code,UOM Name,Created At\n';
      const csvRows = rawMaterialsData
        .map(
          (item) =>
            `"${item.raw_material_id}","${item.material_code || ''}","${
              item.name || ''
            }","${item.description || ''}","${item.uom_code || ''}","${
              item.uom_name || ''
            }","${item.created_at || ''}"`
        )
        .join('\n');
      const csvContent = csvHeaders + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="raw-materials-${new Date()
          .toISOString()
          .split('T')[0]}.csv"`
      );
      return res.send(csvContent);
    } else if (format === 'pdf') {
      let browser;
      try {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Raw Materials Report</title>
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
                <h2>Raw Materials Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()} &nbsp; | &nbsp; Total Raw Materials: ${rawMaterialsData.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Material Code</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>UOM Code</th>
                    <th>UOM Name</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  ${rawMaterialsData
                    .map(
                      (item) => `
                    <tr>
                      <td>${item.material_code || ''}</td>
                      <td>${item.name || ''}</td>
                      <td>${item.description || ''}</td>
                      <td>${item.uom_code || ''}</td>
                      <td>${item.uom_name || ''}</td>
                      <td>${item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
              <div class="footer">
                This report was generated automatically by the ERP system.
              </div>
            </body>
          </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="raw-materials-${new Date()
            .toISOString()
            .split('T')[0]}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
      } catch (pdfError) {
        logger.error({ error: pdfError }, 'Failed to generate raw materials PDF');
        if (browser) {
          await browser.close();
        }
        return res.status(500).json({
          error: 'Failed to generate PDF',
          message: 'PDF generation failed. Please try again or use CSV export instead.',
        });
      }
    }
    
    return res.json({ data: rawMaterialsData });
  } catch (error) {
    logger.error({ error }, 'Failed to export raw materials data');
    return res.status(500).json({ error: 'Failed to export raw materials data' });
  }
};
