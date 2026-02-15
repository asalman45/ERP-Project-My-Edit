// src/utils/sheetOptimizationCalculator.js
/**
 * Sheet Optimization Calculator
 * 
 * Enhanced BOM calculation logic with leftover utilization analysis
 * for both vertical and horizontal sheet cutting directions.
 * 
 * This module calculates the optimal cutting direction and sheet size
 * to maximize blank production while minimizing scrap.
 */

import { logger } from './logger.js';

// Material density constant for steel (kg/m³)
const STEEL_DENSITY = 7850;
const DENSITY_TO_KG_PER_MM3 = 0.00000785; // For steel: 7850 kg/m³ = 0.00000785 kg/mm³

/**
 * Calculate weight of a single blank
 * Formula: width × length × thickness × 0.00000785
 */
function calculateBlankWeight(widthMm, lengthMm, thicknessMm, density = STEEL_DENSITY) {
  const volumeMm3 = widthMm * lengthMm * thicknessMm;
  const densityPerMm3 = density / 1000000000; // Convert kg/m³ to kg/mm³
  return volumeMm3 * densityPerMm3;
}

/**
 * Calculate primary blanks in a given direction (no leftover reuse)
 */
function calculatePrimaryBlanks(sheetWidth, sheetLength, blankWidth, blankLength, direction) {
  if (direction === 'HORIZONTAL') {
    const blanksAcross = Math.floor(sheetWidth / blankWidth);
    const blanksAlong = Math.floor(sheetLength / blankLength);
    return {
      blanksAcross,
      blanksAlong,
      totalBlanks: blanksAcross * blanksAlong,
      usedWidth: blanksAcross * blankWidth,
      usedLength: blanksAlong * blankLength
    };
  } else { // VERTICAL
    const blanksAcross = Math.floor(sheetWidth / blankLength);
    const blanksAlong = Math.floor(sheetLength / blankWidth);
    return {
      blanksAcross,
      blanksAlong,
      totalBlanks: blanksAcross * blanksAlong,
      usedWidth: blanksAcross * blankLength,
      usedLength: blanksAlong * blankWidth
    };
  }
}

/**
 * Calculate leftover dimensions after primary cutting
 */
function calculateLeftoverDimensions(sheetWidth, sheetLength, usedWidth, usedLength) {
  return {
    leftoverWidth: sheetWidth - usedWidth,
    leftoverLength: sheetLength - usedLength,
    leftoverArea: (sheetWidth * sheetLength) - (usedWidth * usedLength)
  };
}

/**
 * Calculate extra blanks that can be obtained from leftover strips
 * This is the key optimization feature!
 */
function calculateExtraBlanksFromLeftover(
  sheetWidth,
  sheetLength,
  blankWidth,
  blankLength,
  leftoverWidth,
  leftoverLength,
  usedWidth,
  usedLength,
  direction
) {
  let extraBlanks = 0;
  const leftoverDetails = [];

  if (direction === 'HORIZONTAL') {
    // Check leftover width strip (vertical strip on the right)
    if (leftoverWidth >= blankWidth) {
      const blanksFromWidthStrip = Math.floor(leftoverWidth / blankWidth) * Math.floor(sheetLength / blankLength);
      if (blanksFromWidthStrip > 0) {
        extraBlanks += blanksFromWidthStrip;
        leftoverDetails.push({
          type: 'width_strip',
          width: leftoverWidth,
          length: sheetLength,
          blanks: blanksFromWidthStrip,
          orientation: 'same_as_primary'
        });
      }
    }

    // Check leftover length strip (horizontal strip at the bottom)
    if (leftoverLength >= blankLength) {
      const blanksFromLengthStrip = Math.floor(sheetWidth / blankWidth) * Math.floor(leftoverLength / blankLength);
      if (blanksFromLengthStrip > 0) {
        extraBlanks += blanksFromLengthStrip;
        leftoverDetails.push({
          type: 'length_strip',
          width: sheetWidth,
          length: leftoverLength,
          blanks: blanksFromLengthStrip,
          orientation: 'same_as_primary'
        });
      }
    }

    // Check corner leftover (rotated cutting might work)
    if (leftoverWidth >= blankLength && leftoverLength >= blankWidth) {
      const blanksFromCorner = Math.floor(leftoverWidth / blankLength) * Math.floor(leftoverLength / blankWidth);
      if (blanksFromCorner > 0) {
        extraBlanks += blanksFromCorner;
        leftoverDetails.push({
          type: 'corner',
          width: leftoverWidth,
          length: leftoverLength,
          blanks: blanksFromCorner,
          orientation: 'rotated_90deg'
        });
      }
    }
  } else { // VERTICAL
    // Similar logic but with rotated dimensions
    if (leftoverWidth >= blankLength) {
      const blanksFromWidthStrip = Math.floor(leftoverWidth / blankLength) * Math.floor(sheetLength / blankWidth);
      if (blanksFromWidthStrip > 0) {
        extraBlanks += blanksFromWidthStrip;
        leftoverDetails.push({
          type: 'width_strip',
          width: leftoverWidth,
          length: sheetLength,
          blanks: blanksFromWidthStrip,
          orientation: 'same_as_primary'
        });
      }
    }

    if (leftoverLength >= blankWidth) {
      const blanksFromLengthStrip = Math.floor(sheetWidth / blankLength) * Math.floor(leftoverLength / blankWidth);
      if (blanksFromLengthStrip > 0) {
        extraBlanks += blanksFromLengthStrip;
        leftoverDetails.push({
          type: 'length_strip',
          width: sheetWidth,
          length: leftoverLength,
          blanks: blanksFromLengthStrip,
          orientation: 'same_as_primary'
        });
      }
    }

    // Check corner leftover (rotated cutting)
    if (leftoverWidth >= blankWidth && leftoverLength >= blankLength) {
      const blanksFromCorner = Math.floor(leftoverWidth / blankWidth) * Math.floor(leftoverLength / blankLength);
      if (blanksFromCorner > 0) {
        extraBlanks += blanksFromCorner;
        leftoverDetails.push({
          type: 'corner',
          width: leftoverWidth,
          length: leftoverLength,
          blanks: blanksFromCorner,
          orientation: 'rotated_90deg'
        });
      }
    }
  }

  return {
    extraBlanks,
    leftoverDetails
  };
}

