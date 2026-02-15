// src/controllers/oem.controller.js
import * as oemModel from '../models/oem.model.js';
import { logger } from '../utils/logger.js';

export const listOEMs = async (req, res) => {
  const rows = await oemModel.findAll();
  res.json({ data: rows });
};

export const getOEM = async (req, res) => {
  const oem = await oemModel.findById(req.params.id);
  if (!oem) return res.status(404).json({ error: 'OEM not found' });
  res.json({ data: oem });
};

export const createOEM = async (req, res) => {
  if (!req.body.oem_name) return res.status(400).json({ error: 'oem_name required' });
  
  try {
    const oem = await oemModel.create(req.body);
    logger.info({ oem_id: oem.oem_id }, 'OEM created');
    res.status(201).json({ data: oem });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'oem_oem_name_key') {
      return res.status(409).json({ 
        error: `OEM '${req.body.oem_name}' already exists. Please use a different name.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, oem_name: req.body.oem_name }, 'Failed to create OEM');
    return res.status(500).json({ error: 'Failed to create OEM. Please try again.' });
  }
};

export const updateOEM = async (req, res) => {
  const oem = await oemModel.update(req.params.id, req.body);
  if (!oem) return res.status(404).json({ error: 'OEM not found' });
  res.json({ data: oem });
};

export const deleteOEM = async (req, res) => {
  await oemModel.remove(req.params.id);
  res.status(204).send();
};
