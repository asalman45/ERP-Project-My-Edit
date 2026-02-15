// src/controllers/scrapManagement.controller.js
import * as scrapInventoryModel from '../models/scrapInventory.model.js';
import * as productionMaterialConsumptionModel from '../models/productionMaterialConsumption.model.js';
import * as inventoryModel from '../models/inventory.model.js';
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

// Restore scrap to inventory
export const restoreScrapToInventory = async (req, res) => {
  try {
    const { scrapId } = req.params;
    const {
      quantity_to_restore,
      reason,
      restored_by,
      material_id
    } = req.body;

    // Validate required fields
    if (!quantity_to_restore || !reason || !material_id) {
      return res.status(400).json({ 
        error: 'quantity_to_restore, reason, and material_id are required' 
      });
    }

    if (quantity_to_restore <= 0) {
      return res.status(400).json({ 
        error: 'quantity_to_restore must be greater than 0' 
      });
    }

    logger.info({ 
      scrap_id: scrapId, 
      quantity_to_restore, 
      reason,
      material_id
    }, 'Restoring scrap to inventory');

    const result = await scrapInventoryModel.restoreToInventory(scrapId, {
      quantity_to_restore,
      reason,
      restored_by: restored_by || 'system',
      material_id
    });

    logger.info({ 
      scrap_id: scrapId, 
      restored_quantity: result.restored_quantity,
      leftover_material_name: result.leftover_material_name,
      location_code: result.location_code,
      uom: result.uom
    }, 'Scrap successfully restored to inventory');

    return res.json({ 
      data: result,
      message: `Successfully restored ${result.restored_quantity} kg (${result.restored_quantity_grams} grams) to inventory as ${result.leftover_material_name} at ${result.location_code}`
    });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to restore scrap to inventory');
    return res.status(500).json({ error: err.message || 'Failed to restore scrap to inventory. Please try again.' });
  }
};

// Reuse scrap in production
export const reuseScrapInProduction = async (req, res) => {
  try {
    const { scrapId } = req.params;
    const {
      production_order_id,
      product_id,
      quantity_to_reuse,
      reason,
      reused_by
    } = req.body;

    // Validate required fields
    if (!production_order_id || !product_id || !quantity_to_reuse || !reason) {
      return res.status(400).json({ 
        error: 'production_order_id, product_id, quantity_to_reuse, and reason are required' 
      });
    }

    if (quantity_to_reuse <= 0) {
      return res.status(400).json({ 
        error: 'quantity_to_reuse must be greater than 0' 
      });
    }

    logger.info({ 
      scrap_id: scrapId, 
      production_order_id, 
      product_id,
      quantity_to_reuse, 
      reason 
    }, 'Reusing scrap in production');

    const result = await scrapInventoryModel.reuseInProduction(scrapId, {
      production_order_id,
      product_id,
      quantity_to_reuse,
      reason,
      reused_by: reused_by || 'system'
    });

    logger.info({ 
      scrap_id: scrapId, 
      production_order_id,
      reused_quantity: result.reused_quantity 
    }, 'Scrap successfully reused in production');

    return res.json({ 
      data: result,
      message: `Successfully reused ${result.reused_quantity} kg in production order ${production_order_id}`
    });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to reuse scrap in production');
    return res.status(500).json({ error: 'Failed to reuse scrap in production. Please try again.' });
  }
};

// Get scrap movement history
export const getScrapMovementHistory = async (req, res) => {
  try {
    const { scrapId } = req.params;
    
    const movementHistory = await scrapInventoryModel.getScrapMovementHistory(scrapId);
    
    logger.info({ 
      scrap_id: scrapId, 
      movement_count: movementHistory.length 
    }, 'Scrap movement history retrieved');

    return res.json({ data: movementHistory });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to get scrap movement history');
    return res.status(500).json({ error: 'Failed to retrieve scrap movement history. Please try again.' });
  }
};

