// Circular layout generator for sheet optimization visualization

export interface CircularLayout {
  method: string;
  circles: Array<{
    x: number;
    y: number;
    diameter: number;
    id: string;
  }>;
  totalCircles: number;
  efficiency: number;
  sheetWidth: number;
  sheetHeight: number;
}

export interface CircularLayouts {
  squareGrid: CircularLayout;
  hexagonal: CircularLayout;
  smart: CircularLayout;
}

/**
 * Generate square grid layout for circular blanks
 */
export function generateSquareGridLayout(
  sheetWidth: number,
  sheetHeight: number,
  diameter: number
): CircularLayout {
  const circles: Array<{ x: number; y: number; diameter: number; id: string }> = [];
  
  const cols = Math.floor(sheetWidth / diameter);
  const rows = Math.floor(sheetHeight / diameter);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * diameter + diameter / 2;
      const y = row * diameter + diameter / 2;
      
      if (x + diameter / 2 <= sheetWidth && y + diameter / 2 <= sheetHeight) {
        circles.push({
          x,
          y,
          diameter,
          id: `square-grid-circle-${row}-${col}`
        });
      }
    }
  }
  
  const totalCircleArea = circles.length * Math.PI * (diameter / 2) ** 2;
  const sheetArea = sheetWidth * sheetHeight;
  const efficiency = (totalCircleArea / sheetArea) * 100;
  
  return {
    method: 'Square Grid',
    circles,
    totalCircles: circles.length,
    efficiency: Math.round(efficiency * 100) / 100,
    sheetWidth,
    sheetHeight
  };
}

/**
 * Generate hexagonal/staggered layout for circular blanks
 */
export function generateHexagonalLayout(
  sheetWidth: number,
  sheetHeight: number,
  diameter: number
): CircularLayout {
  const circles: Array<{ x: number; y: number; diameter: number; id: string }> = [];
  
  const rowSpacing = diameter * Math.sqrt(3) / 2;
  const colSpacing = diameter;
  
  const maxRows = Math.floor(sheetHeight / rowSpacing) + 1;
  
  for (let row = 0; row < maxRows; row++) {
    const y = row * rowSpacing + diameter / 2;
    if (y + diameter / 2 > sheetHeight) break;
    
    const isEvenRow = row % 2 === 0;
    const startX = isEvenRow ? diameter / 2 : diameter;
    const maxCols = Math.floor((sheetWidth - startX) / colSpacing) + 1;
    
    for (let col = 0; col < maxCols; col++) {
      const x = startX + col * colSpacing;
      
      if (x + diameter / 2 <= sheetWidth) {
        circles.push({
          x,
          y,
          diameter,
          id: `hexagonal-circle-${row}-${col}`
        });
      }
    }
  }
  
  const totalCircleArea = circles.length * Math.PI * (diameter / 2) ** 2;
  const sheetArea = sheetWidth * sheetHeight;
  const efficiency = (totalCircleArea / sheetArea) * 100;
  
  return {
    method: 'Hexagonal',
    circles,
    totalCircles: circles.length,
    efficiency: Math.round(efficiency * 100) / 100,
    sheetWidth,
    sheetHeight
  };
}

/**
 * Generate smart layout (best of square grid and hexagonal)
 */
export function generateSmartCircularLayout(
  sheetWidth: number,
  sheetHeight: number,
  diameter: number
): CircularLayout {
  const squareGridLayout = generateSquareGridLayout(sheetWidth, sheetHeight, diameter);
  const hexagonalLayout = generateHexagonalLayout(sheetWidth, sheetHeight, diameter);
  
  // Choose the layout with better efficiency
  const bestLayout = squareGridLayout.efficiency > hexagonalLayout.efficiency 
    ? squareGridLayout 
    : hexagonalLayout;
  
  return {
    ...bestLayout,
    method: 'Smart',
    circles: bestLayout.circles.map((circle, index) => ({
      ...circle,
      id: `smart-circle-${index}`
    }))
  };
}

/**
 * Generate all circular layouts for comparison
 */
export function generateAllCircularLayouts(
  sheetWidth: number,
  sheetHeight: number,
  diameter: number
): CircularLayouts {
  return {
    squareGrid: generateSquareGridLayout(sheetWidth, sheetHeight, diameter),
    hexagonal: generateHexagonalLayout(sheetWidth, sheetHeight, diameter),
    smart: generateSmartCircularLayout(sheetWidth, sheetHeight, diameter)
  };
}
