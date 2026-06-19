import { AdvancedNestingCalculator } from '../../utils/advancedNestingCalculator.js';
import { logger } from '../../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const advancedNestingController = {
  /**
   * Run Batch Nesting on multiple parts (Rectangular)
   */
  calculateBatch: async (req, res) => {
    try {
      const { parts, sheetWidth, sheetLength, options } = req.body;

      if (!parts || !Array.isArray(parts) || parts.length === 0) {
        return res.status(400).json({ success: false, message: 'Valid parts array is required' });
      }

      const sheet = { width: sheetWidth || 1220, length: sheetLength || 2440 };
      
      const result = await AdvancedNestingCalculator.runTrueShapeNesting(parts, sheet, options);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in calculateBatch:', error);
      return res.status(500).json({ success: false, message: 'Error calculating batch nesting', error: error.message });
    }
  },

  /**
   * Process DXF upload and extract bounding boxes
   */
  processCadUpload: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No CAD file uploaded' });
      }

      const file = req.files[0];
      const fileContent = file.buffer.toString('utf-8');

      // For DXF files
      if (file.originalname.toLowerCase().endsWith('.dxf')) {
        const result = AdvancedNestingCalculator.parseDXF(fileContent);
        if (result.success) {
          return res.status(200).json({
            success: true,
            data: {
              filename: file.originalname,
              extractedWidth: result.width,
              extractedLength: result.height,
              polygon: result.polygon,
              svgPath: result.svgPath,
              message: 'Successfully extracted true shape from DXF'
            }
          });
        } else {
          return res.status(400).json({ success: false, message: 'Invalid or unsupported DXF file', error: result.error });
        }
      }

      // For SVG, we would add SVG bounds parsing here
      return res.status(400).json({ success: false, message: 'Only DXF files are supported currently for CAD extraction' });

    } catch (error) {
      logger.error('Error in processCadUpload:', error);
      return res.status(500).json({ success: false, message: 'Error processing CAD file', error: error.message });
    }
  },

  /**
   * Get available offcuts from Inventory
   */
  getAvailableOffcuts: async (req, res) => {
    try {
      // Query ScrapInventory where status is AVAILABLE and leftover_area is significant
      const offcuts = await prisma.scrapInventory.findMany({
        where: {
          status: 'AVAILABLE',
          leftover_area_mm2: {
            gt: 10000 // Only offcuts larger than 100x100mm
          }
        },
        orderBy: {
          leftover_area_mm2: 'desc'
        },
        take: 50
      });

      return res.status(200).json({
        success: true,
        data: offcuts
      });
    } catch (error) {
      logger.error('Error fetching offcuts:', error);
      return res.status(500).json({ success: false, message: 'Error fetching offcuts', error: error.message });
    }
  }
};
