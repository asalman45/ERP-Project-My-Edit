// src/controllers/scrap.controller.js
import * as scrapService from '../services/scrap.service.js';
import { validateScrapCreate, validateScrapTransactionCreate, validateScrapStatusUpdate } from '../validators/scrap.validator.js';
import { logger } from '../utils/logger.js';

export const createScrap = async (req, res) => {
  const { error, value } = validateScrapCreate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const scrap = await scrapService.createScrapInventory({
      ...value,
      created_by: req.user?.id || 'system'
    });
    
    logger.info({ scrap_id: scrap.scrap_id }, 'Scrap inventory created');
    return res.status(201).json({ 
      success: true, 
      data: scrap, 
      message: 'Scrap inventory created successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create scrap inventory');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create scrap inventory. Please try again.' 
    });
  }
};

export const getAllScrap = async (req, res) => {
  try {
    const { status, location_id, material_id, limit, offset } = req.query;
    const scrap = await scrapService.getAllScrapInventory({
      status,
      location_id,
      material_id,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    
    return res.json({ 
      success: true, 
      data: scrap, 
      message: 'Scrap inventory retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve scrap inventory');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scrap inventory. Please try again.' 
    });
  }
};

export const getScrapById = async (req, res) => {
  try {
    const scrap = await scrapService.getScrapById(req.params.id);
    if (!scrap) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scrap inventory not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      data: scrap, 
      message: 'Scrap inventory retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.id }, 'Failed to retrieve scrap inventory');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scrap inventory. Please try again.' 
    });
  }
};

export const updateScrapStatus = async (req, res) => {
  const { error, value } = validateScrapStatusUpdate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const scrap = await scrapService.updateScrapStatus(
      req.params.id, 
      value.status, 
      req.user?.id || 'system'
    );
    
    logger.info({ scrap_id: req.params.id, status: value.status }, 'Scrap status updated');
    return res.json({ 
      success: true, 
      data: scrap, 
      message: 'Scrap status updated successfully' 
    });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.id }, 'Failed to update scrap status');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update scrap status. Please try again.' 
    });
  }
};

export const createScrapTransaction = async (req, res) => {
  const { error, value } = validateScrapTransactionCreate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const transaction = await scrapService.recordScrapTransaction({
      ...value,
      created_by: req.user?.id || 'system'
    });
    
    logger.info({ txn_id: transaction.txn_id, txn_type: value.txn_type }, 'Scrap transaction created');
    return res.status(201).json({ 
      success: true, 
      data: transaction, 
      message: 'Scrap transaction created successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create scrap transaction');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create scrap transaction. Please try again.' 
    });
  }
};

export const getScrapTransactions = async (req, res) => {
  try {
    const { scrap_id, txn_type, limit, offset } = req.query;
    const transactions = await scrapService.getScrapTransactions({
      scrap_id,
      txn_type,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    
    return res.json({ 
      success: true, 
      data: transactions, 
      message: 'Scrap transactions retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve scrap transactions');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scrap transactions. Please try again.' 
    });
  }
};

export const getScrapByLocation = async (req, res) => {
  try {
    const scrap = await scrapService.getScrapByLocation(req.params.locationId);
    return res.json({ 
      success: true, 
      data: scrap, 
      message: 'Scrap by location retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, location_id: req.params.locationId }, 'Failed to retrieve scrap by location');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scrap by location. Please try again.' 
    });
  }
};

export const getScrapByMaterial = async (req, res) => {
  try {
    const scrap = await scrapService.getScrapByMaterial(req.params.materialId);
    return res.json({ 
      success: true, 
      data: scrap, 
      message: 'Scrap by material retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, material_id: req.params.materialId }, 'Failed to retrieve scrap by material');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve scrap by material. Please try again.' 
    });
  }
};
