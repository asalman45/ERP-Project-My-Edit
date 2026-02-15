// src/controllers/productionMaterialConsumption.controller.js
import * as productionMaterialConsumptionModel from '../models/productionMaterialConsumption.model.js';
import * as inventoryModel from '../models/inventory.model.js';
import * as scrapInventoryModel from '../models/scrapInventory.model.js';
import * as blankSpecModel from '../models/blankSpec.model.js';
import { logger } from '../utils/logger.js';

// Create production material consumption and handle inventory deduction
export const createConsumption = async (req, res) => {
  try {
    const {
      production_order_id,
      product_id,
      blank_spec_id,
      sub_assembly_name,
      material_id,
      planned_quantity,
      consumed_quantity,
      scrap_quantity = 0,
      consumption_type = 'FRESH',
      created_by
    } = req.body;

    // Validate required fields
    if (!production_order_id || !product_id || !blank_spec_id || !consumed_quantity) {
      return res.status(400).json({ 
        error: 'production_order_id, product_id, blank_spec_id, and consumed_quantity are required' 
      });
    }

    logger.info({ 
      production_order_id, 
      product_id, 
      blank_spec_id,
      consumed_quantity,
      scrap_quantity,
      consumption_type
    }, 'Creating production material consumption');

    // Create the consumption record
    const consumption = await productionMaterialConsumptionModel.create({
      production_order_id,
      product_id,
      blank_spec_id,
      sub_assembly_name,
      material_id,
      planned_quantity,
      consumed_quantity,
      scrap_quantity,
      consumption_type,
      created_by
    });

    // Handle inventory deduction based on consumption type
    if (consumption_type === 'FRESH' || consumption_type === 'MIXED') {
      await inventoryModel.deductQuantity(material_id, consumed_quantity, 'PRODUCTION_CONSUMPTION');
      logger.info({ material_id, quantity: consumed_quantity }, 'Inventory deducted for production');
    }

    // Handle scrap generation
    if (scrap_quantity > 0) {
      // Get blank specification for scrap details
      const blankSpec = await blankSpecModel.findById(blank_spec_id);
      
      if (blankSpec) {
        await scrapInventoryModel.create({
          material_id,
          width_mm: blankSpec.width_mm,
          length_mm: blankSpec.length_mm,
          thickness_mm: blankSpec.thickness_mm,
          weight_kg: scrap_quantity,
          location_id: null, // Will be set by user
          status: 'AVAILABLE',
          reference: `Production Order: ${production_order_id}`,
          created_by: created_by || 'system'
        });
        
        logger.info({ 
          material_id, 
          scrap_quantity, 
          production_order_id 
        }, 'Scrap inventory created from production');
      }
    }

    logger.info({ 
      consumption_id: consumption.consumption_id, 
      production_order_id, 
      consumed_quantity 
    }, 'Production material consumption created successfully');

    return res.status(201).json({ data: consumption });
  } catch (err) {
    logger.error({ err }, 'Failed to create production material consumption');
    return res.status(500).json({ error: 'Failed to create production material consumption. Please try again.' });
  }
};

// Get consumption by production order
export const getConsumptionByProductionOrder = async (req, res) => {
  try {
    const { productionOrderId } = req.params;
    
    const consumptions = await productionMaterialConsumptionModel.findByProductionOrder(productionOrderId);
    
    logger.info({ 
      production_order_id: productionOrderId, 
      consumption_count: consumptions.length 
    }, 'Production consumption data retrieved');

    return res.json({ data: consumptions });
  } catch (err) {
    logger.error({ err, production_order_id: req.params.productionOrderId }, 'Failed to get production consumption');
    return res.status(500).json({ error: 'Failed to retrieve production consumption data. Please try again.' });
  }
};

