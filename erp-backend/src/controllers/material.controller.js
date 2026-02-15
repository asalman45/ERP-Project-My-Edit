// src/controllers/material.controller.js
import * as materialModel from '../models/material.model.js';
import { validateMaterialCreate } from '../validators/material.validator.js';
import { logger } from '../utils/logger.js';

export const listMaterials = async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const rows = await materialModel.findAll({ limit: Number(limit), offset: Number(offset) });
  return res.json({ data: rows });
};

export const getMaterial = async (req, res) => {
  const material = await materialModel.findById(req.params.id);
  if (!material) return res.status(404).json({ error: 'Material not found' });
  return res.json({ data: material });
};

export const createMaterial = async (req, res) => {
  const { error, value } = validateMaterialCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const material = await materialModel.create(value);
    logger.info({ material_id: material.material_id }, 'material created');
    return res.status(201).json({ data: material });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'material_material_code_key') {
      return res.status(409).json({ 
        error: `Material code '${value.material_code}' already exists. Please use a different material code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, material_code: value.material_code }, 'Failed to create material');
    return res.status(500).json({ error: 'Failed to create material. Please try again.' });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const material = await materialModel.update(req.params.id, req.body);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    return res.json({ data: material });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'material_material_code_key') {
      return res.status(409).json({ 
        error: `Material code '${req.body.material_code}' already exists. Please use a different material code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, material_id: req.params.id }, 'Failed to update material');
    return res.status(500).json({ error: 'Failed to update material. Please try again.' });
  }
};

export const deleteMaterial = async (req, res) => {
  await materialModel.remove(req.params.id);
  return res.status(204).send();
};
