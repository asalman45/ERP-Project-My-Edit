// src/controllers/sheetOptimization.controller.js
// Removed sheetSizeModel import - using hardcoded sheet sizes
import * as blankOptimizationModel from '../models/blankOptimization.model.js';
import * as blankSpecModel from '../models/blankSpec.model.js';
import * as scrapInventoryModel from '../models/scrapInventory.model.js';
import { optimizeSheetCutting, isLeftoverReusable } from '../utils/sheetOptimizationCalculator.js';
import circleOptimizationCalculator from '../utils/circleOptimizationCalculator.js';
import { logger } from '../utils/logger.js';

// Calculate optimal cutting for a blank specification
export const calculateOptimalCutting = async (req, res) => {
  try {
    const {
      blank_id,
      width_mm,
      length_mm,
      thickness_mm,
      quantity,
      compare_all_sizes = true,
      preferred_sheet_size_id,
      debug = false,
      save_result = true,
      create_scrap_entry = true
    } = req.body;

    // Validate required fields
    if (!width_mm || !length_mm || !thickness_mm || !quantity) {
      return res.status(400).json({
        error: 'width_mm, length_mm, thickness_mm, and quantity are required'
      });
    }

    logger.info({
      blank_id,
      dimensions: `${width_mm}×${length_mm}×${thickness_mm}`,
      quantity,
      compare_all_sizes
    }, 'Calculating optimal sheet cutting');

    // Use custom sheet dimensions from request or fallback to standard sizes
    const customSheetWidth = req.body.sheet_width_mm;
    const customSheetLength = req.body.sheet_length_mm;
    
    let availableSheets;
    if (customSheetWidth && customSheetLength) {
      // Use custom sheet dimensions provided by user
      availableSheets = [
        { 
          width_mm: customSheetWidth, 
          length_mm: customSheetLength, 
          material_type: 'MS', 
          thickness_mm: thickness_mm || 2.0 
        }
      ];
    } else {
      // Fallback to standard sheet sizes
      availableSheets = [
        { width_mm: 1220, length_mm: 2440, material_type: 'MS', thickness_mm: 2.0 },
        { width_mm: 1220, length_mm: 3660, material_type: 'MS', thickness_mm: 2.0 },
        { width_mm: 1525, length_mm: 3050, material_type: 'MS', thickness_mm: 2.0 },
        { width_mm: 1220, length_mm: 2440, material_type: 'SS', thickness_mm: 2.0 },
        { width_mm: 1220, length_mm: 3660, material_type: 'SS', thickness_mm: 2.0 },
        { width_mm: 1220, length_mm: 2440, material_type: 'GI', thickness_mm: 2.0 }
      ];
    }

    // Prepare blank spec for optimization
    const blankSpec = {
      width_mm,
      length_mm,
      thickness_mm,
      quantity
    };

    // Run optimization
    const optimizationResult = optimizeSheetCutting(blankSpec, availableSheets, {
      debug,
      compareAllSizes: compare_all_sizes,
      preferredSheetSize: preferred_sheet_size_id
    });

    // Save optimization result if requested and blank_id provided
    let savedOptimization = null;
    if (save_result && blank_id) {
      savedOptimization = await blankOptimizationModel.create({
        blank_id,
        sheet_size_id: optimizationResult.bestSheetSizeId,
        blank_width_mm: width_mm,
        blank_length_mm: length_mm,
        blank_thickness_mm: thickness_mm,
        blank_quantity: quantity,
        weight_of_blank_kg: optimizationResult.weightOfBlank,
        total_blank_weight_kg: optimizationResult.totalBlankWeight,
        best_direction: optimizationResult.bestDirection,
        sheet_width_mm: optimizationResult.bestSheetWidth,
        sheet_length_mm: optimizationResult.bestSheetLength,
        primary_blanks_per_sheet: optimizationResult.primaryBlanksPerSheet,
        extra_blanks_from_leftover: optimizationResult.extraBlanksFromLeftover,
        total_blanks_per_sheet: optimizationResult.totalBlanksPerSheet,
        total_blanks_weight_kg: optimizationResult.totalBlanksWeightPerSheet,
        efficiency_percentage: optimizationResult.efficiency,
        scrap_percentage: optimizationResult.scrap,
        utilization_percentage: optimizationResult.utilization,
        leftover_area_mm2: optimizationResult.leftoverArea,
        leftover_width_mm: optimizationResult.leftoverWidth,
        leftover_length_mm: optimizationResult.leftoverLength,
        leftover_reusable: isLeftoverReusable(optimizationResult.leftoverWidth, optimizationResult.leftoverLength),
        horizontal_result: optimizationResult.horizontalResult,
        vertical_result: optimizationResult.verticalResult,
        all_sheet_comparisons: optimizationResult.allSheetComparisons,
        optimization_mode: 'MANUAL',
        calculated_by: req.body.calculated_by || 'system'
      });

      logger.info({
        optimization_id: savedOptimization.optimization_id,
        blank_id
      }, 'Optimization result saved');
    }

    // Create scrap entry for leftover if requested and reusable
    if (create_scrap_entry && blank_id && isLeftoverReusable(optimizationResult.leftoverWidth, optimizationResult.leftoverLength)) {
      try {
        // Get blank spec to link material
        const blankSpec = await blankSpecModel.findById(blank_id);
        
        if (blankSpec) {
          await scrapInventoryModel.create({
            blank_id,
            material_id: null, // Will be determined from sheet material
            width_mm: optimizationResult.leftoverWidth,
            length_mm: optimizationResult.leftoverLength,
            thickness_mm: thickness_mm,
            weight_kg: 0, // To be calculated based on leftover area
            location_id: null,
            status: 'POTENTIAL',
            reference: `Optimization leftover from blank ${blank_id}`,
            created_by: req.body.calculated_by || 'system'
          });

          logger.info({
            blank_id,
            leftover_dimensions: `${optimizationResult.leftoverWidth}×${optimizationResult.leftoverLength}`
          }, 'Potential scrap entry created for leftover');
        }
      } catch (scrapError) {
        logger.error({ err: scrapError }, 'Failed to create scrap entry for leftover, but continuing');
      }
    }

    return res.json({
      data: optimizationResult,
      saved_optimization: savedOptimization,
      message: 'Optimization calculated successfully'
    });
  } catch (err) {
    logger.error({ err }, 'Failed to calculate optimal cutting');
    return res.status(500).json({ error: 'Failed to calculate optimal cutting. Please try again.' });
  }
};