/**
 * Calculate cutting efficiency and scrap percentage
 */
function calculateEfficiency(totalBlanks, blankWidth, blankLength, sheetWidth, sheetLength) {
  const usedArea = totalBlanks * blankWidth * blankLength;
  const totalSheetArea = sheetWidth * sheetLength;
  const efficiency = (usedArea / totalSheetArea) * 100;
  const scrap = 100 - efficiency;

  return {
    usedArea,
    totalSheetArea,
    leftoverArea: totalSheetArea - usedArea,
    efficiency,
    scrap,
    utilization: efficiency
  };
}

/**
 * Calculate optimization for a single direction on a single sheet
 */
function calculateDirectionOptimization(sheetWidth, sheetLength, blankWidth, blankLength, direction, debug = false) {
  // Step 1: Calculate primary blanks
  const primary = calculatePrimaryBlanks(sheetWidth, sheetLength, blankWidth, blankLength, direction);
  
  // Step 2: Calculate leftover dimensions
  const leftover = calculateLeftoverDimensions(
    sheetWidth,
    sheetLength,
    primary.usedWidth,
    primary.usedLength
  );

  // Step 3: Calculate extra blanks from leftover
  const extra = calculateExtraBlanksFromLeftover(
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    leftover.leftoverWidth,
    leftover.leftoverLength,
    primary.usedWidth,
    primary.usedLength,
    direction
  );

  // Step 4: Calculate total blanks
  const totalBlanks = primary.totalBlanks + extra.extraBlanks;

  // Step 5: Calculate efficiency
  const efficiency = calculateEfficiency(
    totalBlanks,
    blankWidth,
    blankLength,
    sheetWidth,
    sheetLength
  );

  const result = {
    direction,
    sheetWidth,
    sheetLength,
    primaryBlanks: primary.totalBlanks,
    extraBlanksFromLeftover: extra.extraBlanks,
    totalBlanks,
    blanksAcross: primary.blanksAcross,
    blanksAlong: primary.blanksAlong,
    leftoverWidth: leftover.leftoverWidth,
    leftoverLength: leftover.leftoverLength,
    leftoverArea: efficiency.leftoverArea,
    leftoverDetails: extra.leftoverDetails,
    efficiency: efficiency.efficiency,
    scrap: efficiency.scrap,
    utilization: efficiency.utilization,
    usedArea: efficiency.usedArea,
    totalSheetArea: efficiency.totalSheetArea
  };

  if (debug) {
    logger.info({
      direction,
      sheet: `${sheetWidth}×${sheetLength}`,
      primary_blanks: primary.totalBlanks,
      extra_blanks: extra.extraBlanks,
      total_blanks: totalBlanks,
      efficiency: `${efficiency.efficiency.toFixed(2)}%`,
      scrap: `${efficiency.scrap.toFixed(2)}%`
    }, '[TEST] Direction calculation result');
  }

  return result;
}

/**
 * Main optimization function
 * Analyzes all sheet sizes in both directions and returns the best option
 */
