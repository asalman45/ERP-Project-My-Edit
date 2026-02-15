// src/controllers/product.controller.js
import * as productModel from '../models/product.model.js';
import { validateProductCreate } from '../validators/product.validator.js';
import { logger } from '../utils/logger.js';
// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';

export const listProducts = async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const rows = await productModel.findAll({ limit: Number(limit), offset: Number(offset) });
  return res.json({ data: rows });
};

export const getProduct = async (req, res) => {
  const p = await productModel.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  return res.json({ data: p });
};

export const createProduct = async (req, res) => {
  const { error, value } = validateProductCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const product = await productModel.create(value);
    logger.info({ product_id: product.product_id }, 'product created');
    return res.status(201).json({ data: product });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'product_product_code_key') {
      return res.status(409).json({ 
        error: `Product code '${value.product_code}' already exists. Please use a different product code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, product_code: value.product_code }, 'Failed to create product');
    return res.status(500).json({ error: 'Failed to create product. Please try again.' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await productModel.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ data: product });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'product_product_code_key') {
      return res.status(409).json({ 
        error: `Product code '${req.body.product_code}' already exists. Please use a different product code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, product_id: req.params.id }, 'Failed to update product');
    return res.status(500).json({ error: 'Failed to update product. Please try again.' });
  }
};

export const deleteProduct = async (req, res) => {
  await productModel.remove(req.params.id);
  return res.status(204).send();
};

// Export products data
export const exportProducts = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Get products data
    const productsData = await productModel.findAll({ 
      limit: 10000,
      offset: 0
    });
    
    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = 'Product ID,Product Code,Part Name,Description,OEM,Model,UOM,Standard Cost,Category,Min Stock,Max Stock,Reorder Qty,Created At\n';
      const csvRows = productsData.map(product =>
        `"${product.product_id}","${product.product_code}","${product.part_name}","${product.description || ''}","${product.oem_name || ''}","${product.model_name || ''}","${product.uom_code || ''}","${product.standard_cost || 0}","${product.category}","${product.min_stock || 0}","${product.max_stock || 0}","${product.reorder_qty || 0}","${product.created_at}"`
      ).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="products-${new Date().toISOString().split('T')[0]}.csv"`);
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
          <title>Products Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
            .summary h3 { margin-top: 0; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
            .low-stock { color: red; font-weight: bold; }
            .ok-stock { color: green; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Products Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Products: ${productsData.length}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Products:</strong> ${productsData.length}</p>
            <p><strong>Categories:</strong> ${[...new Set(productsData.map(p => p.category))].join(', ')}</p>
            <p><strong>Low Stock Items:</strong> ${productsData.filter(p => p.min_stock && p.quantity <= p.min_stock).length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Part Name</th>
                <th>Description</th>
                <th>OEM</th>
                <th>Model</th>
                <th>UOM</th>
                <th>Standard Cost</th>
                <th>Category</th>
                <th>Min Stock</th>
                <th>Max Stock</th>
                <th>Reorder Qty</th>
              </tr>
            </thead>
            <tbody>
              ${productsData.map(product => `
                <tr>
                  <td>${product.product_code || ''}</td>
                  <td>${product.part_name || ''}</td>
                  <td>${product.description || ''}</td>
                  <td>${product.oem_name || ''}</td>
                  <td>${product.model_name || ''}</td>
                  <td>${product.uom_code || ''}</td>
                  <td>$${product.standard_cost || 0}</td>
                  <td>${product.category || ''}</td>
                  <td>${product.min_stock || 0}</td>
                  <td>${product.max_stock || 0}</td>
                  <td>${product.reorder_qty || 0}</td>
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
        res.setHeader('Content-Disposition', `attachment; filename="products-${new Date().toISOString().split('T')[0]}.pdf"`);
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
      return res.json({ data: productsData });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to export products data');
    return res.status(500).json({ error: 'Failed to export products data' });
  }
};
