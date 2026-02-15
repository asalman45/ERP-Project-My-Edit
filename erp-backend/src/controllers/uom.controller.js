// src/controllers/uom.controller.js
import * as uomModel from '../models/uom.model.js';
import { logger } from '../utils/logger.js';

export const listUOMs = async (req, res) => {
  const rows = await uomModel.findAll();
  res.json({ data: rows });
};

export const getUOM = async (req, res) => {
  const uom = await uomModel.findById(req.params.id);
  if (!uom) return res.status(404).json({ error: 'UOM not found' });
  res.json({ data: uom });
};

export const createUOM = async (req, res) => {
  if (!req.body.code || !req.body.name) {
    return res.status(400).json({ error: 'code and name required' });
  }
  
  try {
    const uom = await uomModel.create(req.body);
    logger.info({ uom_id: uom.uom_id }, 'UOM created');
    res.status(201).json({ data: uom });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'uom_code_key') {
      return res.status(409).json({ 
        error: `UOM code '${req.body.code}' already exists. Please use a different code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, code: req.body.code, name: req.body.name }, 'Failed to create UOM');
    return res.status(500).json({ error: 'Failed to create UOM. Please try again.' });
  }
};

export const updateUOM = async (req, res) => {
  try {
    const uom = await uomModel.update(req.params.id, req.body);
    if (!uom) return res.status(404).json({ error: 'UOM not found' });
    res.json({ data: uom });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'uom_code_key') {
      return res.status(409).json({ 
        error: `UOM code '${req.body.code}' already exists. Please use a different code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, uom_id: req.params.id }, 'Failed to update UOM');
    return res.status(500).json({ error: 'Failed to update UOM. Please try again.' });
  }
};

export const deleteUOM = async (req, res) => {
  await uomModel.remove(req.params.id);
  res.status(204).send();
};