export function optimizeSheetCutting(blankSpec, availableSheets, options = {}) {
  const {
    debug = false,
    preferredSheetSize = null,
    compareAllSizes = true,
    density = STEEL_DENSITY
  } = options;

  const {
    width_mm: blankWidth,
    length_mm: blankLength,
    thickness_mm: blankThickness,
    quantity: blankQuantity
  } = blankSpec;

  // Validate inputs
  if (!blankWidth || !blankLength || !blankThickness) {
    throw new Error('Invalid blank specifications: width, length, and thickness are required');
  }

  if (!availableSheets || availableSheets.length === 0) {
    throw new Error('No sheet sizes available for optimization');
  }

  // Calculate blank weight
  const weightOfBlank = calculateBlankWeight(blankWidth, blankLength, blankThickness, density);
  const totalBlankWeight = weightOfBlank * blankQuantity;

  if (debug) {
    logger.info({
      blank_dimensions: `${blankWidth}×${blankLength}×${blankThickness}`,
      weight_of_blank: `${weightOfBlank.toFixed(3)} kg`,
      quantity: blankQuantity,
      total_blank_weight: `${totalBlankWeight.toFixed(2)} kg`
    }, '[TEST] Starting optimization');
  }

  const allResults = [];

  // Filter sheets if preferred size is specified
  const sheetsToAnalyze = compareAllSizes 
    ? availableSheets.filter(sheet => sheet.active !== false)
    : availableSheets.filter(sheet => 
        sheet.sheet_size_id === preferredSheetSize || 
        (sheet.width_mm === preferredSheetSize?.width && sheet.length_mm === preferredSheetSize?.length)
      );

  // Calculate for each sheet size in both directions
  for (const sheet of sheetsToAnalyze) {
    const sheetWidth = sheet.width_mm;
    const sheetLength = sheet.length_mm;

    // Skip if blank is larger than sheet in both dimensions
    if ((blankWidth > sheetWidth && blankLength > sheetLength) ||
        (blankLength > sheetWidth && blankWidth > sheetLength)) {
      if (debug) {
        logger.warn({
          sheet: `${sheetWidth}×${sheetLength}`,
          blank: `${blankWidth}×${blankLength}`
        }, '[TEST] Blank too large for this sheet, skipping');
      }
      continue;
    }

    // Calculate horizontal cutting
    const horizontal = calculateDirectionOptimization(
      sheetWidth,
      sheetLength,
      blankWidth,
      blankLength,
      'HORIZONTAL',
      debug
    );
    horizontal.sheet_size_id = sheet.sheet_size_id;
    horizontal.material_type = sheet.material_type;
    horizontal.sheet_cost_per_kg = sheet.cost_per_kg;

    // Calculate vertical cutting
    const vertical = calculateDirectionOptimization(
      sheetWidth,
      sheetLength,
      blankWidth,
      blankLength,
      'VERTICAL',
      debug
    );
    vertical.sheet_size_id = sheet.sheet_size_id;
    vertical.material_type = sheet.material_type;
    vertical.sheet_cost_per_kg = sheet.cost_per_kg;

    // Store both results
    allResults.push(horizontal);
    allResults.push(vertical);
  }

  // Find the best result (maximum total blanks)
  if (allResults.length === 0) {
    throw new Error('No valid cutting configurations found');
  }

  allResults.sort((a, b) => {
    // Primary: Most blanks
    if (b.totalBlanks !== a.totalBlanks) {
      return b.totalBlanks - a.totalBlanks;
    }
    // Secondary: Highest efficiency
    if (b.efficiency !== a.efficiency) {
      return b.efficiency - a.efficiency;
    }
    // Tertiary: Least leftover area
    return a.leftoverArea - b.leftoverArea;
  });

  const bestResult = allResults[0];

  // Calculate total blanks weight
  const totalBlanksWeightPerSheet = weightOfBlank * bestResult.totalBlanks;

  // Calculate number of sheets needed
  const sheetsNeeded = Math.ceil(blankQuantity / bestResult.totalBlanks);

  const optimizationResult = {
    // Input parameters
    blankWidth,
    blankLength,
    blankThickness,
    blankQuantity,

    // Weight calculations
    weightOfBlank,
    totalBlankWeight,

    // Best result
    bestDirection: bestResult.direction,
    bestSheetWidth: bestResult.sheetWidth,
    bestSheetLength: bestResult.sheetLength,
    bestSheetSizeId: bestResult.sheet_size_id,
    materialType: bestResult.material_type,

    // Blanks calculation
    primaryBlanksPerSheet: bestResult.primaryBlanks,
    extraBlanksFromLeftover: bestResult.extraBlanksFromLeftover,
    totalBlanksPerSheet: bestResult.totalBlanks,
    totalBlanksWeightPerSheet,

    // Efficiency metrics
    efficiency: bestResult.efficiency,
    scrap: bestResult.scrap,
    utilization: bestResult.utilization,

    // Leftover details
    leftoverArea: bestResult.leftoverArea,
    leftoverWidth: bestResult.leftoverWidth,
    leftoverLength: bestResult.leftoverLength,
    leftoverDetails: bestResult.leftoverDetails,

    // Production planning
    sheetsNeeded,
    totalWeight: totalBlanksWeightPerSheet * sheetsNeeded,

    // Comparison data
    allSheetComparisons: allResults,
    horizontalResult: allResults.find(r => 
      r.sheetWidth === bestResult.sheetWidth && 
      r.sheetLength === bestResult.sheetLength && 
      r.direction === 'HORIZONTAL'
    ),
    verticalResult: allResults.find(r => 
      r.sheetWidth === bestResult.sheetWidth && 
      r.sheetLength === bestResult.sheetLength && 
      r.direction === 'VERTICAL'
    )
  };

  if (debug) {
    logger.info({
      best_sheet: `${bestResult.sheetWidth}×${bestResult.sheetLength}`,
      best_direction: bestResult.direction,
      total_blanks_with_leftover: bestResult.totalBlanks,
      primary_blanks: bestResult.primaryBlanks,
      extra_blanks: bestResult.extraBlanksFromLeftover,
      efficiency: `${bestResult.efficiency.toFixed(2)}%`,
      scrap: `${bestResult.scrap.toFixed(2)}%`,
      leftover_area: `${bestResult.leftoverArea.toFixed(2)} mm²`,
      sheets_needed: sheetsNeeded
    }, '[TEST] Best Sheet Optimization Result');
  }

  return optimizationResult;
}

