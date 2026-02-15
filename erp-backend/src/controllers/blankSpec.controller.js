// src/controllers/blankSpec.controller.js
import * as blankSpecModel from '../models/blankSpec.model.js';
import * as materialConsumptionModel from '../models/materialConsumption.model.js';
import * as scrapInventoryModel from '../models/scrapInventory.model.js';
import * as productModel from '../models/product.model.js';
import { logger } from '../utils/logger.js';
import scrapCalculator from '../utils/scrapCalculator.js';
import db from '../utils/db.js';

export const getBlankSpecs = async (req, res) => {
  try {
    const { productId } = req.params;
    const { subAssemblyName } = req.query;

    let blankSpecs;
    if (subAssemblyName) {
      blankSpecs = await blankSpecModel.findByProductIdAndSubAssembly(productId, subAssemblyName);
    } else {
      blankSpecs = await blankSpecModel.findByProductId(productId);
    }

    logger.info({ product_id: productId, sub_assembly: subAssemblyName }, 'Blank specifications retrieved');
    return res.json({ data: blankSpecs });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get blank specifications');
    return res.status(500).json({ error: 'Failed to retrieve blank specifications. Please try again.' });
  }
};

export const getBlankSpec = async (req, res) => {
  try {
    const { blankId } = req.params;
    const blankSpec = await blankSpecModel.findById(blankId);

    if (!blankSpec) {
      return res.status(404).json({ error: 'Blank specification not found' });
    }

    logger.info({ blank_id: blankId }, 'Blank specification retrieved');
    return res.json({ data: blankSpec });
  } catch (err) {
    logger.error({ err, blank_id: req.params.blankId }, 'Failed to get blank specification');
    return res.status(500).json({ error: 'Failed to retrieve blank specification. Please try again.' });
  }
};

export const createBlankSpec = async (req, res) => {
  try {
    const {
      product_id,
      sub_assembly_name,
      width_mm,
      length_mm,
      thickness_mm,
      quantity = 1,
      blank_weight_kg,
      pcs_per_sheet,
      sheet_util_pct,
      sheet_type,
      sheet_weight_kg,
      total_blanks,
      consumption_pct,
      material_density,
      created_by
    } = req.body;

    // Validate required fields
    if (!product_id || !width_mm || !length_mm || !thickness_mm) {
      return res.status(400).json({ 
        error: 'product_id, width_mm, length_mm, and thickness_mm are required' 
      });
    }

    // Validate numeric fields
    if (isNaN(width_mm) || isNaN(length_mm) || isNaN(thickness_mm)) {
      return res.status(400).json({ 
        error: 'width_mm, length_mm, and thickness_mm must be valid numbers' 
      });
    }

    logger.info({ 
      product_id, 
      sub_assembly_name,
      payload: req.body 
    }, 'Creating blank specification');

    // Calculate blank weight if not provided but density is available
    let calculatedWeight = blank_weight_kg;
    if (!calculatedWeight && material_density) {
      const volume_m3 = (width_mm * length_mm * thickness_mm) / (1000 * 1000 * 1000); // Convert mm³ to m³
      calculatedWeight = volume_m3 * material_density;
    }

    try {
      const blankSpec = await blankSpecModel.create({
        product_id,
        sub_assembly_name,
        width_mm,
        length_mm,
        thickness_mm,
        quantity,
        blank_weight_kg: calculatedWeight || blank_weight_kg,
        pcs_per_sheet,
        sheet_util_pct,
        sheet_type,
        sheet_weight_kg,
        total_blanks,
        consumption_pct,
        material_density,
        created_by
      });

      logger.info({ 
        blank_id: blankSpec.blank_id, 
        product_id, 
        sub_assembly_name,
        dimensions: `${width_mm}x${length_mm}x${thickness_mm}`
      }, 'Blank specification created');

      // ✅ REMOVED: Auto-create scrap entry logic
      // Scrap will now be calculated only when material is issued and cutting work order is completed

      return res.status(201).json({ data: blankSpec });
    } catch (dbError) {
      logger.error({ 
        dbError, 
        product_id, 
        sub_assembly_name,
        payload: req.body 
      }, 'Database error creating blank specification');
      
      return res.status(500).json({ 
        error: 'Failed to create blank specification. Please check the data and try again.',
        details: dbError.message 
      });
    }
  } catch (err) {
    logger.error({ err, product_id: req.body.product_id }, 'Failed to create blank specification');
    return res.status(500).json({ error: 'Failed to create blank specification. Please try again.' });
  }
};

