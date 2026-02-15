// src/controllers/scrapReuse.controller.js
import * as scrapReuseService from '../services/scrapReuse.service.js';
import { validateReuseScrap, validateScrapReuseHistory, validateScrapSavings } from '../validators/scrapReuse.validator.js';
import { logger } from '../utils/logger.js';

export const reuseScrapIntoStock = async (req, res) => {
  const { error, value } = validateReuseScrap(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const result = await scrapReuseService.reuseScrapIntoStock({
      ...value,
      created_by: req.user?.id || 'system'
    });
    
    logger.info({ 
      scrap_id: value.scrap_id, 
      quantity: value.quantity_to_reuse,
      inventory_txn_id: result.inventory_txn.txn_id 
    }, 'Scrap reused into stock');
    
    return res.status(201).json({ 
      success: true, 
      data: result, 
      message: 'Scrap successfully reused into stock' 
    });
  } catch (err) {
    logger.error({ err, scrap_id: value.scrap_id }, 'Failed to reuse scrap into stock');
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to reuse scrap into stock. Please try again.' 
    });
  }
};

export const getReusableScrap = async (req, res) => {
  try {
    const { materialId, locationId } = req.params;
    const scrap = await scrapReuseService.getReusableScrap(materialId, locationId);
    
    return res.json({ 
      success: true, 
      data: scrap, 
      message: 'Reusable scrap retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, materialId: req.params.materialId }, 'Failed to retrieve reusable scrap');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve reusable scrap. Please try again.' 
    });
  }
};

export const getScrapReuseHistory = async (req, res) => {
  const { error, value } = validateScrapReuseHistory(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const history = await scrapReuseService.getScrapReuseHistory(value);
    return res.json({ 
      success: true, 
      data: history, 
      message: 'Scrap reuse history retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve scrap reuse history');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scrap reuse history. Please try again.' 
    });
  }
};

export const getScrapReuseSavings = async (req, res) => {
  const { error, value } = validateScrapSavings(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const savings = await scrapReuseService.calculateScrapReuseSavings(value);
    return res.json({ 
      success: true, 
      data: savings, 
      message: 'Scrap reuse savings calculated successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to calculate scrap reuse savings');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate scrap reuse savings. Please try again.' 
    });
  }
};