/**
 * Helper function to determine if leftover is reusable
 * Based on minimum dimensions threshold
 */
export function isLeftoverReusable(leftoverWidth, leftoverLength, minDimension = 100) {
  return leftoverWidth >= minDimension && leftoverLength >= minDimension;
}

/**
 * Calculate cost savings from optimization
 */
export function calculateCostSavings(optimizedResult, currentResult) {
  if (!currentResult) return null;

  const scrapReduction = currentResult.scrap - optimizedResult.scrap;
  const extraBlanksGained = optimizedResult.totalBlanksPerSheet - currentResult.totalBlanksPerSheet;
  const sheetsReduction = currentResult.sheetsNeeded - optimizedResult.sheetsNeeded;

  return {
    scrapReduction: scrapReduction.toFixed(2),
    scrapReductionPercentage: ((scrapReduction / currentResult.scrap) * 100).toFixed(2),
    extraBlanksGained,
    sheetsReduction,
    efficiencyGain: (optimizedResult.efficiency - currentResult.efficiency).toFixed(2)
  };
}

/**
 * Generate sheet layout visualization data
 * Returns positioned rectangles for SVG rendering
 * 
 * @param {Object} params - Layout parameters
 * @param {number} params.sheetWidth - Sheet width in mm
 * @param {number} params.sheetLength - Sheet length in mm
 * @param {number} params.blankWidth - Blank width in mm
 * @param {number} params.blankLength - Blank length in mm
 * @param {string} params.direction - 'HORIZONTAL' or 'VERTICAL'
 * @param {Object} params.optimization - Optimization result (optional, for extra details)
 * @returns {Object} Layout data with positioned blanks and leftover areas
 */