export const updateBlankSpec = async (req, res) => {
  try {
    const { blankId } = req.params;
    const updateData = req.body;

    const blankSpec = await blankSpecModel.update(blankId, updateData);
    if (!blankSpec) {
      return res.status(404).json({ error: 'Blank specification not found' });
    }

    logger.info({ blank_id: blankId }, 'Blank specification updated');
    return res.json({ data: blankSpec });
  } catch (err) {
    logger.error({ err, blank_id: req.params.blankId }, 'Failed to update blank specification');
    return res.status(500).json({ error: 'Failed to update blank specification. Please try again.' });
  }
};

export const deleteBlankSpec = async (req, res) => {
  try {
    const { blankId } = req.params;
    await blankSpecModel.remove(blankId);

    logger.info({ blank_id: blankId }, 'Blank specification deleted');
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, blank_id: req.params.blankId }, 'Failed to delete blank specification');
    return res.status(500).json({ error: 'Failed to delete blank specification. Please try again.' });
  }
};

export const calculateSheetUtilization = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sheetType = '4x8' } = req.body;

    const utilizationResults = await blankSpecModel.calculateSheetUtilization(productId, sheetType);

    if (utilizationResults.length === 0) {
      return res.status(404).json({ error: 'No blank specifications found for this product' });
    }

    // Calculate summary statistics
    const summary = {
      total_sub_assemblies: utilizationResults.length,
      average_utilization: utilizationResults.reduce((sum, r) => sum + r.utilization_percent, 0) / utilizationResults.length,
      total_blanks: utilizationResults.reduce((sum, r) => sum + r.total_blanks, 0),
      sheet_type: sheetType,
      sheet_dimensions: utilizationResults[0]?.sheet_dimensions
    };

    logger.info({ product_id: productId, sheet_type: sheetType }, 'Sheet utilization calculated');
    return res.json({ 
      data: {
        product_id: productId,
        sheet_type: sheetType,
        utilization_results: utilizationResults,
        summary
      }
    });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to calculate sheet utilization');
    return res.status(500).json({ error: 'Failed to calculate sheet utilization. Please try again.' });
  }
};

