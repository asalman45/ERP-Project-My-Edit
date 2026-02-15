// src/controllers/inventory.controller.js
import * as inventoryModel from '../models/inventory.model.js';
import * as inventoryTxnModel from '../models/inventory_txn.model.js';
import { validateInventoryCreate, validateTxnCreate } from '../validators/inventory.validator.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export const listInventory = async (req, res) => {
  const { limit = 50, offset = 0, product_id, material_id, location_id } = req.query;
  const rows = await inventoryModel.findAll({ 
    limit: Number(limit), 
    offset: Number(offset),
    product_id,
    material_id,
    location_id
  });
  return res.json({ data: rows });
};

export const getInventory = async (req, res) => {
  const inventory = await inventoryModel.findById(req.params.id);
  if (!inventory) return res.status(404).json({ error: 'Inventory item not found' });
  return res.json({ data: inventory });
};

export const createInventory = async (req, res) => {
  const { error, value } = validateInventoryCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const inventory = await inventoryModel.create(value);
    logger.info({ inventory_id: inventory.inventory_id }, 'inventory item created');
    return res.status(201).json({ data: inventory });
  } catch (err) {
    logger.error({ err }, 'Failed to create inventory item');
    return res.status(500).json({ error: 'Failed to create inventory item. Please try again.' });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const inventory = await inventoryModel.update(req.params.id, req.body);
    if (!inventory) return res.status(404).json({ error: 'Inventory item not found' });
    return res.json({ data: inventory });
  } catch (err) {
    logger.error({ err, inventory_id: req.params.id }, 'Failed to update inventory item');
    return res.status(500).json({ error: 'Failed to update inventory item. Please try again.' });
  }
};

export const deleteInventory = async (req, res) => {
  await inventoryModel.remove(req.params.id);
  return res.status(204).send();
};

// Transaction endpoints
export const listTransactions = async (req, res) => {
  const { limit = 50, offset = 0, product_id, material_id, txn_type, wo_id, po_id } = req.query;
  const rows = await inventoryTxnModel.findAll({ 
    limit: Number(limit), 
    offset: Number(offset),
    product_id,
    material_id,
    txn_type,
    wo_id,
    po_id
  });
  return res.json({ data: rows });
};

export const createTransaction = async (req, res) => {
  const { error, value } = validateTxnCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const transaction = await inventoryTxnModel.create(value);
    logger.info({ txn_id: transaction.txn_id, txn_type: value.txn_type }, 'inventory transaction created');
    return res.status(201).json({ data: transaction });
  } catch (err) {
    logger.error({ err, txn_type: value.txn_type }, 'Failed to create inventory transaction');
    return res.status(500).json({ error: 'Failed to create inventory transaction. Please try again.' });
  }
};