export function generateSheetLayout(params) {
  const {
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    direction,
    optimization = null
  } = params;

  // Validate inputs
  if (!sheetWidth || !sheetLength || !blankWidth || !blankLength || !direction) {
    throw new Error('Invalid parameters for sheet layout generation');
  }

  // Calculate optimization for this specific configuration
  const directionResult = calculateDirectionOptimization(
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    direction,
    false
  );

  const blanks = [];
  const leftoverAreas = [];
  const extraBlanks = [];

  // Determine actual blank dimensions based on direction
  const actualBlankWidth = direction === 'HORIZONTAL' ? blankWidth : blankLength;
  const actualBlankLength = direction === 'HORIZONTAL' ? blankLength : blankWidth;

  // Position primary blanks in a grid
  const blanksAcross = directionResult.blanksAcross;
  const blanksAlong = directionResult.blanksAlong;

  let blankIndex = 0;
  
  // Generate primary blank positions
  for (let row = 0; row < blanksAlong; row++) {
    for (let col = 0; col < blanksAcross; col++) {
      blanks.push({
        x: col * actualBlankWidth,
        y: row * actualBlankLength,
        width: actualBlankWidth,
        height: actualBlankLength,
        index: blankIndex++,
        isPrimary: true,
        rotation: direction === 'HORIZONTAL' ? 0 : 90
      });
    }
  }

  // Calculate used dimensions
  const usedWidth = blanksAcross * actualBlankWidth;
  const usedLength = blanksAlong * actualBlankLength;
  const leftoverWidth = sheetWidth - usedWidth;
  const leftoverLength = sheetLength - usedLength;

  // Add leftover areas
  // Right strip (leftover width)
  if (leftoverWidth > 0) {
    leftoverAreas.push({
      x: usedWidth,
      y: 0,
      width: leftoverWidth,
      height: sheetLength,
      type: 'width_strip',
      orientation: 'vertical'
    });
  }

  // Bottom strip (leftover length)
  if (leftoverLength > 0) {
    leftoverAreas.push({
      x: 0,
      y: usedLength,
      width: usedWidth, // Only covers the used width area
      height: leftoverLength,
      type: 'length_strip',
      orientation: 'horizontal'
    });
  }

  // Corner area (intersection of leftover strips)
  if (leftoverWidth > 0 && leftoverLength > 0) {
    leftoverAreas.push({
      x: usedWidth,
      y: usedLength,
      width: leftoverWidth,
      height: leftoverLength,
      type: 'corner',
      orientation: 'both'
    });
  }

  // Calculate extra blanks from leftover (if specified in optimization result)
  if (directionResult.leftoverDetails && directionResult.leftoverDetails.length > 0) {
    directionResult.leftoverDetails.forEach((leftoverDetail, idx) => {
      const leftoverBlanks = leftoverDetail.blanks || 0;
      
      if (leftoverDetail.type === 'width_strip' && leftoverWidth >= actualBlankWidth) {
        // Position extra blanks in the right strip
        const blanksInStrip = Math.floor(leftoverWidth / actualBlankWidth);
        const blanksVertical = Math.floor(sheetLength / actualBlankLength);
        
        for (let row = 0; row < blanksVertical && blankIndex < directionResult.totalBlanks; row++) {
          for (let col = 0; col < blanksInStrip && blankIndex < directionResult.totalBlanks; col++) {
            extraBlanks.push({
              x: usedWidth + (col * actualBlankWidth),
              y: row * actualBlankLength,
              width: actualBlankWidth,
              height: actualBlankLength,
              index: blankIndex++,
              fromLeftover: true,
              leftoverType: 'width_strip',
              rotation: direction === 'HORIZONTAL' ? 0 : 90
            });
          }
        }
      } else if (leftoverDetail.type === 'length_strip' && leftoverLength >= actualBlankLength) {
        // Position extra blanks in the bottom strip
        const blanksInStrip = Math.floor(leftoverLength / actualBlankLength);
        const blanksHorizontal = Math.floor(usedWidth / actualBlankWidth);
        
        for (let row = 0; row < blanksInStrip && blankIndex < directionResult.totalBlanks; row++) {
          for (let col = 0; col < blanksHorizontal && blankIndex < directionResult.totalBlanks; col++) {
            extraBlanks.push({
              x: col * actualBlankWidth,
              y: usedLength + (row * actualBlankLength),
              width: actualBlankWidth,
              height: actualBlankLength,
              index: blankIndex++,
              fromLeftover: true,
              leftoverType: 'length_strip',
              rotation: direction === 'HORIZONTAL' ? 0 : 90
            });
          }
        }
      } else if (leftoverDetail.type === 'corner') {
        // Position extra blanks in the corner (might be rotated)
        const isRotated = leftoverDetail.orientation === 'rotated_90deg';
        const cornerBlankWidth = isRotated ? actualBlankLength : actualBlankWidth;
        const cornerBlankHeight = isRotated ? actualBlankWidth : actualBlankLength;
        
        const blanksAcrossCorner = Math.floor(leftoverWidth / cornerBlankWidth);
        const blanksAlongCorner = Math.floor(leftoverLength / cornerBlankHeight);
        
        for (let row = 0; row < blanksAlongCorner && blankIndex < directionResult.totalBlanks; row++) {
          for (let col = 0; col < blanksAcrossCorner && blankIndex < directionResult.totalBlanks; col++) {
            extraBlanks.push({
              x: usedWidth + (col * cornerBlankWidth),
              y: usedLength + (row * cornerBlankHeight),
              width: cornerBlankWidth,
              height: cornerBlankHeight,
              index: blankIndex++,
              fromLeftover: true,
              leftoverType: 'corner',
              rotation: isRotated ? (direction === 'HORIZONTAL' ? 90 : 0) : (direction === 'HORIZONTAL' ? 0 : 90)
            });
          }
        }
      }
    });
  }

  return {
    direction,
    sheetDimensions: {
      width: sheetWidth,
      height: sheetLength
    },
    blankDimensions: {
      width: blankWidth,
      height: blankLength,
      actualWidth: actualBlankWidth,
      actualHeight: actualBlankLength
    },
    blanks,
    leftoverAreas,
    extraBlanks,
    stats: {
      totalBlanks: directionResult.totalBlanks,
      primaryBlanks: directionResult.primaryBlanks,
      extraBlanks: directionResult.extraBlanksFromLeftover,
      blanksAcross,
      blanksAlong,
      efficiency: directionResult.efficiency,
      scrapPercentage: directionResult.scrap,
      usedArea: directionResult.usedArea,
      leftoverArea: directionResult.leftoverArea,
      totalSheetArea: directionResult.totalSheetArea,
      leftoverWidth,
      leftoverLength
    }
  };
}

