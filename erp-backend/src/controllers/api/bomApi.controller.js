// src/controllers/api/bomApi.controller.js
// API Controller for BOM operations (Production Recipe + Cutting BOM integration)

import bomService from '../../services/bomService.js';
import { logger } from '../../utils/logger.js';
import db from '../../utils/db.js';

/**
 * Explode BOM for a product
 * POST /api/bom/explode
 * Body: { productId, quantity, userId }
 */
export async function explodeBOM(req, res) {
  try {
    const { productId, quantity, userId } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }
    
    logger.info({ productId, quantity, userId }, 'API: Exploding BOM');
    
    const result = await bomService.explodeBOM(productId, quantity);
    
    // Log the explosion for audit
    if (userId) {
      await bomService.logBOMExplosion(productId, quantity, result, userId);
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error exploding BOM');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to explode BOM'
    });
  }
}

/**
 * Get production recipe BOM for a product
 * GET /api/bom/production-recipe/:productId
 */
export async function getProductionRecipe(req, res) {
  try {
    const { productId } = req.params;
    
    logger.info({ productId }, 'API: Fetching production recipe BOM');
    
    const result = await bomService.getProductionRecipeBOM(productId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, productId: req.params.productId }, 'API: Error fetching production recipe');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch production recipe'
    });
  }
}

/**
 * Create or update BOM item
 * POST /api/bom/item
 * Body: { bomItem }
 */
export async function createOrUpdateBOMItem(req, res) {
  try {
    const bomItem = req.body;
    
    if (!bomItem.product_id || !bomItem.quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }
    
    logger.info({ bomId: bomItem.bom_id, productId: bomItem.product_id }, 'API: Creating/updating BOM item');
    
    const result = await bomService.createOrUpdateBOMItem(bomItem);
    
    res.json({
      success: true,
      data: result,
      message: bomItem.bom_id ? 'BOM item updated successfully' : 'BOM item created successfully'
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error creating/updating BOM item');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save BOM item'
    });
  }
}

/**
 * Delete BOM item
 * DELETE /api/bom/item/:bomId
 */
export async function deleteBOMItem(req, res) {
  try {
    const { bomId } = req.params;
    
    logger.info({ bomId }, 'API: Deleting BOM item');
    
    await bomService.deleteBOMItem(bomId);
    
    res.json({
      success: true,
      message: 'BOM item deleted successfully'
    });
    
  } catch (error) {
    logger.error({ error, bomId: req.params.bomId }, 'API: Error deleting BOM item');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete BOM item'
    });
  }
}

/**
 * Link a cut part BOM item to a blank spec
 * POST /api/bom/link-cut-part
 * Body: { bomId, blankSpecId }
 */
export async function linkCutPartToBlankSpec(req, res) {
  try {
    const { bomId, blankSpecId } = req.body;
    
    if (!bomId || !blankSpecId) {
      return res.status(400).json({
        success: false,
        error: 'BOM ID and Blank Spec ID are required'
      });
    }
    
    logger.info({ bomId, blankSpecId }, 'API: Linking cut part to blank spec');
    
    const result = await bomService.linkCutPartToBlankSpec(bomId, blankSpecId);
    
    res.json({
      success: true,
      data: result,
      message: 'Cut part linked to blank spec successfully'
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error linking cut part');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to link cut part to blank spec'
    });
  }
}

/**
 * Get BOM explosion history/audit log
 * GET /api/bom/explosion-log/:productId
 */
export async function getBOMExplosionLog(req, res) {
  try {
    const { productId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    logger.info({ productId, limit, offset }, 'API: Fetching BOM explosion log');
    
    const query = `
      SELECT * FROM bom_explosion_log
      WHERE product_id = $1
      ORDER BY exploded_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [productId, limit, offset]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    logger.error({ error, productId: req.params.productId }, 'API: Error fetching explosion log');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch explosion log'
    });
  }
}

export default {
  explodeBOM,
  getProductionRecipe,
  createOrUpdateBOMItem,
  deleteBOMItem,
  linkCutPartToBlankSpec,
  getBOMExplosionLog
};