// Get scrap management dashboard data
export const getScrapManagementDashboard = async (req, res) => {
  try {
    // Get available scrap items
    const availableScrap = await scrapInventoryModel.findAll({ status: 'AVAILABLE' });
    
    // Get scrap by material summary
    const scrapSummary = {};
    availableScrap.forEach(scrap => {
      const materialKey = scrap.material_id || 'unknown';
      if (!scrapSummary[materialKey]) {
        scrapSummary[materialKey] = {
          material_id: scrap.material_id,
          material_name: scrap.material_name || 'Unknown Material',
          material_code: scrap.material_code || 'N/A',
          total_quantity: 0,
          total_value: 0,
          items: []
        };
      }
      
      scrapSummary[materialKey].total_quantity += scrap.weight_kg || 0;
      scrapSummary[materialKey].total_value += (scrap.weight_kg || 0) * (scrap.salvage_value_per_kg || 0);
      scrapSummary[materialKey].items.push(scrap);
    });

    // Get recent scrap movements
    const recentMovements = await scrapInventoryModel.findRecentMovements(10);

    // Get scrap utilization stats
    const utilizationStats = await scrapInventoryModel.getUtilizationStats();

    const dashboardData = {
      available_scrap: availableScrap,
      scrap_summary: Object.values(scrapSummary),
      recent_movements: recentMovements,
      utilization_stats: utilizationStats,
      totals: {
        total_items: availableScrap.length,
        total_weight: availableScrap.reduce((sum, scrap) => sum + (scrap.weight_kg || 0), 0),
        total_value: availableScrap.reduce((sum, scrap) => sum + ((scrap.weight_kg || 0) * (scrap.salvage_value_per_kg || 0)), 0)
      }
    };

    logger.info({ 
      total_scrap_items: availableScrap.length,
      total_weight: dashboardData.totals.total_weight
    }, 'Scrap management dashboard data retrieved');

    return res.json({ data: dashboardData });
  } catch (err) {
    logger.error({ err }, 'Failed to get scrap management dashboard');
    return res.status(500).json({ error: 'Failed to retrieve scrap management dashboard. Please try again.' });
  }
};

