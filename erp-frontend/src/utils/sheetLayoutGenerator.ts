// src/utils/sheetLayoutGenerator.ts
/**
 * Frontend utility to generate sheet layout visualization data
 * This mirrors the backend logic for client-side rendering
 */

interface BlankPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  isPrimary?: boolean;
  fromLeftover?: boolean;
  leftoverType?: string;
  rotation?: number;
}

interface LeftoverArea {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  orientation: string;
}

interface SheetLayoutData {
  direction: 'HORIZONTAL' | 'VERTICAL';
  sheetDimensions: {
    width: number;
    height: number;
  };
  blankDimensions: {
    width: number;
    height: number;
    actualWidth: number;
    actualHeight: number;
  };
  blanks: BlankPosition[];
  leftoverAreas: LeftoverArea[];
  extraBlanks: BlankPosition[];
  stats: {
    totalBlanks: number;
    primaryBlanks: number;
    extraBlanks: number;
    blanksAcross: number;
    blanksAlong: number;
    efficiency: number;
    scrapPercentage: number;
    usedArea: number;
    leftoverArea: number;
    totalSheetArea: number;
    leftoverWidth: number;
    leftoverLength: number;
  };
}

interface GenerateLayoutParams {
  sheetWidth: number;
  sheetLength: number;
  blankWidth: number;
  blankLength: number;
  direction: 'HORIZONTAL' | 'VERTICAL';
}

/**
 * Calculate primary blanks in a grid pattern
 */
function calculatePrimaryBlanks(
  sheetWidth: number,
  sheetLength: number,
  actualBlankWidth: number,
  actualBlankLength: number
) {
  const blanksAcross = Math.floor(sheetWidth / actualBlankWidth);
  const blanksAlong = Math.floor(sheetLength / actualBlankLength);
  const totalBlanks = blanksAcross * blanksAlong;
  const usedWidth = blanksAcross * actualBlankWidth;
  const usedLength = blanksAlong * actualBlankLength;

  return {
    blanksAcross,
    blanksAlong,
    totalBlanks,
    usedWidth,
    usedLength
  };
}

/**
 * Calculate extra blanks from leftover strips
 */
function calculateExtraBlanks(
  leftoverWidth: number,
  leftoverLength: number,
  actualBlankWidth: number,
  actualBlankLength: number,
  usedWidth: number,
  usedLength: number,
  sheetLength: number
): { count: number; details: any[] } {
  let extraCount = 0;
  const details: any[] = [];

  // Right strip (leftover width)
  if (leftoverWidth >= actualBlankWidth) {
    const blanksFromWidthStrip = 
      Math.floor(leftoverWidth / actualBlankWidth) * 
      Math.floor(sheetLength / actualBlankLength);
    
    if (blanksFromWidthStrip > 0) {
      extraCount += blanksFromWidthStrip;
      details.push({
        type: 'width_strip',
        width: leftoverWidth,
        length: sheetLength,
        blanks: blanksFromWidthStrip
      });
    }
  }

  // Bottom strip (leftover length)
  if (leftoverLength >= actualBlankLength) {
    const blanksFromLengthStrip = 
      Math.floor(usedWidth / actualBlankWidth) * 
      Math.floor(leftoverLength / actualBlankLength);
    
    if (blanksFromLengthStrip > 0) {
      extraCount += blanksFromLengthStrip;
      details.push({
        type: 'length_strip',
        width: usedWidth,
        length: leftoverLength,
        blanks: blanksFromLengthStrip
      });
    }
  }

  return { count: extraCount, details };
}

/**
 * Generate sheet layout visualization data
 */