// Get consumption by product
export const getConsumptionByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const consumptions = await productionMaterialConsumptionModel.findByProduct(productId);
    
    logger.info({ 
      product_id: productId, 
      consumption_count: consumptions.length 
    }, 'Product consumption data retrieved');

    return res.json({ data: consumptions });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get product consumption');
    return res.status(500).json({ error: 'Failed to retrieve product consumption data. Please try again.' });
  }
};

// Update consumption quantities
export const updateConsumption = async (req, res) => {
  try {
    const { consumptionId } = req.params;
    const {
      consumed_quantity,
      scrap_quantity,
      consumption_type,
      updated_by
    } = req.body;

    // Get current consumption record
    const currentConsumption = await productionMaterialConsumptionModel.findById(consumptionId);
    if (!currentConsumption) {
      return res.status(404).json({ error: 'Consumption record not found' });
    }

    // Update the consumption record
    const updatedConsumption = await productionMaterialConsumptionModel.updateConsumption(consumptionId, {
      consumed_quantity,
      scrap_quantity,
      consumption_type,
      updated_by
    });

    // Handle inventory adjustments if quantities changed
    const quantityDifference = consumed_quantity - currentConsumption.consumed_quantity;
    if (quantityDifference !== 0) {
      await inventoryModel.adjustQuantity(
        currentConsumption.material_id, 
        quantityDifference, 
        'PRODUCTION_ADJUSTMENT'
      );
    }

    logger.info({ 
      consumption_id: consumptionId, 
      old_quantity: currentConsumption.consumed_quantity,
      new_quantity: consumed_quantity 
    }, 'Production consumption updated');

    return res.json({ data: updatedConsumption });
  } catch (err) {
    logger.error({ err, consumption_id: req.params.consumptionId }, 'Failed to update production consumption');
    return res.status(500).json({ error: 'Failed to update production consumption. Please try again.' });
  }
};

// Get consumption summary
export const getConsumptionSummary = async (req, res) => {
  try {
    const filters = req.query;
    
    const summary = await productionMaterialConsumptionModel.getConsumptionSummary(filters);
    
    logger.info({ 
      filters, 
      summary_count: summary.length 
    }, 'Consumption summary retrieved');

    return res.json({ data: summary });
  } catch (err) {
    logger.error({ err, filters: req.query }, 'Failed to get consumption summary');
    return res.status(500).json({ error: 'Failed to retrieve consumption summary. Please try again.' });
  }
};

// Process BOM for production order
export const processBOMForProduction = async (req, res) => {
  try {
    const { productionOrderId, productId } = req.params;
    
    // Get all blank specifications for the product
    const blankSpecs = await blankSpecModel.findByProductId(productId);
    
    if (!blankSpecs || blankSpecs.length === 0) {
      return res.status(404).json({ error: 'No BOM data found for this product' });
    }

    const consumptionRecords = [];

    // Create consumption records for each blank specification
    for (const spec of blankSpecs) {
      const consumption = await productionMaterialConsumptionModel.create({
        production_order_id: productionOrderId,
        product_id: productId,
        blank_spec_id: spec.blank_id,
        sub_assembly_name: spec.sub_assembly_name,
        material_id: null, // Will be determined by material planning
        planned_quantity: spec.quantity,
        consumed_quantity: 0, // Will be updated during production
        scrap_quantity: 0,
        consumption_type: 'PLANNED',
        created_by: 'system'
      });
      
      consumptionRecords.push(consumption);
    }

    logger.info({ 
      production_order_id: productionOrderId,
      product_id: productId,
      records_created: consumptionRecords.length
    }, 'BOM processed for production order');

    return res.status(201).json({ 
      data: consumptionRecords,
      message: `BOM processed for production order. ${consumptionRecords.length} consumption records created.`
    });
  } catch (err) {
    logger.error({ err, production_order_id: req.params.productionOrderId, product_id: req.params.productId }, 'Failed to process BOM for production');
    return res.status(500).json({ error: 'Failed to process BOM for production. Please try again.' });
  }
};

