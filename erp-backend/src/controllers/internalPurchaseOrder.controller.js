// src/controllers/internalPurchaseOrder.controller.js
// Controller for Internal Purchase Orders

import * as ipoModel from '../models/internalPurchaseOrder.model.js';
import pdfGeneratorService from '../services/pdfGenerator.service.js';
import emailService from '../services/emailService.service.js';
import { logger } from '../utils/logger.js';

// Create new Internal Purchase Order
export const createIPO = async (req, res) => {
  try {
    const ipoData = req.body;
    
    // Generate PO number if not provided
    if (!ipoData.po_number) {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 6);
      ipoData.po_number = `EMCPL-${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
    }

    // Set default values
    ipoData.order_date = ipoData.order_date || new Date().toISOString().split('T')[0];
    ipoData.created_by = ipoData.created_by || 'system';

    const ipo = await ipoModel.createInternalPO(ipoData);

    logger.info({
      ipo_id: ipo.ipo_id,
      po_number: ipo.po_number,
      supplier_name: ipo.supplier_name
    }, 'Internal Purchase Order created via API');

    res.status(201).json({
      success: true,
      data: ipo,
      message: 'Internal Purchase Order created successfully'
    });

  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'API: Failed to create Internal Purchase Order');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Internal Purchase Order'
    });
  }
};

// Get Internal Purchase Order by ID
export const getIPOById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ipo = await ipoModel.findInternalPOById(id);
    
    if (!ipo) {
      return res.status(404).json({
        success: false,
        error: 'Internal Purchase Order not found'
      });
    }

    res.json({
      success: true,
      data: ipo
    });

  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 'API: Failed to get Internal Purchase Order by ID');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Internal Purchase Order'
    });
  }
};

// Get Internal Purchase Order by PO Number
export const getIPOByNumber = async (req, res) => {
  try {
    const { poNumber } = req.params;
    
    const ipo = await ipoModel.findInternalPOByNumber(poNumber);
    
    if (!ipo) {
      return res.status(404).json({
        success: false,
        error: 'Internal Purchase Order not found'
      });
    }

    res.json({
      success: true,
      data: ipo
    });

  } catch (error) {
    logger.error({ error: error.message, poNumber: req.params.poNumber }, 'API: Failed to get Internal Purchase Order by number');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Internal Purchase Order'
    });
  }
};

// Get all Internal Purchase Orders
export const getAllIPOs = async (req, res) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status,
      supplier_id: req.query.supplier_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search
    };

    const ipos = await ipoModel.findAllInternalPOs(filters);

    res.json({
      success: true,
      data: ipos,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: ipos.length
      }
    });

  } catch (error) {
    logger.error({ error: error.message, query: req.query }, 'API: Failed to get all Internal Purchase Orders');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Internal Purchase Orders'
    });
  }
};

// Update Internal Purchase Order status
export const updateIPOStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'SENT', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedIPO = await ipoModel.updateInternalPOStatus(id, status, updated_by || 'system');

    res.json({
      success: true,
      data: updatedIPO,
      message: 'Internal Purchase Order status updated successfully'
    });

  } catch (error) {
    logger.error({ error: error.message, id: req.params.id, body: req.body }, 'API: Failed to update Internal Purchase Order status');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update Internal Purchase Order status'
    });
  }
};

// Generate PDF for Internal Purchase Order
export const generateIPOPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ipo = await ipoModel.findInternalPOById(id);
    
    if (!ipo) {
      return res.status(404).json({
        success: false,
        error: 'Internal Purchase Order not found'
      });
    }

    const pdfResult = await pdfGeneratorService.createPurchaseOrderPDF(ipo);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        error: pdfResult.error
      });
    }

    logger.info({
      ipo_id: id,
      po_number: ipo.po_number,
      file_name: pdfResult.fileName
    }, 'IPO PDF generated via API');

    // Return PDF file for download
    const fs = await import('fs');
    if (fs.default.existsSync(pdfResult.filePath)) {
      const pdfBuffer = fs.default.readFileSync(pdfResult.filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } else {
      return res.status(500).json({
        success: false,
        error: 'PDF file was not created'
      });
    }

  } catch (error) {
    logger.error({ 
      error: error.message, 
      stack: error.stack,
      id: req.params.id 
    }, 'API: Failed to generate IPO PDF');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Purchase Order PDF',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Send Internal Purchase Order via email
export const sendIPOEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_email } = req.body;

    if (!supplier_email) {
      return res.status(400).json({
        success: false,
        error: 'Supplier email is required'
      });
    }

    const ipo = await ipoModel.findInternalPOById(id);
    
    if (!ipo) {
      return res.status(404).json({
        success: false,
        error: 'Internal Purchase Order not found'
      });
    }

    // Generate PDF first
    const pdfResult = await pdfGeneratorService.createPurchaseOrderPDF(ipo);
    
    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        error: `PDF generation failed: ${pdfResult.error}`
      });
    }

    // Send email with PDF attachment
    const emailResult = await emailService.sendPurchaseOrderEmail(ipo, pdfResult.filePath, supplier_email);

    // Update IPO status to 'SENT'
    await ipoModel.updateInternalPOStatus(id, 'SENT', 'system');

    logger.info({
      ipo_id: id,
      po_number: ipo.po_number,
      supplier_email,
      message_id: emailResult.messageId
    }, 'IPO email sent via API');

    res.json({
      success: true,
      data: {
        email_result: emailResult,
        pdf_result: pdfResult
      },
      message: 'Purchase Order sent via email successfully'
    });

  } catch (error) {
    logger.error({ error: error.message, id: req.params.id, body: req.body }, 'API: Failed to send IPO email');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send Purchase Order email'
    });
  }
};

// Generate PDF and send email in one action
export const generateAndSendIPO = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_email } = req.body;

    if (!supplier_email) {
      return res.status(400).json({
        success: false,
        error: 'Supplier email is required'
      });
    }

    const ipo = await ipoModel.findInternalPOById(id);
    
    if (!ipo) {
      return res.status(404).json({
        success: false,
        error: 'Internal Purchase Order not found'
      });
    }

    // Generate PDF
    const pdfResult = await pdfGeneratorService.createPurchaseOrderPDF(ipo);
    
    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        error: `PDF generation failed: ${pdfResult.error}`
      });
    }

    // Send email with PDF attachment
    const emailResult = await emailService.sendPurchaseOrderEmail(ipo, pdfResult.filePath, supplier_email);

    // Update IPO status to 'SENT'
    const updatedIPO = await ipoModel.updateInternalPOStatus(id, 'SENT', 'system');

    logger.info({
      ipo_id: id,
      po_number: ipo.po_number,
      supplier_email,
      message_id: emailResult.messageId,
      file_name: pdfResult.fileName
    }, 'IPO PDF generated and email sent via API');

    res.json({
      success: true,
      data: {
        ipo: updatedIPO,
        email_result: emailResult,
        pdf_result: pdfResult
      },
      message: 'Purchase Order PDF generated and sent via email successfully'
    });

  } catch (error) {
    logger.error({ error: error.message, id: req.params.id, body: req.body }, 'API: Failed to generate and send IPO');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate and send Purchase Order'
    });
  }
};

// Get Internal Purchase Order statistics
export const getIPOStats = async (req, res) => {
  try {
    const stats = await ipoModel.getInternalPOStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error({ error: error.message }, 'API: Failed to get IPO stats');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Internal Purchase Order statistics'
    });
  }
};

// Delete Internal Purchase Order
export const deleteIPO = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedIPO = await ipoModel.deleteInternalPO(id);

    logger.info({
      ipo_id: id,
      po_number: deletedIPO.po_number
    }, 'IPO deleted via API');

    res.json({
      success: true,
      data: deletedIPO,
      message: 'Internal Purchase Order deleted successfully'
    });

  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 'API: Failed to delete IPO');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete Internal Purchase Order'
    });
  }
};

// Test email configuration
export const testEmailConfig = async (req, res) => {
  try {
    const { test_email } = req.body;

    if (!test_email) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      });
    }

    const result = await emailService.sendTestEmail(test_email);

    res.json({
      success: true,
      data: result,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'API: Failed to send test email');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
};

// Verify email configuration
export const verifyEmailConfig = async (req, res) => {
  try {
    const result = await emailService.verifyConnection();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error({ error: error.message }, 'API: Failed to verify email configuration');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify email configuration'
    });
  }
};