// Get optimization result by blank ID
export const getOptimizationByBlankId = async (req, res) => {
  try {
    const { blankId } = req.params;
    const { latest = true } = req.query;

    let optimization;
    if (latest === 'true' || latest === true) {
      optimization = await blankOptimizationModel.findLatestByBlankId(blankId);
    } else {
      optimization = await blankOptimizationModel.findAllByBlankId(blankId);
    }

    if (!optimization) {
      return res.status(404).json({ error: 'No optimization found for this blank' });
    }

    return res.json({ data: optimization });
  } catch (err) {
    logger.error({ err, blank_id: req.params.blankId }, 'Failed to get optimization');
    return res.status(500).json({ error: 'Failed to retrieve optimization data. Please try again.' });
  }
};

// Get optimizations by product
export const getOptimizationsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const optimizations = await blankOptimizationModel.findByProductId(productId);
    
    return res.json({ data: optimizations });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get optimizations by product');
    return res.status(500).json({ error: 'Failed to retrieve optimization data. Please try again.' });
  }
};

// Batch optimize all blanks for a product
export const batchOptimizeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { save_results = true, create_scrap_entries = false } = req.body;

    logger.info({ product_id: productId }, 'Starting batch optimization for product');

    // Get all blank specs for the product
    const blankSpecs = await blankSpecModel.findByProductId(productId);
    
    if (!blankSpecs || blankSpecs.length === 0) {
      return res.status(404).json({ error: 'No blank specifications found for this product' });
    }

    // Use standard sheet sizes for batch optimization (since individual blanks may have different sheet sizes)
    const availableSheets = [
      { width_mm: 1220, length_mm: 2440, material_type: 'MS', thickness_mm: 2.0 },
      { width_mm: 1220, length_mm: 3660, material_type: 'MS', thickness_mm: 2.0 },
      { width_mm: 1525, length_mm: 3050, material_type: 'MS', thickness_mm: 2.0 },
      { width_mm: 1220, length_mm: 2440, material_type: 'SS', thickness_mm: 2.0 },
      { width_mm: 1220, length_mm: 3660, material_type: 'SS', thickness_mm: 2.0 },
      { width_mm: 1220, length_mm: 2440, material_type: 'GI', thickness_mm: 2.0 }
    ];

    const results = [];
    const errors = [];

    for (const blank of blankSpecs) {
      try {
        const blankSpec = {
          width_mm: blank.width_mm,
          length_mm: blank.length_mm,
          thickness_mm: blank.thickness_mm,
          quantity: blank.quantity || 1
        };

        const optimizationResult = optimizeSheetCutting(blankSpec, availableSheets, {
          debug: false,
          compareAllSizes: true
        });

        if (save_results) {
          const savedOptimization = await blankOptimizationModel.create({
            blank_id: blank.blank_id,
            sheet_size_id: optimizationResult.bestSheetSizeId,
            blank_width_mm: blank.width_mm,
            blank_length_mm: blank.length_mm,
            blank_thickness_mm: blank.thickness_mm,
            blank_quantity: blank.quantity || 1,
            weight_of_blank_kg: optimizationResult.weightOfBlank,
            total_blank_weight_kg: optimizationResult.totalBlankWeight,
            best_direction: optimizationResult.bestDirection,
            sheet_width_mm: optimizationResult.bestSheetWidth,
            sheet_length_mm: optimizationResult.bestSheetLength,
            primary_blanks_per_sheet: optimizationResult.primaryBlanksPerSheet,
            extra_blanks_from_leftover: optimizationResult.extraBlanksFromLeftover,
            total_blanks_per_sheet: optimizationResult.totalBlanksPerSheet,
            total_blanks_weight_kg: optimizationResult.totalBlanksWeightPerSheet,
            efficiency_percentage: optimizationResult.efficiency,
            scrap_percentage: optimizationResult.scrap,
            utilization_percentage: optimizationResult.utilization,
            leftover_area_mm2: optimizationResult.leftoverArea,
            leftover_width_mm: optimizationResult.leftoverWidth,
            leftover_length_mm: optimizationResult.leftoverLength,
            leftover_reusable: isLeftoverReusable(optimizationResult.leftoverWidth, optimizationResult.leftoverLength),
            horizontal_result: optimizationResult.horizontalResult,
            vertical_result: optimizationResult.verticalResult,
            all_sheet_comparisons: optimizationResult.allSheetComparisons,
            optimization_mode: 'AUTO',
            calculated_by: 'batch_optimizer'
          });

          results.push({
            blank_id: blank.blank_id,
            sub_assembly_name: blank.sub_assembly_name,
            optimization: savedOptimization,
            result: optimizationResult
          });
        } else {
          results.push({
            blank_id: blank.blank_id,
            sub_assembly_name: blank.sub_assembly_name,
            result: optimizationResult
          });
        }
      } catch (blankError) {
        logger.error({ err: blankError, blank_id: blank.blank_id }, 'Failed to optimize blank');
        errors.push({
          blank_id: blank.blank_id,
          sub_assembly_name: blank.sub_assembly_name,
          error: blankError.message
        });
      }
    }

    logger.info({
      product_id: productId,
      successful: results.length,
      failed: errors.length
    }, 'Batch optimization completed');

    return res.json({
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total_blanks: blankSpecs.length,
        successful: results.length,
        failed: errors.length
      },
      message: `Batch optimization completed: ${results.length} successful, ${errors.length} failed`
    });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to batch optimize product');
    return res.status(500).json({ error: 'Failed to batch optimize product. Please try again.' });
  }
};

