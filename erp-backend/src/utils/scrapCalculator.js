// src/utils/scrapCalculator.js
/**
 * Enterprise-grade Scrap Calculation Utility
 * 
 * Encapsulates all scrap/leftover material calculations for consistency
 * across the ERP system. Follows manufacturing best practices.
 */

import { logger } from './logger.js';

// Material density constants (kg/m³)
const MATERIAL_DENSITIES = {
  MS: 7850,   // Mild Steel
  SS: 7850,   // Stainless Steel  
  GI: 7850,   // Galvanized Iron
  AL: 2700,   // Aluminum
  CU: 8960,   // Copper
  BR: 8500    // Brass
};

// Conversion factor: kg/m³ to kg/mm³
const DENSITY_TO_KG_PER_MM3 = 0.000000001; // 1e-9

/**
 * Calculate scrap weight and percentage from sheet cutting
 * 
 * @param {Object} sheet - Sheet dimensions {width, length, thickness, materialType}
 * @param {Object} blanks - Blank details {totalWeight, count, efficiency}
 * @param {Object} options - Optional parameters {density, debug}
 * @returns {Object} {scrapWeight, scrapPct, sheetWeight, usedWeight}
 */
export function calculateScrap(sheet, blanks, options = {}) {
  const {
    debug = false,
    density = MATERIAL_DENSITIES[sheet.materialType] || MATERIAL_DENSITIES.MS
  } = options;

  // Calculate sheet weight
  const sheetWeight = calculateSheetWeight(
    sheet.width,
    sheet.length,
    sheet.thickness,
    density
  );

  // Calculate used material weight
  const usedWeight = blanks.totalWeight || (blanks.count * blanks.weightPerBlank);

  // Calculate scrap
  const scrapWeight = Math.max(0, sheetWeight - usedWeight);
  const scrapPct = (scrapWeight / sheetWeight) * 100;

  if (debug) {
    logger.info({
      sheet_dimensions: `${sheet.width}×${sheet.length}×${sheet.thickness}`,
      sheet_weight: `${sheetWeight.toFixed(2)} kg`,
      used_weight: `${usedWeight.toFixed(2)} kg`,
      scrap_weight: `${scrapWeight.toFixed(2)} kg`,
      scrap_percentage: `${scrapPct.toFixed(1)}%`
    }, '[Scrap Calculation]');
  }

  return {
    scrapWeight: parseFloat(scrapWeight.toFixed(3)),
    scrapPct: parseFloat(scrapPct.toFixed(2)),
    sheetWeight: parseFloat(sheetWeight.toFixed(2)),
    usedWeight: parseFloat(usedWeight.toFixed(2))
  };
}

/**
 * Calculate weight of a sheet
 * 
 * @param {number} widthMm - Width in millimeters
 * @param {number} lengthMm - Length in millimeters
 * @param {number} thicknessMm - Thickness in millimeters
 * @param {number} density - Material density in kg/m³
 * @returns {number} Weight in kg
 */
export function calculateSheetWeight(widthMm, lengthMm, thicknessMm, density = MATERIAL_DENSITIES.MS) {
  // Volume in mm³
  const volumeMm3 = widthMm * lengthMm * thicknessMm;
  
  // Convert density from kg/m³ to kg/mm³
  const densityPerMm3 = density * DENSITY_TO_KG_PER_MM3;
  
  // Weight in kg
  const weight = volumeMm3 * densityPerMm3;
  
  return weight;
}

/**
 * Calculate weight of a single blank
 * 
 * @param {number} widthMm - Width in millimeters
 * @param {number} lengthMm - Length in millimeters
 * @param {number} thicknessMm - Thickness in millimeters
 * @param {number} density - Material density in kg/m³
 * @returns {number} Weight in kg
 */
export function calculateBlankWeight(widthMm, lengthMm, thicknessMm, density = MATERIAL_DENSITIES.MS) {
  return calculateSheetWeight(widthMm, lengthMm, thicknessMm, density);
}

/**
 * Calculate leftover dimensions and area
 * 
 * @param {Object} sheet - {width, length}
 * @param {Object} used - {width, length}
 * @param {string} orientation - 'H' or 'V'
 * @returns {Object} {leftoverWidth, leftoverLength, leftoverArea, orientation}
 */
export function calculateLeftoverDimensions(sheet, used, orientation = 'H') {
  let leftoverWidth, leftoverLength;

  if (orientation === 'H' || orientation === 'HORIZONTAL') {
    // Horizontal cutting
    leftoverWidth = sheet.width - used.width;
    leftoverLength = sheet.length - used.length;
  } else {
    // Vertical cutting
    leftoverWidth = sheet.width - used.length;
    leftoverLength = sheet.length - used.width;
  }

  const leftoverArea = (leftoverWidth * leftoverLength) + 
                       (leftoverWidth * used.length) +
                       (used.width * leftoverLength);

  return {
    leftoverWidth: Math.max(0, leftoverWidth),
    leftoverLength: Math.max(0, leftoverLength),
    leftoverArea: Math.max(0, leftoverArea),
    orientation: orientation === 'H' || orientation === 'HORIZONTAL' ? 'H' : 'V'
  };
}

/**
 * Calculate scrap from efficiency percentage
 * 
 * @param {number} sheetWeight - Total sheet weight in kg
 * @param {number} efficiencyPct - Material utilization efficiency (0-100)
 * @returns {Object} {scrapWeight, scrapPct}
 */