// Get scrap inventory summary
export const getScrapSummary = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_items,
        COUNT(CASE WHEN status = 'CONSUMED' THEN 1 END) as consumed_items,
        COUNT(CASE WHEN status = 'RESTORED' THEN 1 END) as restored_items,
        COALESCE(SUM(weight_kg), 0) as total_weight,
        COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN weight_kg ELSE 0 END), 0) as available_weight,
        COALESCE(AVG(CASE WHEN efficiency_percentage IS NOT NULL THEN efficiency_percentage END), 0) as avg_efficiency,
        COALESCE(AVG(CASE WHEN scrap_percentage IS NOT NULL THEN scrap_percentage END), 0) as avg_scrap_percentage
      FROM scrap_inventory
    `;
    
    const result = await db.query(query);
    const summary = result.rows[0];

    // Convert string counts to numbers
    summary.total_items = parseInt(summary.total_items) || 0;
    summary.available_items = parseInt(summary.available_items) || 0;
    summary.consumed_items = parseInt(summary.consumed_items) || 0;
    summary.restored_items = parseInt(summary.restored_items) || 0;
    summary.total_weight = parseFloat(summary.total_weight) || 0;
    summary.available_weight = parseFloat(summary.available_weight) || 0;
    summary.avg_efficiency = parseFloat(summary.avg_efficiency) || 0;
    summary.avg_scrap_percentage = parseFloat(summary.avg_scrap_percentage) || 0;

    logger.info({ summary }, 'Scrap inventory summary retrieved');

    return res.json(summary);
  } catch (err) {
    logger.error({ err }, 'Failed to get scrap summary');
    return res.status(500).json({ error: 'Failed to retrieve scrap summary. Please try again.' });
  }
};

// Get scrap recommendations for production
export const getScrapRecommendations = async (req, res) => {
  try {
    const { productId, productionOrderId } = req.query;
    
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Get BOM requirements for the product
    const bomRequirements = await productionMaterialConsumptionModel.findByProduct(productId);
    
    // Get available scrap that could potentially be used
    const availableScrap = await scrapInventoryModel.findAll({ 
      status: 'AVAILABLE',
      min_width: 0, // Could be optimized based on BOM requirements
      min_length: 0
    });

    // Create recommendations based on material compatibility
    const recommendations = [];
    
    availableScrap.forEach(scrap => {
      bomRequirements.forEach(requirement => {
        if (scrap.material_id === requirement.material_id) {
          // Check if scrap dimensions could be used for this requirement
          const couldBeUsed = (
            scrap.width_mm >= requirement.width_mm &&
            scrap.length_mm >= requirement.length_mm &&
            scrap.thickness_mm >= requirement.thickness_mm
          );

          if (couldBeUsed) {
            recommendations.push({
              scrap_id: scrap.scrap_id,
              scrap_reference: scrap.reference,
              material_name: scrap.material_name,
              available_quantity: scrap.weight_kg,
              scrap_dimensions: {
                width: scrap.width_mm,
                length: scrap.length_mm,
                thickness: scrap.thickness_mm
              },
              bom_requirement: {
                sub_assembly: requirement.sub_assembly_name,
                required_dimensions: {
                  width: requirement.width_mm,
                  length: requirement.length_mm,
                  thickness: requirement.thickness_mm
                },
                planned_quantity: requirement.planned_quantity
              },
              potential_savings: scrap.weight_kg * (scrap.salvage_value_per_kg || 0),
              recommendation_score: calculateReuseScore(scrap, requirement)
            });
          }
        }
      });
    });

    // Sort by recommendation score
    recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);

    logger.info({ 
      product_id: productId, 
      recommendations_count: recommendations.length 
    }, 'Scrap reuse recommendations generated');

    return res.json({ data: recommendations });
  } catch (err) {
    logger.error({ err, product_id: req.query.productId }, 'Failed to get scrap recommendations');
    return res.status(500).json({ error: 'Failed to generate scrap recommendations. Please try again.' });
  }
};

// Helper function to calculate reuse score
function calculateReuseScore(scrap, requirement) {
  let score = 0;
  
  // Size compatibility (0-40 points)
  const sizeRatio = Math.min(
    scrap.width_mm / requirement.width_mm,
    scrap.length_mm / requirement.length_mm,
    scrap.thickness_mm / requirement.thickness_mm
  );
  score += Math.min(sizeRatio * 40, 40);
  
  // Quantity match (0-30 points)
  const quantityRatio = Math.min(scrap.weight_kg / requirement.planned_quantity, 1);
  score += quantityRatio * 30;
  
  // Material value (0-20 points)
  score += Math.min((scrap.salvage_value_per_kg || 0) / 10, 20);
  
  // Age factor (0-10 points) - newer scrap is better
  const daysSinceCreated = (Date.now() - new Date(scrap.created_at).getTime()) / (1000 * 60 * 60 * 24);
  score += Math.max(10 - (daysSinceCreated / 30), 0);
  
  return Math.round(score);
}

// New: Get reuse opportunities for a scrap piece
export const getReuseOpportunities = async (req, res) => {
  try {
    const { scrapId } = req.params;

    logger.info({ scrap_id: scrapId }, 'Finding reuse opportunities for scrap');

    const opportunities = await scrapInventoryModel.findReuseOpportunities(scrapId);

    if (!opportunities || opportunities.length === 0) {
      return res.json({
        data: [],
        message: 'No reuse opportunities found for this scrap'
      });
    }

    logger.info({ 
      scrap_id: scrapId, 
      opportunities_count: opportunities.length 
    }, 'Reuse opportunities found');

    return res.json({ 
      data: opportunities,
      count: opportunities.length
    });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to find reuse opportunities');
    return res.status(500).json({ 
      error: 'Failed to find reuse opportunities. Please try again.' 
    });
  }
};

// New: Get scrap origin details
export const getScrapOrigin = async (req, res) => {
  try {
    const { scrapId } = req.params;

    const query = `
      SELECT 
        so.*,
        p.product_code,
        p.part_name,
        bs.sub_assembly_name
      FROM scrap_origin so
      LEFT JOIN product p ON so.product_id = p.product_id
      LEFT JOIN blank_spec bs ON so.blank_id = bs.blank_id
      WHERE so.scrap_id = $1
    `;

    const result = await db.query(query, [scrapId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scrap origin not found' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to get scrap origin');
    return res.status(500).json({ 
      error: 'Failed to retrieve scrap origin. Please try again.' 
    });
  }
};

// New: Get scrap transaction log
export const getScrapTransactionLog = async (req, res) => {
  try {
    const { scrapId } = req.params;

    const query = `
      SELECT *
      FROM scrap_transaction_log
      WHERE scrap_id = $1
      ORDER BY performed_at DESC
    `;

    const result = await db.query(query, [scrapId]);

    return res.json({ 
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    logger.error({ err, scrap_id: req.params.scrapId }, 'Failed to get transaction log');
    return res.status(500).json({ 
      error: 'Failed to retrieve transaction log. Please try again.' 
    });
  }
};