// Get optimization statistics
export const getOptimizationStats = async (req, res) => {
  try {
    const filters = req.query;
    
    const stats = await blankOptimizationModel.getOptimizationStats(filters);
    
    return res.json({ data: stats });
  } catch (err) {
    logger.error({ err }, 'Failed to get optimization statistics');
    return res.status(500).json({ error: 'Failed to retrieve optimization statistics. Please try again.' });
  }
};

// =============================================================================
// CIRCLE OPTIMIZATION ENDPOINTS
// =============================================================================

// Calculate optimal cutting for circular blanks
export const calculateCircleOptimization = async (req, res) => {
  try {
    const {
      blank_id,
      diameter_mm,
      thickness_mm,
      quantity,
      sheet_width_mm,
      sheet_length_mm,
      sheet_thickness_mm,
      method = 'SMART',
      save_result = true,
      create_scrap_entry = true
    } = req.body;

    // Validate required fields
    if (!diameter_mm || !thickness_mm || !quantity) {
      return res.status(400).json({
        error: 'diameter_mm, thickness_mm, and quantity are required for circular optimization'
      });
    }

    logger.info({
      blank_id,
      diameter: diameter_mm,
      thickness: thickness_mm,
      quantity,
      method
    }, 'Calculating optimal circle cutting');

    // Prepare sheet specification
    const sheetSpec = {
      width_mm: sheet_width_mm || 1220,
      length_mm: sheet_length_mm || 2440,
      thickness_mm: sheet_thickness_mm || thickness_mm,
      material_density: 7850 // Steel density in kg/m³
    };

    // Prepare blank specification for circular optimization
    const blankSpec = {
      diameter_mm,
      thickness_mm,
      quantity
    };

    // Run circle optimization
    const optimizationResult = circleOptimizationCalculator.calculateOptimization(
      sheetSpec, 
      blankSpec, 
      method
    );

    // Calculate sheet requirements
    const sheetRequirements = circleOptimizationCalculator.calculateSheetRequirements(
      optimizationResult, 
      quantity
    );

    // Combine results
    const finalResult = {
      ...optimizationResult,
      ...sheetRequirements
    };

    // Save optimization result if requested and blank_id provided
    let savedOptimization = null;
    if (save_result && blank_id) {
      try {
        savedOptimization = await blankOptimizationModel.create({
          blank_id,
          sheet_size_id: null, // Circle optimization doesn't use sheet_size_id
          blank_width_mm: diameter_mm, // Store diameter in width field for compatibility
          blank_length_mm: diameter_mm, // Store diameter in length field for compatibility
          blank_thickness_mm: thickness_mm,
          blank_quantity: quantity,
          weight_of_blank_kg: optimizationResult.circle_weight_kg,
          total_blank_weight_kg: optimizationResult.total_circle_weight_kg,
          best_direction: optimizationResult.cutting_direction,
          sheet_width_mm: sheetSpec.width_mm,
          sheet_length_mm: sheetSpec.length_mm,
          primary_blanks_per_sheet: optimizationResult.total_circles_per_sheet,
          extra_blanks_from_leftover: 0, // Circles don't have extra blanks from leftover
          total_blanks_per_sheet: optimizationResult.total_circles_per_sheet,
          total_blanks_weight_kg: optimizationResult.total_circle_weight_kg,
          efficiency_percentage: optimizationResult.efficiency_percentage,
          scrap_percentage: optimizationResult.waste_percentage,
          utilization_percentage: optimizationResult.utilization_percentage,
          leftover_area_mm2: optimizationResult.leftover_area_mm2,
          leftover_width_mm: optimizationResult.leftover_width_mm,
          leftover_length_mm: optimizationResult.leftover_length_mm,
          leftover_reusable: optimizationResult.leftover_reusable,
          horizontal_result: optimizationResult.comparison_data?.horizontal || null,
          vertical_result: optimizationResult.comparison_data?.vertical || null,
          all_sheet_comparisons: optimizationResult.comparison_data || null,
          optimization_mode: 'CIRCLE',
          calculated_by: req.body.calculated_by || 'circle_optimizer'
        });

        logger.info({
          optimization_id: savedOptimization.optimization_id,
          blank_id
        }, 'Circle optimization result saved');
      } catch (saveError) {
        logger.error({ err: saveError }, 'Failed to save circle optimization result, but continuing');
      }
    }

    // Create scrap entry for leftover if requested and reusable
    if (create_scrap_entry && blank_id && optimizationResult.leftover_reusable) {
      try {
        // Get blank spec to link material
        const blankSpecData = await blankSpecModel.findById(blank_id);
        
        if (blankSpecData) {
          await scrapInventoryModel.create({
            blank_id,
            material_id: null, // Will be determined from sheet material
            width_mm: optimizationResult.leftover_width_mm,
            length_mm: optimizationResult.leftover_length_mm,
            thickness_mm: thickness_mm,
            weight_kg: 0, // To be calculated based on leftover area
            location_id: null,
            status: 'POTENTIAL',
            reference: `Circle optimization leftover from blank ${blank_id}`,
            created_by: req.body.calculated_by || 'circle_optimizer'
          });

          logger.info({
            blank_id,
            leftover_dimensions: `${optimizationResult.leftover_width_mm}×${optimizationResult.leftover_length_mm}`
          }, 'Potential scrap entry created for circle leftover');
        }
      } catch (scrapError) {
        logger.error({ err: scrapError }, 'Failed to create scrap entry for circle leftover, but continuing');
      }
    }

    return res.json({
      data: finalResult,
      saved_optimization: savedOptimization,
      message: 'Circle optimization calculated successfully'
    });
  } catch (err) {
    logger.error({ err }, 'Failed to calculate circle optimization');
    return res.status(500).json({ error: 'Failed to calculate circle optimization. Please try again.' });
  }
};