/**
 * Calculate Smart Mixed Cutting Layout
 * This advanced algorithm combines horizontal/vertical primary cutting with
 * intelligent rotation of blanks in leftover areas to maximize material usage
 * 
 * @param {number} sheetWidth - Sheet width in mm
 * @param {number} sheetLength - Sheet length in mm
 * @param {number} blankWidth - Blank width in mm
 * @param {number} blankLength - Blank length in mm
 * @returns {Object} Smart layout with mixed orientations
 */
export function calculateSmartLayout(sheetWidth, sheetLength, blankWidth, blankLength) {
  // Step 1: Calculate both standard directions
  const horizontal = calculateDirectionOptimization(
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    'HORIZONTAL',
    false
  );

  const vertical = calculateDirectionOptimization(
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    'VERTICAL',
    false
  );

  // Step 2: Choose the better primary direction as base
  const primaryLayout = horizontal.totalBlanks >= vertical.totalBlanks ? horizontal : vertical;
  const primaryDirection = primaryLayout.direction;

  // Step 3: Calculate primary blank dimensions based on direction
  const primaryBlankWidth = primaryDirection === 'HORIZONTAL' ? blankWidth : blankLength;
  const primaryBlankLength = primaryDirection === 'HORIZONTAL' ? blankLength : blankWidth;

  // Step 4: Calculate used dimensions and leftover
  const usedWidth = primaryLayout.blanksAcross * primaryBlankWidth;
  const usedLength = primaryLayout.blanksAlong * primaryBlankLength;
  const leftoverWidth = sheetWidth - usedWidth;
  const leftoverLength = sheetLength - usedLength;

  // Step 5: Smart leftover optimization with rotation
  const smartLeftover = calculateSmartLeftoverBlanks(
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    usedWidth,
    usedLength,
    leftoverWidth,
    leftoverLength,
    primaryDirection
  );

  // Step 6: Combine results
  const totalBlanks = primaryLayout.primaryBlanks + smartLeftover.totalExtraBlanks;
  const usedArea = totalBlanks * blankWidth * blankLength;
  const totalSheetArea = sheetWidth * sheetLength;
  const efficiency = (usedArea / totalSheetArea) * 100;
  const scrap = 100 - efficiency;

  return {
    mode: 'SMART_MIXED',
    primaryDirection,
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,

    // Primary cutting
    primaryBlanks: primaryLayout.primaryBlanks,
    primaryBlanksAcross: primaryLayout.blanksAcross,
    primaryBlanksAlong: primaryLayout.blanksAlong,
    primaryBlankWidth,
    primaryBlankLength,

    // Leftover zones
    leftoverWidth,
    leftoverLength,
    usedWidth,
    usedLength,

    // Smart leftover blanks
    extraBlanks: smartLeftover.totalExtraBlanks,
    extraBlanksDetails: smartLeftover.details,
    
    // Breakdown by orientation
    sameOrientationBlanks: smartLeftover.sameOrientationBlanks,
    rotatedBlanks: smartLeftover.rotatedBlanks,

    // Totals
    totalBlanks,
    efficiency,
    scrap,
    usedArea,
    leftoverArea: totalSheetArea - usedArea,
    totalSheetArea,

    // Comparison
    vsHorizontal: {
      blanks: horizontal.totalBlanks,
      efficiency: horizontal.efficiency,
      gain: totalBlanks - horizontal.totalBlanks
    },
    vsVertical: {
      blanks: vertical.totalBlanks,
      efficiency: vertical.efficiency,
      gain: totalBlanks - vertical.totalBlanks
    },
    
    // Layout data for visualization
    layoutData: {
      primaryBlanks: generatePrimaryBlankPositions(
        primaryLayout.blanksAcross,
        primaryLayout.blanksAlong,
        primaryBlankWidth,
        primaryBlankLength
      ),
      extraBlanks: smartLeftover.blankPositions
    }
  };
}

/**
 * Calculate smart leftover blanks with rotation support
 * Tries both same orientation and 90° rotated blanks in leftover areas
 */
