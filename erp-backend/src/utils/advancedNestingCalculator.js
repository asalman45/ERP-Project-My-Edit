import { MaxRectsPacker } from 'maxrects-packer';
import DxfParser from 'dxf-parser';
import { logger } from './logger.js';
import * as AnyNestModule from '@makeorbreakshop/any-nest';
const { AnyNest } = AnyNestModule;

const STEEL_DENSITY = 7850;

export class AdvancedNestingCalculator {
  
  static runRectangularNesting(parts, sheet, options = {}) {
    const spacing = options.spacing || 0;
    const allowRotation = options.rotation !== false;

    const packer = new MaxRectsPacker(sheet.width, sheet.length, spacing, {
      smart: true,
      pot: false,
      square: false,
      allowRotation: allowRotation,
      tag: false
    });

    const itemsToPack = [];
    parts.forEach(part => {
      for (let i = 0; i < part.quantity; i++) {
        itemsToPack.push({
          width: part.width,
          height: part.length,
          data: { id: part.id, partName: part.partName || `Part_${part.id}`, svgPath: part.svgPath }
        });
      }
    });

    packer.addArray(itemsToPack);

    const results = {
      sheetsNeeded: packer.bins.length,
      packedSheets: [],
      unpackedItems: packer.unpackedItems
    };

    packer.bins.forEach((bin, index) => {
      let usedArea = 0;
      const placedParts = bin.rects.map(rect => {
        usedArea += rect.width * rect.height;
        return {
          id: rect.data.id,
          partName: rect.data.partName,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          rotated: rect.rot,
          svgPath: rect.data.svgPath
        };
      });

      const sheetArea = sheet.width * sheet.length;
      const efficiency = (usedArea / sheetArea) * 100;
      const remainingArea = sheetArea - usedArea;

      results.packedSheets.push({
        sheetIndex: index + 1,
        sheetWidth: sheet.width,
        sheetLength: sheet.length,
        parts: placedParts,
        usedArea: usedArea,
        remainingArea: remainingArea,
        efficiency: efficiency,
        scrapPercentage: 100 - efficiency
      });
    });

    return results;
  }

  static async runTrueShapeNesting(parts, sheet, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const nest = new AnyNest();
        const spacing = options.spacing || 2;
        const rotations = options.rotations || 4;
        
        nest.config({
          spacing,
          rotations,
          populationSize: 10,
          mutationRate: 10,
          useHoles: false,
          exploreHoles: false
        });

        // Convert sheet into a polygon
        const binPolygon = [
          { x: 0, y: 0 },
          { x: sheet.width, y: 0 },
          { x: sheet.width, y: sheet.length },
          { x: 0, y: sheet.length }
        ];
        nest.setBin(binPolygon);

        // Prepare parts
        const partsPolygons = [];
        const partMap = new Map(); // mapping index to part info
        
        let polyIndex = 0;
        parts.forEach(part => {
          let polygon = part.polygon;
          if (!polygon || polygon.length === 0) {
            polygon = [
              { x: 0, y: 0 },
              { x: part.width, y: 0 },
              { x: part.width, y: part.length },
              { x: 0, y: part.length }
            ];
          }

          for (let i = 0; i < part.quantity; i++) {
            partsPolygons.push(polygon);
            partMap.set(polyIndex, {
              id: part.id,
              partName: part.name || `Part_${part.id}`,
              originalPolygon: polygon,
              svgPath: part.svgPath,
              width: part.width,
              height: part.length
            });
            polyIndex++;
          }
        });

        nest.setParts(partsPolygons);

        let generationCount = 0;
        const MAX_GENERATIONS = 3; // Keep generations low to prevent hanging Node process

        nest.start(
          (progress) => {
            // progress is an internal metric inside AnyNest, typically 0-1
          },
          (placements, utilization) => {
            generationCount++;
            
            if (generationCount >= MAX_GENERATIONS) {
              nest.stop();
              
              const results = {
                sheetsNeeded: placements.length,
                packedSheets: [],
                unpackedItems: []
              };

              placements.forEach((binPlacements, index) => {
                const sheetParts = binPlacements.map(placement => {
                  const partInfo = partMap.get(placement.partId);
                  
                  // Calculate vertices based on placement geometry
                  const vertices = partInfo.originalPolygon.map(pt => {
                    const rotRad = placement.rotation * Math.PI / 180;
                    return {
                      x: pt.x * Math.cos(rotRad) - pt.y * Math.sin(rotRad) + placement.x,
                      y: pt.x * Math.sin(rotRad) + pt.y * Math.cos(rotRad) + placement.y
                    };
                  });

                  return {
                    id: partInfo.id,
                    partName: partInfo.partName,
                    x: placement.x,
                    y: placement.y,
                    width: partInfo.width,
                    height: partInfo.height,
                    rotation: placement.rotation,
                    svgPath: partInfo.svgPath,
                    vertices: vertices
                  };
                });
                
                results.packedSheets.push({
                  sheetIndex: index + 1,
                  sheetWidth: sheet.width,
                  sheetLength: sheet.length,
                  parts: sheetParts,
                  efficiency: utilization * 100
                });
              });
              
              resolve(results);
            }
          }
        );
      } catch (error) {
        logger.error('Error in True Shape Nesting:', error);
        reject(error);
      }
    });
  }

  static parseDXF(dxfString) {
    try {
      const parser = new DxfParser();
      const dxf = parser.parseSync(dxfString);
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasGeometry = false;
      let polygon = [];

      if (dxf.entities) {
        // Try to find the first closed LWPOLYLINE or POLYLINE
        const mainPolyline = dxf.entities.find(e => (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') && e.vertices && e.vertices.length > 2);
        
        if (mainPolyline) {
          mainPolyline.vertices.forEach(v => {
            polygon.push({ x: v.x, y: v.y });
          });
        }

        dxf.entities.forEach(entity => {
          if (entity.vertices) {
            entity.vertices.forEach(v => {
              if (v.x < minX) minX = v.x;
              if (v.y < minY) minY = v.y;
              if (v.x > maxX) maxX = v.x;
              if (v.y > maxY) maxY = v.y;
              hasGeometry = true;
            });
          }
        });
      }

      if (!hasGeometry) {
        throw new Error("No valid geometry found in DXF");
      }

      // Shift polygon to origin (0,0)
      if (polygon.length > 0) {
        polygon = polygon.map(p => ({
          x: p.x - minX,
          y: p.y - minY
        }));
      }

      const width = maxX - minX;
      const height = maxY - minY;

      let svgPath = '';
      if (polygon.length > 0) {
        svgPath = `M ${polygon[0].x} ${polygon[0].y} ` + polygon.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
      } else {
        svgPath = `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
        polygon = [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height }
        ];
      }

      return {
        success: true,
        width: Math.ceil(width),
        height: Math.ceil(height),
        polygon,
        svgPath,
        rawEntities: dxf.entities
      };
    } catch (error) {
      logger.error('Error parsing DXF:', error);
      return { success: false, error: error.message };
    }
  }
}
