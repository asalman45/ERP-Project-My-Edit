// src/controllers/location.controller.js
import * as locationModel from '../models/location.model.js';
import { validateLocationCreate } from '../validators/location.validator.js';
import { logger } from '../utils/logger.js';

export const listLocations = async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const rows = await locationModel.findAll({ limit: Number(limit), offset: Number(offset) });
  return res.json({ data: rows });
};

export const getLocation = async (req, res) => {
  const location = await locationModel.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });
  return res.json({ data: location });
};

export const createLocation = async (req, res) => {
  const { error, value } = validateLocationCreate(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const location = await locationModel.create(value);
    logger.info({ location_id: location.location_id }, 'location created');
    return res.status(201).json({ data: location });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'location_code_key') {
      return res.status(409).json({ 
        error: `Location code '${value.code}' already exists. Please use a different location code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, location_code: value.code }, 'Failed to create location');
    return res.status(500).json({ error: 'Failed to create location. Please try again.' });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const location = await locationModel.update(req.params.id, req.body);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    return res.json({ data: location });
  } catch (err) {
    // Handle duplicate key constraint violations
    if (err.code === '23505' && err.constraint === 'location_code_key') {
      return res.status(409).json({ 
        error: `Location code '${req.body.code}' already exists. Please use a different location code.` 
      });
    }
    
    // Handle other database errors
    logger.error({ err, location_id: req.params.id }, 'Failed to update location');
    return res.status(500).json({ error: 'Failed to update location. Please try again.' });
  }
};

export const deleteLocation = async (req, res) => {
  await locationModel.remove(req.params.id);
  return res.status(204).send();
};
