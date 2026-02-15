// src/controllers/goodsReceipt.controller.js
import goodsReceiptService from '../services/goodsReceipt.service.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new Goods Receipt Note (GRN)
 * POST /api/goods-receipt
 */
export async function createGRN(req, res) {
  try {
    const grnData = req.body;

    // Validate required fields
    if (!grnData.po_id) {
      return res.status(400).json({
        success: false,
        error: 'Purchase Order ID is required'
      });
    }

    if (!grnData.items || grnData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    logger.info({ po_id: grnData.po_id }, 'Creating GRN from PO');

    const grn = await goodsReceiptService.createGoodsReceipt(grnData);

    res.status(201).json({
      success: true,
      data: grn,
      message: 'Goods Receipt Note created successfully'
    });

  } catch (error) {
    logger.error({ error, body: req.body }, 'Error creating GRN');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create GRN'
    });
  }
}

/**
 * Get all Goods Receipt Notes
 * GET /api/goods-receipt
 */
export async function getAllGRNs(req, res) {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      supplier_id: req.query.supplier_id,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    const grns = await goodsReceiptService.getAllGoodsReceipts(filters);

    res.json({
      success: true,
      data: grns,
      count: grns.length
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching GRNs');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch GRNs'
    });
  }
}

/**
 * Get Goods Receipt Note by ID
 * GET /api/goods-receipt/:id
 */
export async function getGRNById(req, res) {
  try {
    const { id } = req.params;

    const grn = await goodsReceiptService.getGoodsReceiptById(id);

    if (!grn) {
      return res.status(404).json({
        success: false,
        error: 'GRN not found'
      });
    }

    res.json({
      success: true,
      data: grn
    });

  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Error fetching GRN by ID');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch GRN'
    });
  }
}

/**
 * Get stock-in records
 * GET /api/inventory/stock-in
 */
export async function getStockIn(req, res) {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0,
      material_id: req.query.material_id,
      location_id: req.query.location_id,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };

    const stockInRecords = await goodsReceiptService.getStockInRecords(filters);

    res.json({
      success: true,
      data: stockInRecords,
      count: stockInRecords.length
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching stock-in records');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stock-in records'
    });
  }
}

export default {
  createGRN,
  getAllGRNs,
  getGRNById,
  getStockIn
};