function calculateSmartLeftoverBlanks(
  sheetWidth,
  sheetLength,
  blankWidth,
  blankLength,
  usedWidth,
  usedLength,
  leftoverWidth,
  leftoverLength,
  primaryDirection
) {
  const details = [];
  const blankPositions = [];
  let totalExtraBlanks = 0;
  let sameOrientationBlanks = 0;
  let rotatedBlanks = 0;
  let blankIndex = 0;

  // Determine primary blank dimensions
  const primaryW = primaryDirection === 'HORIZONTAL' ? blankWidth : blankLength;
  const primaryL = primaryDirection === 'HORIZONTAL' ? blankLength : blankWidth;
  
  // Rotated dimensions (90° rotation)
  const rotatedW = primaryL;
  const rotatedL = primaryW;

  // ═══════════════════════════════════════════════════════════
  // ZONE 1: Right Strip (Vertical strip on the right side)
  // ═══════════════════════════════════════════════════════════
  if (leftoverWidth > 0 && sheetLength > 0) {
    // Try same orientation first
    const sameOrientFit = {
      across: Math.floor(leftoverWidth / primaryW),
      along: Math.floor(sheetLength / primaryL),
      blanks: 0
    };
    sameOrientFit.blanks = sameOrientFit.across * sameOrientFit.along;

    // Try rotated orientation (90°)
    const rotatedFit = {
      across: Math.floor(leftoverWidth / rotatedW),
      along: Math.floor(sheetLength / rotatedL),
      blanks: 0
    };
    rotatedFit.blanks = rotatedFit.across * rotatedFit.along;

    // Choose the better option for right strip
    if (sameOrientFit.blanks >= rotatedFit.blanks && sameOrientFit.blanks > 0) {
      totalExtraBlanks += sameOrientFit.blanks;
      sameOrientationBlanks += sameOrientFit.blanks;
      
      details.push({
        zone: 'right_strip',
        orientation: 'same',
        width: leftoverWidth,
        height: sheetLength,
        blanks: sameOrientFit.blanks,
        blanksAcross: sameOrientFit.across,
        blanksAlong: sameOrientFit.along,
        blankWidth: primaryW,
        blankHeight: primaryL
      });

      // Generate positions
      for (let row = 0; row < sameOrientFit.along; row++) {
        for (let col = 0; col < sameOrientFit.across; col++) {
          blankPositions.push({
            x: usedWidth + (col * primaryW),
            y: row * primaryL,
            width: primaryW,
            height: primaryL,
            index: blankIndex++,
            zone: 'right_strip',
            rotated: false
          });
        }
      }
    } else if (rotatedFit.blanks > 0) {
      totalExtraBlanks += rotatedFit.blanks;
      rotatedBlanks += rotatedFit.blanks;
      
      details.push({
        zone: 'right_strip',
        orientation: 'rotated_90',
        width: leftoverWidth,
        height: sheetLength,
        blanks: rotatedFit.blanks,
        blanksAcross: rotatedFit.across,
        blanksAlong: rotatedFit.along,
        blankWidth: rotatedW,
        blankHeight: rotatedL
      });

      // Generate positions
      for (let row = 0; row < rotatedFit.along; row++) {
        for (let col = 0; col < rotatedFit.across; col++) {
          blankPositions.push({
            x: usedWidth + (col * rotatedW),
            y: row * rotatedL,
            width: rotatedW,
            height: rotatedL,
            index: blankIndex++,
            zone: 'right_strip',
            rotated: true
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ZONE 2: Bottom Strip (Horizontal strip at the bottom)
  // ═══════════════════════════════════════════════════════════
  if (leftoverLength > 0 && usedWidth > 0) {
    // Try same orientation
    const sameOrientFit = {
      across: Math.floor(usedWidth / primaryW),
      along: Math.floor(leftoverLength / primaryL),
      blanks: 0
    };
    sameOrientFit.blanks = sameOrientFit.across * sameOrientFit.along;

    // Try rotated orientation
    const rotatedFit = {
      across: Math.floor(usedWidth / rotatedW),
      along: Math.floor(leftoverLength / rotatedL),
      blanks: 0
    };
    rotatedFit.blanks = rotatedFit.across * rotatedFit.along;

    // Choose the better option for bottom strip
    if (sameOrientFit.blanks >= rotatedFit.blanks && sameOrientFit.blanks > 0) {
      totalExtraBlanks += sameOrientFit.blanks;
      sameOrientationBlanks += sameOrientFit.blanks;
      
      details.push({
        zone: 'bottom_strip',
        orientation: 'same',
        width: usedWidth,
        height: leftoverLength,
        blanks: sameOrientFit.blanks,
        blanksAcross: sameOrientFit.across,
        blanksAlong: sameOrientFit.along,
        blankWidth: primaryW,
        blankHeight: primaryL
      });

      // Generate positions
      for (let row = 0; row < sameOrientFit.along; row++) {
        for (let col = 0; col < sameOrientFit.across; col++) {
          blankPositions.push({
            x: col * primaryW,
            y: usedLength + (row * primaryL),
            width: primaryW,
            height: primaryL,
            index: blankIndex++,
            zone: 'bottom_strip',
            rotated: false
          });
        }
      }
    } else if (rotatedFit.blanks > 0) {
      totalExtraBlanks += rotatedFit.blanks;
      rotatedBlanks += rotatedFit.blanks;
      
      details.push({
        zone: 'bottom_strip',
        orientation: 'rotated_90',
        width: usedWidth,
        height: leftoverLength,
        blanks: rotatedFit.blanks,
        blanksAcross: rotatedFit.across,
        blanksAlong: rotatedFit.along,
        blankWidth: rotatedW,
        blankHeight: rotatedL
      });

      // Generate positions
      for (let row = 0; row < rotatedFit.along; row++) {
        for (let col = 0; col < rotatedFit.across; col++) {
          blankPositions.push({
            x: col * rotatedW,
            y: usedLength + (row * rotatedL),
            width: rotatedW,
            height: rotatedL,
            index: blankIndex++,
            zone: 'bottom_strip',
            rotated: true
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ZONE 3: Corner (Bottom-right corner area)
  // ═══════════════════════════════════════════════════════════
  if (leftoverWidth > 0 && leftoverLength > 0) {
    // Try same orientation
    const sameOrientFit = {
      across: Math.floor(leftoverWidth / primaryW),
      along: Math.floor(leftoverLength / primaryL),
      blanks: 0
    };
    sameOrientFit.blanks = sameOrientFit.across * sameOrientFit.along;

    // Try rotated orientation
    const rotatedFit = {
      across: Math.floor(leftoverWidth / rotatedW),
      along: Math.floor(leftoverLength / rotatedL),
      blanks: 0
    };
    rotatedFit.blanks = rotatedFit.across * rotatedFit.along;

    // Choose the better option for corner
    if (sameOrientFit.blanks >= rotatedFit.blanks && sameOrientFit.blanks > 0) {
      totalExtraBlanks += sameOrientFit.blanks;
      sameOrientationBlanks += sameOrientFit.blanks;
      
      details.push({
        zone: 'corner',
        orientation: 'same',
        width: leftoverWidth,
        height: leftoverLength,
        blanks: sameOrientFit.blanks,
        blanksAcross: sameOrientFit.across,
        blanksAlong: sameOrientFit.along,
        blankWidth: primaryW,
        blankHeight: primaryL
      });

      // Generate positions
      for (let row = 0; row < sameOrientFit.along; row++) {
        for (let col = 0; col < sameOrientFit.across; col++) {
          blankPositions.push({
            x: usedWidth + (col * primaryW),
            y: usedLength + (row * primaryL),
            width: primaryW,
            height: primaryL,
            index: blankIndex++,
            zone: 'corner',
            rotated: false
          });
        }
      }
    } else if (rotatedFit.blanks > 0) {
      totalExtraBlanks += rotatedFit.blanks;
      rotatedBlanks += rotatedFit.blanks;
      
      details.push({
        zone: 'corner',
        orientation: 'rotated_90',
        width: leftoverWidth,
        height: leftoverLength,
        blanks: rotatedFit.blanks,
        blanksAcross: rotatedFit.across,
        blanksAlong: rotatedFit.along,
        blankWidth: rotatedW,
        blankHeight: rotatedL
      });

      // Generate positions
      for (let row = 0; row < rotatedFit.along; row++) {
        for (let col = 0; col < rotatedFit.across; col++) {
          blankPositions.push({
            x: usedWidth + (col * rotatedW),
            y: usedLength + (row * rotatedL),
            width: rotatedW,
            height: rotatedL,
            index: blankIndex++,
            zone: 'corner',
            rotated: true
          });
        }
      }
    }
  }

  return {
    totalExtraBlanks,
    sameOrientationBlanks,
    rotatedBlanks,
    details,
    blankPositions
  };
}

/**
 * Generate primary blank positions for visualization
 */
function generatePrimaryBlankPositions(blanksAcross, blanksAlong, blankWidth, blankHeight) {
  const positions = [];
  let index = 0;
  
  for (let row = 0; row < blanksAlong; row++) {
    for (let col = 0; col < blanksAcross; col++) {
      positions.push({
        x: col * blankWidth,
        y: row * blankHeight,
        width: blankWidth,
        height: blankHeight,
        index: index++,
        zone: 'primary',
        rotated: false
      });
    }
  }
  
  return positions;
}

export default {
  optimizeSheetCutting,
  isLeftoverReusable,
  calculateCostSavings,
  calculateBlankWeight,
  generateSheetLayout,
  calculateSmartLayout
};