// Calculate sheet requirements for circular optimization
export const calculateCircleSheetRequirements = async (req, res) => {
  try {
    const { optimizationResult, requiredQuantity } = req.body;
    
    if (!optimizationResult || !requiredQuantity) {
      return res.status(400).json({
        error: 'optimizationResult and requiredQuantity are required'
      });
    }
    
    const requirements = circleOptimizationCalculator.calculateSheetRequirements(
      optimizationResult, 
      requiredQuantity
    );
    
    return res.json({
      data: requirements,
      message: 'Sheet requirements calculated successfully'
    });
  } catch (err) {
    logger.error({ err }, 'Failed to calculate circle sheet requirements');
    return res.status(500).json({ error: 'Failed to calculate sheet requirements. Please try again.' });
  }
};

// Generate cutting pattern for circular optimization
export const generateCircleCuttingPattern = async (req, res) => {
  try {
    const { optimizationResult } = req.body;
    
    if (!optimizationResult) {
      return res.status(400).json({
        error: 'optimizationResult is required'
      });
    }
    
    const pattern = circleOptimizationCalculator.generateCuttingPattern(optimizationResult);
    
    return res.json({
      data: pattern,
      message: 'Cutting pattern generated successfully'
    });
  } catch (err) {
    logger.error({ err }, 'Failed to generate circle cutting pattern');
    return res.status(500).json({ error: 'Failed to generate cutting pattern. Please try again.' });
  }
};

// Export circle optimization results
export const exportCircleOptimization = async (req, res) => {
  try {
    const { optimizationResult, format = 'JSON' } = req.body;
    
    if (!optimizationResult) {
      return res.status(400).json({
        error: 'optimizationResult is required'
      });
    }
    
    const exportedData = circleOptimizationCalculator.exportResults(optimizationResult, format);
    
    // Set appropriate content type based on format
    let contentType = 'application/json';
    let filename = 'circle_optimization.json';
    
    switch (format.toUpperCase()) {
      case 'CSV':
        contentType = 'text/csv';
        filename = 'circle_optimization.csv';
        break;
      case 'XML':
        contentType = 'application/xml';
        filename = 'circle_optimization.xml';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(exportedData);
  } catch (err) {
    logger.error({ err }, 'Failed to export circle optimization');
    return res.status(500).json({ error: 'Failed to export optimization results. Please try again.' });
  }
};
