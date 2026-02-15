// src/controllers/purchase_order.controller.js
import * as poModel from '../models/purchase_order.model.js';
import * as poItemModel from '../models/purchase_order_item.model.js';
import { validatePOCreate, validatePOItemCreate, validateStatusUpdate } from '../validators/purchase_order.validator.js';
import { logger } from '../utils/logger.js';

export const listPurchaseOrders = async (req, res) => {
  const { limit = 50, offset = 0, supplier_id, status } = req.query;
  const rows = await poModel.findAll({ 
    limit: Number(limit), 
    offset: Number(offset),
    supplier_id,
    status
  });
  return res.json({ data: rows });
};

export const getPurchaseOrder = async (req, res) => {
  const po = await poModel.findById(req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  
  // Get PO items
  const items = await poItemModel.findByPOId(req.params.id);
  
  return res.json({ 
    data: {
      ...po,
      items: items
    }
  });
};

export const createPurchaseOrder = async (req, res) => {
  const { error, value } = validatePOCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const po = await poModel.create(value);
    logger.info({ po_id: po.po_id, po_no: value.po_no }, 'purchase order created');
    return res.status(201).json({ data: po });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'purchase_order_po_no_key') {
      return res.status(409).json({ 
        error: `Purchase order number '${value.po_no}' already exists. Please use a different PO number.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, po_no: value.po_no }, 'Failed to create purchase order');
    return res.status(500).json({ error: 'Failed to create purchase order. Please try again.' });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await poModel.update(req.params.id, req.body);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    return res.json({ data: po });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'purchase_order_po_no_key') {
      return res.status(409).json({ 
        error: `Purchase order number '${req.body.po_no}' already exists. Please use a different PO number.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, po_id: req.params.id }, 'Failed to update purchase order');
    return res.status(500).json({ error: 'Failed to update purchase order. Please try again.' });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedPO = await poModel.remove(id);
    
    logger.info({ 
      po_id: id,
      po_no: deletedPO.po_no 
    }, 'Purchase order deleted');
    
    return res.json({
      success: true,
      data: deletedPO,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    logger.error({ 
      error: error.message, 
      po_id: req.params.id 
    }, 'Failed to delete purchase order');
    
    if (error.message === 'Purchase order not found') {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete purchase order'
    });
  }
};

export const updateStatus = async (req, res) => {
  const { error, value } = validateStatusUpdate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const po = await poModel.update(req.params.id, value);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    
    logger.info({ po_id: req.params.id, status: value.status }, 'purchase order status updated');
    return res.json({ data: po });
  } catch (err) {
    logger.error({ err, po_id: req.params.id }, 'Failed to update purchase order status');
    return res.status(500).json({ error: 'Failed to update purchase order status. Please try again.' });
  }
};

// PO Items endpoints
export const getPOItems = async (req, res) => {
  const items = await poItemModel.findByPOId(req.params.poId);
  return res.json({ data: items });
};

export const addPOItem = async (req, res) => {
  const { error, value } = validatePOItemCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const item = await poItemModel.create(value);
    logger.info({ po_item_id: item.po_item_id, po_id: value.po_id }, 'PO item added');
    return res.status(201).json({ data: item });
  } catch (err) {
    logger.error({ err, po_id: value.po_id }, 'Failed to add PO item');
    return res.status(500).json({ error: 'Failed to add PO item. Please try again.' });
  }
};

export const updatePOItem = async (req, res) => {
  try {
    const item = await poItemModel.update(req.params.itemId, req.body);
    if (!item) return res.status(404).json({ error: 'PO item not found' });
    return res.json({ data: item });
  } catch (err) {
    logger.error({ err, po_item_id: req.params.itemId }, 'Failed to update PO item');
    return res.status(500).json({ error: 'Failed to update PO item. Please try again.' });
  }
};

export const deletePOItem = async (req, res) => {
  await poItemModel.remove(req.params.itemId);
  return res.status(204).send();
};