export function generateSheetLayout(params: GenerateLayoutParams): SheetLayoutData {
  const { sheetWidth, sheetLength, blankWidth, blankLength, direction } = params;

  // Determine actual blank dimensions based on direction
  const actualBlankWidth = direction === 'HORIZONTAL' ? blankWidth : blankLength;
  const actualBlankLength = direction === 'HORIZONTAL' ? blankLength : blankWidth;

  // Calculate primary blanks
  const primary = calculatePrimaryBlanks(
    sheetWidth,
    sheetLength,
    actualBlankWidth,
    actualBlankLength
  );

  // Calculate leftover dimensions
  const leftoverWidth = sheetWidth - primary.usedWidth;
  const leftoverLength = sheetLength - primary.usedLength;

  // Calculate extra blanks from leftover
  const extra = calculateExtraBlanks(
    leftoverWidth,
    leftoverLength,
    actualBlankWidth,
    actualBlankLength,
    primary.usedWidth,
    primary.usedLength,
    sheetLength
  );

  const totalBlanks = primary.totalBlanks + extra.count;

  // Generate blank positions
  const blanks: BlankPosition[] = [];
  let blankIndex = 0;

  // Primary blanks grid
  for (let row = 0; row < primary.blanksAlong; row++) {
    for (let col = 0; col < primary.blanksAcross; col++) {
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

  // Generate leftover areas
  const leftoverAreas: LeftoverArea[] = [];

  if (leftoverWidth > 0) {
    leftoverAreas.push({
      x: primary.usedWidth,
      y: 0,
      width: leftoverWidth,
      height: sheetLength,
      type: 'width_strip',
      orientation: 'vertical'
    });
  }

  if (leftoverLength > 0) {
    leftoverAreas.push({
      x: 0,
      y: primary.usedLength,
      width: primary.usedWidth,
      height: leftoverLength,
      type: 'length_strip',
      orientation: 'horizontal'
    });
  }

  if (leftoverWidth > 0 && leftoverLength > 0) {
    leftoverAreas.push({
      x: primary.usedWidth,
      y: primary.usedLength,
      width: leftoverWidth,
      height: leftoverLength,
      type: 'corner',
      orientation: 'both'
    });
  }

  // Generate extra blanks positions
  const extraBlanks: BlankPosition[] = [];

  extra.details.forEach((detail) => {
    if (detail.type === 'width_strip' && leftoverWidth >= actualBlankWidth) {
      const blanksInStrip = Math.floor(leftoverWidth / actualBlankWidth);
      const blanksVertical = Math.floor(sheetLength / actualBlankLength);

      for (let row = 0; row < blanksVertical && blankIndex < totalBlanks; row++) {
        for (let col = 0; col < blanksInStrip && blankIndex < totalBlanks; col++) {
          extraBlanks.push({
            x: primary.usedWidth + (col * actualBlankWidth),
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
    } else if (detail.type === 'length_strip' && leftoverLength >= actualBlankLength) {
      const blanksInStrip = Math.floor(leftoverLength / actualBlankLength);
      const blanksHorizontal = Math.floor(primary.usedWidth / actualBlankWidth);

      for (let row = 0; row < blanksInStrip && blankIndex < totalBlanks; row++) {
        for (let col = 0; col < blanksHorizontal && blankIndex < totalBlanks; col++) {
          extraBlanks.push({
            x: col * actualBlankWidth,
            y: primary.usedLength + (row * actualBlankLength),
            width: actualBlankWidth,
            height: actualBlankLength,
            index: blankIndex++,
            fromLeftover: true,
            leftoverType: 'length_strip',
            rotation: direction === 'HORIZONTAL' ? 0 : 90
          });
        }
      }
    }
  });

  // Calculate statistics
  const usedArea = totalBlanks * blankWidth * blankLength;
  const totalSheetArea = sheetWidth * sheetLength;
  const leftoverArea = totalSheetArea - usedArea;
  const efficiency = (usedArea / totalSheetArea) * 100;
  const scrapPercentage = 100 - efficiency;

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
      totalBlanks,
      primaryBlanks: primary.totalBlanks,
      extraBlanks: extra.count,
      blanksAcross: primary.blanksAcross,
      blanksAlong: primary.blanksAlong,
      efficiency,
      scrapPercentage,
      usedArea,
      leftoverArea,
      totalSheetArea,
      leftoverWidth,
      leftoverLength
    }
  };
}

/**
 * Generate Smart Mixed Layout (simplified version for frontend)
 */
export function generateSmartLayout(
  sheetWidth: number,
  sheetLength: number,
  blankWidth: number,
  blankLength: number
): SheetLayoutData {
  // Get horizontal and vertical layouts
  const horizontal = generateSheetLayout({
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    direction: 'HORIZONTAL'
  });

  const vertical = generateSheetLayout({
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    direction: 'VERTICAL'
  });

  // Choose the better primary direction
  const primaryLayout = horizontal.stats.totalBlanks >= vertical.stats.totalBlanks ? horizontal : vertical;
  const primaryDirection = primaryLayout.direction;

  // Calculate primary blank dimensions
  const primaryBlankWidth = primaryDirection === 'HORIZONTAL' ? blankWidth : blankLength;
  const primaryBlankLength = primaryDirection === 'HORIZONTAL' ? blankLength : blankWidth;

  // Calculate used dimensions and leftover
  const usedWidth = primaryLayout.stats.blanksAcross * primaryBlankWidth;
  const usedLength = primaryLayout.stats.blanksAlong * primaryBlankLength;
  const leftoverWidth = sheetWidth - usedWidth;
  const leftoverLength = sheetLength - usedLength;

  // Generate primary blanks
  const primaryBlanks = [];
  let blankIndex = 0;

  for (let row = 0; row < primaryLayout.stats.blanksAlong; row++) {
    for (let col = 0; col < primaryLayout.stats.blanksAcross; col++) {
      primaryBlanks.push({
        x: col * primaryBlankWidth,
        y: row * primaryBlankLength,
        width: primaryBlankWidth,
        height: primaryBlankLength,
        index: blankIndex++,
        isPrimary: true,
        rotation: primaryDirection === 'HORIZONTAL' ? 0 : 90
      });
    }
  }

  // Calculate extra blanks with rotation
  const extraBlanks = [];
  const leftoverAreas = [];
  let totalExtraBlanks = 0;

  // Right strip (if leftover width > 0)
  if (leftoverWidth > 0) {
    // Try same orientation
    const sameBlanksAcross = Math.floor(leftoverWidth / primaryBlankWidth);
    const sameBlanksAlong = Math.floor(sheetLength / primaryBlankLength);
    const sameBlanks = sameBlanksAcross * sameBlanksAlong;

    // Try rotated orientation
    const rotatedBlanksAcross = Math.floor(leftoverWidth / primaryBlankLength);
    const rotatedBlanksAlong = Math.floor(sheetLength / primaryBlankWidth);
    const rotatedBlanks = rotatedBlanksAcross * rotatedBlanksAlong;

    if (sameBlanks >= rotatedBlanks && sameBlanks > 0) {
      // Use same orientation
      for (let row = 0; row < sameBlanksAlong; row++) {
        for (let col = 0; col < sameBlanksAcross; col++) {
          extraBlanks.push({
            x: usedWidth + (col * primaryBlankWidth),
            y: row * primaryBlankLength,
            width: primaryBlankWidth,
            height: primaryBlankLength,
            index: blankIndex++,
            isPrimary: false,
            fromLeftover: true,
            rotation: primaryDirection === 'HORIZONTAL' ? 0 : 90
          });
        }
      }
      totalExtraBlanks += sameBlanks;
    } else if (rotatedBlanks > 0) {
      // Use rotated orientation
      for (let row = 0; row < rotatedBlanksAlong; row++) {
        for (let col = 0; col < rotatedBlanksAcross; col++) {
          extraBlanks.push({
            x: usedWidth + (col * primaryBlankLength),
            y: row * primaryBlankWidth,
            width: primaryBlankLength,
            height: primaryBlankWidth,
            index: blankIndex++,
            isPrimary: false,
            fromLeftover: true,
            rotation: primaryDirection === 'HORIZONTAL' ? 90 : 0
          });
        }
      }
      totalExtraBlanks += rotatedBlanks;
    }

    // Add leftover area
    leftoverAreas.push({
      x: usedWidth,
      y: 0,
      width: leftoverWidth,
      height: sheetLength,
      type: 'width_strip',
      orientation: 'vertical'
    });
  }

  // Bottom strip (if leftover length > 0)
  if (leftoverLength > 0) {
    // Try same orientation
    const sameBlanksAcross = Math.floor(usedWidth / primaryBlankWidth);
    const sameBlanksAlong = Math.floor(leftoverLength / primaryBlankLength);
    const sameBlanks = sameBlanksAcross * sameBlanksAlong;

    // Try rotated orientation
    const rotatedBlanksAcross = Math.floor(usedWidth / primaryBlankLength);
    const rotatedBlanksAlong = Math.floor(leftoverLength / primaryBlankWidth);
    const rotatedBlanks = rotatedBlanksAcross * rotatedBlanksAlong;

    if (sameBlanks >= rotatedBlanks && sameBlanks > 0) {
      // Use same orientation
      for (let row = 0; row < sameBlanksAlong; row++) {
        for (let col = 0; col < sameBlanksAcross; col++) {
          extraBlanks.push({
            x: col * primaryBlankWidth,
            y: usedLength + (row * primaryBlankLength),
            width: primaryBlankWidth,
            height: primaryBlankLength,
            index: blankIndex++,
            isPrimary: false,
            fromLeftover: true,
            rotation: primaryDirection === 'HORIZONTAL' ? 0 : 90
          });
        }
      }
      totalExtraBlanks += sameBlanks;
    } else if (rotatedBlanks > 0) {
      // Use rotated orientation
      for (let row = 0; row < rotatedBlanksAlong; row++) {
        for (let col = 0; col < rotatedBlanksAcross; col++) {
          extraBlanks.push({
            x: col * primaryBlankLength,
            y: usedLength + (row * primaryBlankWidth),
            width: primaryBlankLength,
            height: primaryBlankWidth,
            index: blankIndex++,
            isPrimary: false,
            fromLeftover: true,
            rotation: primaryDirection === 'HORIZONTAL' ? 90 : 0
          });
        }
      }
      totalExtraBlanks += rotatedBlanks;
    }

    // Add leftover area
    leftoverAreas.push({
      x: 0,
      y: usedLength,
      width: usedWidth,
      height: leftoverLength,
      type: 'length_strip',
      orientation: 'horizontal'
    });
  }

  // Corner area
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

  // Calculate totals
  const totalBlanks = primaryLayout.stats.primaryBlanks + totalExtraBlanks;
  const usedArea = totalBlanks * blankWidth * blankLength;
  const totalSheetArea = sheetWidth * sheetLength;
  const efficiency = (usedArea / totalSheetArea) * 100;
  const scrap = 100 - efficiency;

  return {
    direction: 'SMART_MIXED',
    sheetDimensions: {
      width: sheetWidth,
      height: sheetLength
    },
    blankDimensions: {
      width: blankWidth,
      height: blankLength,
      actualWidth: primaryBlankWidth,
      actualHeight: primaryBlankLength
    },
    blanks: primaryBlanks,
    leftoverAreas,
    extraBlanks,
    stats: {
      totalBlanks,
      primaryBlanks: primaryLayout.stats.primaryBlanks,
      extraBlanks: totalExtraBlanks,
      blanksAcross: primaryLayout.stats.blanksAcross,
      blanksAlong: primaryLayout.stats.blanksAlong,
      efficiency,
      scrapPercentage: scrap,
      usedArea,
      leftoverArea: totalSheetArea - usedArea,
      totalSheetArea,
      leftoverWidth,
      leftoverLength
    }
  };
}

/**
 * Generate layouts for all three cutting modes
 */
export function generateAllLayouts(
  sheetWidth: number,
  sheetLength: number,
  blankWidth: number,
  blankLength: number
) {
  const horizontal = generateSheetLayout({
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    direction: 'HORIZONTAL'
  });

  const vertical = generateSheetLayout({
    sheetWidth,
    sheetLength,
    blankWidth,
    blankLength,
    direction: 'VERTICAL'
  });

  const smart = generateSmartLayout(sheetWidth, sheetLength, blankWidth, blankLength);

  // Determine which is best
  const layouts = [horizontal, vertical, smart];
  const bestLayout = layouts.reduce((best, current) => 
    current.stats.totalBlanks > best.stats.totalBlanks ? current : best
  );

  return {
    horizontal,
    vertical,
    smart,
    bestDirection: bestLayout.direction
  };
}

/**
 * Generate layouts for both directions (backward compatibility)
 */
export function generateBothLayouts(
  sheetWidth: number,
  sheetLength: number,
  blankWidth: number,
  blankLength: number
) {
  const allLayouts = generateAllLayouts(sheetWidth, sheetLength, blankWidth, blankLength);
  
  return {
    horizontal: allLayouts.horizontal,
    vertical: allLayouts.vertical,
    bestDirection: allLayouts.bestDirection
  };
}

