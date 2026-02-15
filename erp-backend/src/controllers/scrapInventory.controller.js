// src/controllers/scrapInventory.controller.js
import * as scrapInventoryModel from '../models/scrapInventory.model.js';
import { logger } from '../utils/logger.js';

export const getScrapInventory = async (req, res) => {
  try {
    const filters = req.query;
    const scrapItems = await scrapInventoryModel.findAll(filters);

    logger.info({ filters }, 'Scrap inventory retrieved');
    return res.json({ data: scrapItems });
  } catch (err) {
    logger.error({ err }, 'Failed to get scrap inventory');
    return res.status(500).json({ error: 'Failed to retrieve scrap inventory. Please try again.' });
  }
};

export const getScrapItem = async (req, res) => {
  try {
    const { scrapId } = req.params;
    const scrapItem = await scrapInventoryModel.findById(scrapId);

    if (!scrapItem) {
      return res.status(404).json({ error: 'Scrap item not found' });
    }

    logger.info({ scrap_id: scrapId }, 'Scrap item retrieved');
    return res.json({ data: scrapItem });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to get scrap item');
    return res.status(500).json({ error: 'Failed to retrieve scrap item. Please try again.' });
  }
};

export const createScrapItem = async (req, res) => {
  try {
    const {
      blank_id,
      material_id,
      width_mm,
      length_mm,
      thickness_mm,
      weight_kg,
      location_id,
      status = 'AVAILABLE',
      created_by,
      reference,
      consumed_by_po
    } = req.body;

    // Validate required fields
    if (!width_mm || !length_mm || !thickness_mm || !weight_kg) {
      return res.status(400).json({ 
        error: 'width_mm, length_mm, thickness_mm, and weight_kg are required' 
      });
    }

    const scrapItem = await scrapInventoryModel.create({
      blank_id,
      material_id,
      width_mm,
      length_mm,
      thickness_mm,
      weight_kg,
      location_id,
      status,
      created_by,
      reference,
      consumed_by_po
    });

    logger.info({ 
      scrap_id: scrapItem.scrap_id,
      dimensions: `${width_mm}x${length_mm}x${thickness_mm}`,
      weight: weight_kg
    }, 'Scrap item created');

    return res.status(201).json({ data: scrapItem });
  } catch (err) {
    logger.error({ err }, 'Failed to create scrap item');
    return res.status(500).json({ error: 'Failed to create scrap item. Please try again.' });
  }
};

export const updateScrapItem = async (req, res) => {
  try {
    const { scrapId } = req.params;
    const updateData = req.body;

    const scrapItem = await scrapInventoryModel.update(scrapId, updateData);
    if (!scrapItem) {
      return res.status(404).json({ error: 'Scrap item not found' });
    }

    logger.info({ scrap_id: scrapId }, 'Scrap item updated');
    return res.json({ data: scrapItem });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to update scrap item');
    return res.status(500).json({ error: 'Failed to update scrap item. Please try again.' });
  }
};

export const deleteScrapItem = async (req, res) => {
  try {
    const { scrapId } = req.params;
    await scrapInventoryModel.remove(scrapId);

    logger.info({ scrap_id: scrapId }, 'Scrap item deleted');
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to delete scrap item');
    return res.status(500).json({ error: 'Failed to delete scrap item. Please try again.' });
  }
};

export const getAvailableScrap = async (req, res) => {
  try {
    const filters = req.query;
    const availableScrap = await scrapInventoryModel.findAvailableScrap(filters);

    logger.info({ filters }, 'Available scrap retrieved');
    return res.json({ data: availableScrap });
  } catch (err) {
    logger.error({ err }, 'Failed to get available scrap');
    return res.status(500).json({ error: 'Failed to retrieve available scrap. Please try again.' });
  }
};

export const findMatchingScrap = async (req, res) => {
  try {
    const { width_mm, length_mm, thickness_mm, material_id } = req.body;

    if (!width_mm || !length_mm || !thickness_mm) {
      return res.status(400).json({ 
        error: 'width_mm, length_mm, and thickness_mm are required' 
      });
    }

    const matchingScrap = await scrapInventoryModel.findMatchingScrap(
      width_mm, length_mm, thickness_mm, material_id
    );

    logger.info({ 
      dimensions: `${width_mm}x${length_mm}x${thickness_mm}`,
      material_id,
      matches_found: matchingScrap.length
    }, 'Matching scrap found');

    return res.json({ data: matchingScrap });
  } catch (err) {
    logger.error({ err }, 'Failed to find matching scrap');
    return res.status(500).json({ error: 'Failed to find matching scrap. Please try again.' });
  }
};

export const markAsConsumed = async (req, res) => {
  try {
    const { scrapId } = req.params;
    const { consumed_by_po } = req.body;

    const scrapItem = await scrapInventoryModel.markAsConsumed(scrapId, consumed_by_po);
    if (!scrapItem) {
      return res.status(404).json({ error: 'Scrap item not found' });
    }

    logger.info({ 
      scrap_id: scrapId, 
      consumed_by_po 
    }, 'Scrap item marked as consumed');

    return res.json({ data: scrapItem });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to mark scrap as consumed');
    return res.status(500).json({ error: 'Failed to mark scrap as consumed. Please try again.' });
  }
};

export const getScrapSummary = async (req, res) => {
  try {
    const summary = await scrapInventoryModel.getScrapSummary();

    logger.info({ 
      total_items: summary.total_items,
      total_weight: summary.total_weight 
    }, 'Scrap summary retrieved');
    
    return res.json(summary);
  } catch (err) {
    logger.error({ err }, 'Failed to get scrap summary');
    return res.status(500).json({ error: 'Failed to retrieve scrap summary. Please try again.' });
  }
};