export const getInventoryTransactions = async (req, res) => {
  const transactions = await inventoryTxnModel.findByInventoryId(req.params.inventoryId);
  return res.json({ data: transactions });
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

// Import inventory data from CSV/Excel
export const importInventory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let inventoryData = [];

    if (fileExtension === '.csv') {
      // Parse CSV
      const csvData = file.buffer.toString('utf8');
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          inventoryData.push(row);
        }
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      inventoryData = XLSX.utils.sheet_to_json(worksheet);
    }

    // Validate and process inventory data
    const processedData = [];
    const errors = [];

    for (let i = 0; i < inventoryData.length; i++) {
      const row = inventoryData[i];
      try {
        // Map CSV/Excel columns to inventory fields
        const inventoryItem = {
          product_id: row.product_id || row['Product ID'] || row['product_id'],
          material_id: row.material_id || row['Material ID'] || row['material_id'],
          location_id: row.location_id || row['Location ID'] || row['location_id'],
          quantity: parseFloat(row.quantity || row['Quantity'] || row['quantity']) || 0,
          min_stock_level: parseFloat(row.min_stock_level || row['Min Stock Level'] || row['min_stock_level']) || 0,
          max_stock_level: parseFloat(row.max_stock_level || row['Max Stock Level'] || row['max_stock_level']) || 0,
          unit_cost: parseFloat(row.unit_cost || row['Unit Cost'] || row['unit_cost']) || 0,
          notes: row.notes || row['Notes'] || row['notes'] || ''
        };

        // Validate required fields
        if (!inventoryItem.product_id && !inventoryItem.material_id) {
          errors.push(`Row ${i + 2}: Either product_id or material_id is required`);
          continue;
        }

        if (!inventoryItem.location_id) {
          errors.push(`Row ${i + 2}: location_id is required`);
          continue;
        }

        processedData.push(inventoryItem);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation errors found', 
        details: errors,
        processed: processedData.length,
        total: inventoryData.length
      });
    }

    // Bulk insert inventory data
    const results = [];
    for (const item of processedData) {
      try {
        const created = await inventoryModel.create(item);
        results.push(created);
      } catch (error) {
        logger.error({ error, item }, 'Failed to create inventory item during import');
        errors.push(`Failed to create item: ${error.message}`);
      }
    }

    logger.info({ 
      imported: results.length, 
      total: processedData.length,
      errors: errors.length 
    }, 'Inventory import completed');

    return res.json({
      success: true,
      message: `Successfully imported ${results.length} inventory items`,
      data: {
        imported: results.length,
        total: processedData.length,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to import inventory data');
    return res.status(500).json({ error: 'Failed to import inventory data' });
  }
};

// Export inventory data to PDF
export const exportInventory = async (req, res) => {
  try {
    const { format = 'pdf', filters = {} } = req.query;
    
    // Get inventory data with filters
    const inventoryData = await inventoryModel.findAll({ 
      limit: 10000, // Large limit for export
      offset: 0,
      ...filters
    });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = 'Inventory ID,Product/Material,Code,Name,Quantity,Location,Status,UOM,Unit Cost,Total Value,Created At\n';
      const csvRows = inventoryData.map(item => {
        const itemName = item.product_name || item.material_name || 'N/A';
        const itemCode = item.product_code || item.material_code || 'N/A';
        const totalValue = (item.quantity * (item.unit_cost || 0)).toFixed(2);
        
        return `"${item.inventory_id}","${itemName}","${itemCode}","${itemName}","${item.quantity}","${item.location_name || 'N/A'}","${item.status}","${item.uom_code || 'N/A'}","${item.unit_cost || 0}","${totalValue}","${item.created_at}"`;
      }).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`);
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
      
      // Calculate summary data
      const totalItems = inventoryData.length;
      const totalValue = inventoryData.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0);
      const lowStockItems = inventoryData.filter(item => item.quantity <= (item.min_stock_level || 0)).length;
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
            .summary h3 { margin-top: 0; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            .low-stock { color: red; font-weight: bold; }
            .ok-stock { color: green; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Items: ${totalItems}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Items:</strong> ${totalItems}</p>
            <p><strong>Total Value:</strong> $${totalValue.toFixed(2)}</p>
            <p><strong>Low Stock Items:</strong> ${lowStockItems}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product/Material</th>
                <th>Code</th>
                <th>Location</th>
                <th>Quantity</th>
                <th>UOM</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryData.map(item => {
                const itemName = item.product_name || item.material_name || 'N/A';
                const itemCode = item.product_code || item.material_code || 'N/A';
                const totalValue = (item.quantity * (item.unit_cost || 0)).toFixed(2);
                const isLowStock = item.quantity <= (item.min_stock_level || 0);
                const statusClass = isLowStock ? 'low-stock' : 'ok-stock';
                const statusText = isLowStock ? 'Low Stock' : 'OK';
                
                return `
                  <tr>
                    <td>${item.inventory_id || ''}</td>
                    <td>${itemName}</td>
                    <td>${itemCode}</td>
                    <td>${item.location_name || 'N/A'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${item.uom_code || 'N/A'}</td>
                    <td>$${item.unit_cost || 0}</td>
                    <td>$${totalValue}</td>
                    <td class="${statusClass}">${statusText}</td>
                  </tr>
                `;
              }).join('')}
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
        res.setHeader('Content-Disposition', `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.pdf"`);
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
      return res.json({ data: inventoryData });
    }

  } catch (error) {
    logger.error({ error }, 'Failed to export inventory data');
    return res.status(500).json({ error: 'Failed to export inventory data' });
  }
};

// Middleware for file upload
export const uploadMiddleware = upload.single('file');