export const optimizeCuttingPattern = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sheetType = '4x8', prioritizeScrap = true } = req.body;

    // Get blank specifications
    const blankSpecs = await blankSpecModel.findByProductId(productId);
    
    if (!blankSpecs || blankSpecs.length === 0) {
      return res.status(404).json({ error: 'No blank specifications found for this product' });
    }

    // Get available scrap materials
    const availableScrap = await scrapInventoryModel.findAvailableScrap();

    const optimizationResults = {
      product_id: productId,
      sheet_type: sheetType,
      cutting_patterns: [],
      scrap_usage: [],
      new_material_requirements: [],
      total_waste: 0,
      cost_savings: 0
    };

    // Analyze each blank specification
    for (const spec of blankSpecs) {
      let bestOption = null;
      let utilization = 0;

      if (prioritizeScrap) {
        // Find best matching scrap
        const matchingScrap = await scrapInventoryModel.findMatchingScrap(
          spec.width_mm, 
          spec.length_mm, 
          spec.thickness_mm
        );

        if (matchingScrap.length > 0) {
          bestOption = matchingScrap[0];
          utilization = bestOption.utilization_percent;
          
          optimizationResults.scrap_usage.push({
            blank_id: spec.blank_id,
            sub_assembly_name: spec.sub_assembly_name,
            scrap_id: bestOption.scrap_id,
            scrap_dimensions: {
              width: bestOption.width_mm,
              length: bestOption.length_mm,
              thickness: bestOption.thickness_mm
            },
            required_dimensions: {
              width: spec.width_mm,
              length: spec.length_mm,
              thickness: spec.thickness_mm
            },
            utilization: utilization,
            waste_percent: 100 - utilization
          });
        }
      }

      if (!bestOption) {
        // Need new material - calculate optimal cutting pattern
        const piecesPerSheet = Math.floor((1219 / spec.width_mm) * (2438 / spec.length_mm));
        const blankArea = spec.width_mm * spec.length_mm;
        const sheetArea = 1219 * 2438;
        const utilization = ((blankArea * piecesPerSheet) / sheetArea) * 100;

        optimizationResults.new_material_requirements.push({
          blank_id: spec.blank_id,
          sub_assembly_name: spec.sub_assembly_name,
          required_dimensions: {
            width: spec.width_mm,
            length: spec.length_mm,
            thickness: spec.thickness_mm
          },
          pieces_per_sheet: piecesPerSheet,
          utilization: utilization,
          waste_percent: 100 - utilization,
          quantity: spec.quantity
        });
      }

      optimizationResults.cutting_patterns.push({
        blank_id: spec.blank_id,
        sub_assembly_name: spec.sub_assembly_name,
        dimensions: `${spec.width_mm}x${spec.length_mm}x${spec.thickness_mm}`,
        quantity: spec.quantity,
        best_option: bestOption ? 'scrap' : 'new_material',
        utilization: utilization,
        waste_percent: 100 - utilization
      });
    }

    // Calculate total waste and potential cost savings
    optimizationResults.total_waste = optimizationResults.cutting_patterns.reduce(
      (sum, pattern) => sum + pattern.waste_percent, 0
    ) / optimizationResults.cutting_patterns.length;

    optimizationResults.cost_savings = optimizationResults.scrap_usage.length * 0.3; // Assume 30% cost savings per scrap usage

    logger.info({ 
      product_id: productId, 
      sheet_type: sheetType, 
      prioritize_scrap: prioritizeScrap 
    }, 'Cutting pattern optimized');

    return res.json({ data: optimizationResults });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to optimize cutting pattern');
    return res.status(500).json({ error: 'Failed to optimize cutting pattern. Please try again.' });
  }
};

export const generateScrapFromProduction = async (req, res) => {
  try {
    const { blankId } = req.params;
    const { 
      production_order_id, 
      waste_percent = 10, 
      location_id, 
      created_by 
    } = req.body;

    // Get the blank specification
    const blankSpec = await blankSpecModel.findById(blankId);
    if (!blankSpec) {
      return res.status(404).json({ error: 'Blank specification not found' });
    }

    // Calculate scrap dimensions (assuming rectangular waste)
    const wasteArea = (blankSpec.width_mm * blankSpec.length_mm * waste_percent) / 100;
    const scrapWidth = Math.sqrt(wasteArea * 0.5); // Assume square-ish scrap
    const scrapLength = wasteArea / scrapWidth;

    // Create scrap inventory record
    const scrapRecord = await scrapInventoryModel.create({
      blank_id: blankId,
      material_id: blankSpec.material_id,
      width_mm: Math.round(scrapWidth),
      length_mm: Math.round(scrapLength),
      thickness_mm: blankSpec.thickness_mm,
      weight_kg: blankSpec.blank_weight_kg * (waste_percent / 100),
      location_id,
      status: 'AVAILABLE',
      created_by,
      reference: `Production Order: ${production_order_id}`,
      consumed_by_po: null
    });

    logger.info({ 
      scrap_id: scrapRecord.scrap_id, 
      blank_id: blankId, 
      waste_percent,
      production_order_id 
    }, 'Scrap generated from production');

    return res.status(201).json({ data: scrapRecord });
  } catch (err) {
    logger.error({ err, blank_id: req.params.blankId }, 'Failed to generate scrap from production');
    return res.status(500).json({ error: 'Failed to generate scrap from production. Please try again.' });
  }
};