export function calculateScrapFromEfficiency(sheetWeight, efficiencyPct) {
  const scrapPct = 100 - efficiencyPct;
  const scrapWeight = sheetWeight * (scrapPct / 100);

  return {
    scrapWeight: parseFloat(scrapWeight.toFixed(3)),
    scrapPct: parseFloat(scrapPct.toFixed(2))
  };
}

/**
 * Prepare scrap data for database insertion
 * 
 * @param {Object} blankData - Blank specification data
 * @param {Object} optimizationData - Optimization results
 * @param {Object} productData - Product information
 * @returns {Object} {inventoryData, originData}
 */
export function prepareScrapData(blankData, optimizationData, productData) {
  const scrapCalculation = calculateScrapFromEfficiency(
    optimizationData.sheetWeight || blankData.sheet_weight_kg,
    optimizationData.efficiency || blankData.sheet_util_pct
  );

  // Calculate leftover dimensions - always calculate from blank data if not provided
  let leftoverDims = null;
  
  if (optimizationData.leftoverWidth && optimizationData.leftoverLength) {
    // Use provided optimization data
    leftoverDims = {
      leftoverWidth: optimizationData.leftoverWidth,
      leftoverLength: optimizationData.leftoverLength,
      leftoverArea: optimizationData.leftoverArea || 
                    (optimizationData.leftoverWidth * optimizationData.leftoverLength),
      orientation: optimizationData.bestDirection === 'HORIZONTAL' ? 'H' : 'V'
    };
  } else if (blankData.sheet_width_mm && blankData.sheet_length_mm && blankData.width_mm && blankData.length_mm) {
    // Calculate leftover dimensions from blank spec data
    const sheetWidth = blankData.sheet_width_mm;
    const sheetLength = blankData.sheet_length_mm;
    const blankWidth = blankData.width_mm;
    const blankLength = blankData.length_mm;
    
    // Calculate blanks that fit
    const blanksAcross = Math.floor(sheetWidth / blankWidth);
    const blanksAlong = Math.floor(sheetLength / blankLength);
    
    // Calculate leftover dimensions
    const leftoverWidth = sheetWidth - (blanksAcross * blankWidth);
    const leftoverLength = sheetLength - (blanksAlong * blankLength);
    
    // Only create scrap if there's actual leftover
    if (leftoverWidth > 0 || leftoverLength > 0) {
      leftoverDims = {
        leftoverWidth: leftoverWidth,
        leftoverLength: leftoverLength,
        leftoverArea: leftoverWidth * leftoverLength,
        orientation: optimizationData.bestDirection === 'HORIZONTAL' ? 'H' : 'V'
      };
    }
  }

  // Scrap inventory data
  // Only store material_name if material_id is NULL (for display fallback)
  // If material_id exists, material_name will be fetched from material table via JOIN
  const materialNameForStorage = blankData.material_id 
    ? null // Don't store name if material_id exists - will be fetched from material table
    : (blankData.material_name || `${blankData.sheet_type || 'Sheet'} Leftover - ${productData.part_name}`);
  
  const inventoryData = {
    material_name: materialNameForStorage,
    material_id: blankData.material_id || null, // Will be set by the calling function
    width_mm: leftoverDims?.leftoverWidth,
    length_mm: leftoverDims?.leftoverLength,
    thickness_mm: blankData.thickness_mm,
    weight_kg: scrapCalculation.scrapWeight,
    leftover_area_mm2: leftoverDims?.leftoverArea,
    orientation: leftoverDims?.orientation,
    sheet_original_size: `${blankData.sheet_width_mm || 1220}×${blankData.sheet_length_mm || 2440}`,
    blank_size: `${blankData.width_mm}×${blankData.length_mm}`,
    efficiency_percentage: optimizationData.efficiency || blankData.sheet_util_pct,
    scrap_percentage: scrapCalculation.scrapPct,
    unit: 'kg',
    status: 'AVAILABLE',
    blank_id: blankData.blank_id,
    reference: `BOM-${productData.product_code}`
  };

  // Scrap origin data
  const originData = {
    source_type: 'BOM',
    source_reference: productData.product_id,
    product_id: productData.product_id,
    blank_id: blankData.blank_id,
    process_step: 'Sheet Cutting',
    bom_efficiency: optimizationData.efficiency || blankData.sheet_util_pct,
    sheet_dimensions: inventoryData.sheet_original_size,
    blank_dimensions: inventoryData.blank_size,
    leftover_width: leftoverDims?.leftoverWidth,
    leftover_length: leftoverDims?.leftoverLength,
    cutting_direction: optimizationData.bestDirection || 'HORIZONTAL'
  };

  return {
    inventoryData,
    originData,
    scrapCalculation
  };
}

/**
 * Create transaction log entry
 * 
 * @param {string} scrapId - Scrap inventory ID
 * @param {string} transactionType - CREATED, REUSED, RESTORED, etc.
 * @param {number} quantityBefore - Quantity before transaction
 * @param {number} quantityAfter - Quantity after transaction
 * @param {Object} context - Additional context {reason, reference, destination}
 * @returns {Object} Transaction log entry
 */
export function createTransactionLog(scrapId, transactionType, quantityBefore, quantityAfter, context = {}) {
  return {
    scrap_id: scrapId,
    transaction_type: transactionType,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    quantity_changed: quantityAfter - quantityBefore,
    reason: context.reason,
    reference: context.reference,
    destination: context.destination,
    performed_by: context.performed_by || 'system',
    notes: context.notes
  };
}

export default {
  calculateScrap,
  calculateSheetWeight,
  calculateBlankWeight,
  calculateLeftoverDimensions,
  calculateScrapFromEfficiency,
  prepareScrapData,
  createTransactionLog,
  MATERIAL_DENSITIES
};


