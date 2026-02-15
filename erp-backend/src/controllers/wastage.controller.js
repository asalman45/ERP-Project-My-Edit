// src/controllers/wastage.controller.js
import * as wastageService from '../services/wastage.service.js';
import { validateWastageCreate, validateWastageUpdate, validateWastageSummary } from '../validators/wastage.validator.js';
import { logger } from '../utils/logger.js';

export const createWastage = async (req, res) => {
  const { error, value } = validateWastageCreate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const wastage = await wastageService.createWastage(value);
    
    logger.info({ wastage_id: wastage.wastage_id, wo_id: value.wo_id }, 'Wastage recorded');
    return res.status(201).json({ 
      success: true, 
      data: wastage, 
      message: 'Wastage recorded successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to record wastage');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to record wastage. Please try again.' 
    });
  }
};

export const getAllWastage = async (req, res) => {
  try {
    const { wo_id, material_id, location_id, limit, offset } = req.query;
    const wastage = await wastageService.getAllWastage({
      wo_id,
      material_id,
      location_id,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    });
    
    return res.json({ 
      success: true, 
      data: wastage, 
      message: 'Wastage records retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve wastage records');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve wastage records. Please try again.' 
    });
  }
};

export const getWastageById = async (req, res) => {
  try {
    const wastage = await wastageService.getWastageById(req.params.id);
    if (!wastage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wastage record not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      data: wastage, 
      message: 'Wastage record retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, wastage_id: req.params.id }, 'Failed to retrieve wastage record');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve wastage record. Please try again.' 
    });
  }
};

export const updateWastage = async (req, res) => {
  const { error, value } = validateWastageUpdate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const wastage = await wastageService.updateWastage(req.params.id, value);
    
    logger.info({ wastage_id: req.params.id }, 'Wastage record updated');
    return res.json({ 
      success: true, 
      data: wastage, 
      message: 'Wastage record updated successfully' 
    });
  } catch (err) {
    logger.error({ err, wastage_id: req.params.id }, 'Failed to update wastage record');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update wastage record. Please try again.' 
    });
  }
};

export const getWastageByWorkOrder = async (req, res) => {
  try {
    const wastage = await wastageService.getWastageByWorkOrder(req.params.woId);
    return res.json({ 
      success: true, 
      data: wastage, 
      message: 'Wastage by work order retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, wo_id: req.params.woId }, 'Failed to retrieve wastage by work order');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve wastage by work order. Please try again.' 
    });
  }
};

export const getWastageByMaterial = async (req, res) => {
  try {
    const wastage = await wastageService.getWastageByMaterial(req.params.materialId);
    return res.json({ 
      success: true, 
      data: wastage, 
      message: 'Wastage by material retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err, material_id: req.params.materialId }, 'Failed to retrieve wastage by material');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve wastage by material. Please try again.' 
    });
  }
};

export const getWastageSummary = async (req, res) => {
  const { error, value } = validateWastageSummary(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const summary = await wastageService.getWastageSummary(value);
    return res.json({ 
      success: true, 
      data: summary, 
      message: 'Wastage summary retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve wastage summary');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve wastage summary. Please try again.' 
    });
  }
};
