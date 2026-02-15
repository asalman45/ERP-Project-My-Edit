// src/controllers/model.controller.js
import * as modelModel from '../models/model.model.js';
import { logger } from '../utils/logger.js';

export const listModels = async (req, res) => {
  const rows = await modelModel.findAll();
  res.json({ data: rows });
};

export const getModel = async (req, res) => {
  const model = await modelModel.findById(req.params.id);
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json({ data: model });
};

export const listModelsByOEM = async (req, res) => {
  const rows = await modelModel.findByOEM(req.params.oemId);
  res.json({ data: rows });
};

export const createModel = async (req, res) => {
  if (!req.body.model_name || !req.body.oem_id) {
    return res.status(400).json({ error: 'oem_id and model_name required' });
  }
  
  try {
    const model = await modelModel.create(req.body);
    logger.info({ model_id: model.model_id }, 'Model created');
    res.status(201).json({ data: model });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'model_oem_id_model_name_key') {
      return res.status(409).json({ 
        error: `Model '${req.body.model_name}' already exists for this OEM. Please use a different model name.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, model_name: req.body.model_name, oem_id: req.body.oem_id }, 'Failed to create model');
    return res.status(500).json({ error: 'Failed to create model. Please try again.' });
  }
};

export const updateModel = async (req, res) => {
  try {
    const model = await modelModel.update(req.params.id, req.body);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    res.json({ data: model });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'model_oem_id_model_name_key') {
      return res.status(409).json({ 
        error: `Model '${req.body.model_name}' already exists for this OEM. Please use a different model name.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, model_id: req.params.id }, 'Failed to update model');
    return res.status(500).json({ error: 'Failed to update model. Please try again.' });
  }
};

export const deleteModel = async (req, res) => {
  await modelModel.remove(req.params.id);
  res.status(204).send();
};
