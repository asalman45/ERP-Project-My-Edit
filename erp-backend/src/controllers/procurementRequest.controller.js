import procurementRequestService from '../services/procurementRequest.service.js';
// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';

/**
 * Create a new procurement request
 */
const createProcurementRequest = async (req, res) => {
  try {
    const { material_id, quantity, requested_by, notes, reference_po } = req.body;

    // Validate required fields
    if (!material_id || !quantity || !requested_by) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: material_id, quantity, requested_by'
      });
    }

    const procurementRequest = await procurementRequestService.createProcurementRequest({
      material_id,
      quantity,
      requested_by,
      notes,
      reference_po
    });

    res.status(201).json({
      success: true,
      message: 'Procurement request created successfully',
      data: procurementRequest
    });
  } catch (error) {
    console.error('Error creating procurement request:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create procurement request'
    });
  }
};

/**
 * Get all procurement requests
 */
const getProcurementRequests = async (req, res) => {
  try {
    const {
      status,
      material_id,
      requested_by,
      limit = 100,
      offset = 0
    } = req.query;

    const filters = {
      status,
      material_id,
      requested_by,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const procurementRequests = await procurementRequestService.getProcurementRequests(filters);

    res.json({
      success: true,
      data: procurementRequests,
      count: procurementRequests.length
    });
  } catch (error) {
    console.error('Error fetching procurement requests:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch procurement requests'
    });
  }
};

/**
 * Get procurement request by ID
 */
const getProcurementRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const procurementRequest = await procurementRequestService.getProcurementRequestById(id);

    res.json({
      success: true,
      data: procurementRequest
    });
  } catch (error) {
    console.error('Error fetching procurement request:', error);
    const statusCode = error.message === 'Procurement request not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch procurement request'
    });
  }
};

/**
 * Update procurement request status
 */
const updateProcurementRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by, rejection_reason } = req.body;

    if (!status || !updated_by) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: status, updated_by'
      });
    }

    const procurementRequest = await procurementRequestService.updateProcurementRequestStatus(
      id,
      status,
      updated_by,
      rejection_reason
    );

    res.json({
      success: true,
      message: 'Procurement request status updated successfully',
      data: procurementRequest
    });
  } catch (error) {
    console.error('Error updating procurement request status:', error);
    const statusCode = error.message === 'Procurement request not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update procurement request status'
    });
  }
};

/**
 * Get procurement requests by status
 */
const getProcurementRequestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status parameter is required'
      });
    }

    const requests = await procurementRequestService.getProcurementRequestsByStatus(status);

    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching procurement requests by status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch procurement requests by status'
    });
  }
};

/**
 * Get procurement statistics
 */
const getProcurementStats = async (req, res) => {
  try {
    const stats = await procurementRequestService.getProcurementStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching procurement stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch procurement statistics'
    });
  }
};

/**
 * Export procurement data to PDF/CSV
 */
const exportProcurement = async (req, res) => {
  try {
    const { format = 'json', status, start_date, end_date } = req.query;
    
    // Build filters
    const filters = {
      limit: 10000,
      offset: 0
    };
    
    if (status && status !== 'all') {
      filters.status = status.toUpperCase();
    }
    
    // Get procurement data
    const procurementData = await procurementRequestService.getProcurementRequests(filters);
    
    // Apply date filtering if provided
    let filteredData = procurementData;
    if (start_date || end_date) {
      filteredData = procurementData.filter(item => {
        const itemDate = new Date(item.created_at);
        if (start_date && itemDate < new Date(start_date)) return false;
        if (end_date && itemDate > new Date(end_date)) return false;
        return true;
      });
    }
    
    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = 'Request ID,Material Code,Material Name,Quantity,UOM Code,Status,Requested By,Approved By,Received By,Notes,Reference PO,Created At,Updated At\n';
      const csvRows = filteredData.map(item => 
        `"${item.id}","${item.material?.material_code || ''}","${item.material?.name || ''}","${item.quantity || ''}","${item.material?.uom?.code || ''}","${item.status || ''}","${item.requested_by || ''}","${item.approved_by || ''}","${item.received_by || ''}","${(item.notes || '').replace(/"/g, '""')}","${item.reference_po || ''}","${item.created_at || ''}","${item.updated_at || ''}"`
      ).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="procurement-${new Date().toISOString().split('T')[0]}.csv"`);
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
          <title>Procurement Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .company-header { text-align: center; margin-bottom: 30px; }
            .company-header h1 { color: #333; margin: 0; }
            .company-header p { color: #666; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
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
            <h2>Procurement Requests Report</h2>
            <p>Generated on: ${new Date().toLocaleDateString()} &nbsp; | &nbsp; Total Requests: ${filteredData.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Material Code</th>
                <th>Material Name</th>
                <th>Quantity</th>
                <th>UOM</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Approved By</th>
                <th>Received By</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => `
                <tr>
                  <td>${item.id || ''}</td>
                  <td>${item.material?.material_code || ''}</td>
                  <td>${item.material?.name || ''}</td>
                  <td>${item.quantity || ''}</td>
                  <td>${item.material?.uom?.code || ''}</td>
                  <td>${item.status || ''}</td>
                  <td>${item.requested_by || ''}</td>
                  <td>${item.approved_by || ''}</td>
                  <td>${item.received_by || ''}</td>
                  <td>${item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</td>
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
        res.setHeader('Content-Disposition', `attachment; filename="procurement-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
        
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError);
        await browser?.close();
        return res.status(500).json({ 
          error: 'Failed to generate PDF', 
          message: 'PDF generation failed. Please try again or use CSV export instead.' 
        });
      }
      
    } else {
      // Return JSON data for other formats
      return res.json({ data: filteredData });
    }
  } catch (error) {
    console.error('Failed to export procurement data:', error);
    return res.status(500).json({ error: 'Failed to export procurement data' });
  }
};

export default {
  createProcurementRequest,
  getProcurementRequests,
  getProcurementRequestById,
  updateProcurementRequestStatus,
  getProcurementRequestsByStatus,
  getProcurementStats,
  exportProcurement
};
