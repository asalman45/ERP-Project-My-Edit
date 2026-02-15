// src/controllers/testImport.controller.js
import { logger } from '../utils/logger.js';

// Sample data from the spreadsheet
const sampleBOMData = [
  {
    partNo: "897384 060M",
    partDescription: "Bkt Fuel Tank",
    mode: "NMR",
    subAssemblies: [
      {
        name: "Main",
        blankSize: { width: 170, length: 760, thickness: 3, quantity: 1 },
        weightPerBlank: 2.54,
        materialConsumption: {
          sheetConsumptionPercent: 91,
          sheetWeight: 58.42,
          piecesPerSheet: 21.00,
          totalBlanks: 53.25
        }
      },
      {
        name: "Rubber (U)",
        blankSize: { width: 8, length: null, thickness: 3, quantity: 1, unit: "inch" },
        weightPerBlank: null,
        materialConsumption: null
      }
    ]
  },
  {
    partNo: "898062 73NM",
    partDescription: "Base Plate",
    mode: "NMR",
    subAssemblies: [
      {
        name: "Main",
        blankSize: { width: 240, length: 1010, thickness: 2.0, quantity: 1 },
        weightPerBlank: 3.81,
        materialConsumption: {
          sheetConsumptionPercent: 90,
          sheetWeight: 46.74,
          piecesPerSheet: 11.00,
          totalBlanks: 41.86
        }
      },
      {
        name: "Sides",
        blankSize: { width: 90, length: 90, thickness: 3.0, quantity: 2 },
        weightPerBlank: 0.19,
        materialConsumption: {
          sheetConsumptionPercent: 96,
          sheetWeight: 70.10,
          piecesPerSheet: 351.00,
          totalBlanks: 66.96
        }
      },
      {
        name: "Rubber",
        blankSize: { width: 5, length: 15, thickness: 3.0, quantity: 2, unit: "inch" },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "Symentex",
        blankSize: { width: null, length: null, thickness: null, quantity: null },
        weightPerBlank: null,
        materialConsumption: null
      }
    ]
  },
  {
    partNo: "897169-2311",
    partDescription: "Band Fuel Tank",
    mode: "NMR",
    subAssemblies: [
      {
        name: "Strip",
        blankSize: { width: 29, length: 650, thickness: 1, quantity: 1 },
        weightPerBlank: 0.18,
        materialConsumption: {
          sheetConsumptionPercent: 90,
          sheetWeight: 28.04,
          piecesPerSheet: 142.00,
          totalBlanks: 25.21
        }
      },
      {
        name: "Rubber",
        blankSize: { width: 32, length: 600, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "M8x1.25",
        blankSize: { width: null, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      }
    ]
  },
  {
    partNo: "898126-2341",
    partDescription: "Brkt Gear Control",
    mode: "NPR 71",
    subAssemblies: [
      {
        name: "Main",
        blankSize: { width: null, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "Clamp1",
        blankSize: { width: null, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "Clamp2",
        blankSize: { width: null, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "Strip",
        blankSize: { width: null, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "M8x1.25 Nut",
        blankSize: { width: null, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      }
    ]
  },
  {
    partNo: "897035 517M/1 8M",
    partDescription: "Bkt Fuel Tank for AL Tank",
    mode: "NPR 71",
    subAssemblies: [
      {
        name: "Main",
        blankSize: { width: 160, length: 690, thickness: 2.5, quantity: 1 },
        weightPerBlank: 2.17,
        materialConsumption: {
          sheetConsumptionPercent: 89,
          sheetWeight: 58.42,
          piecesPerSheet: 24.00,
          totalBlanks: 52.00
        }
      },
      {
        name: "Rubber",
        blankSize: { width: 7.75, length: null, thickness: 3.0, quantity: 2, unit: "inch" },
        weightPerBlank: null,
        materialConsumption: null
      }
    ]
  },
  {
    partNo: "897169 23AL",
    partDescription: "Band Fuel Tank for AL Tank",
    mode: "NPR 71",
    subAssemblies: [
      {
        name: "Strip",
        blankSize: { width: 29, length: 605, thickness: 1.2, quantity: 1 },
        weightPerBlank: 0.17,
        materialConsumption: {
          sheetConsumptionPercent: 99,
          sheetWeight: 28.04,
          piecesPerSheet: 168.00,
          totalBlanks: 27.77
        }
      },
      {
        name: "Rubber",
        blankSize: { width: 32, length: 570, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      },
      {
        name: "M8x1.25",
        blankSize: { width: 65, length: null, thickness: null, quantity: 1 },
        weightPerBlank: null,
        materialConsumption: null
      }
    ]
  }
];

export const importSampleBOMData = async (req, res) => {
  try {
    logger.info('Starting sample BOM data import');
    
    // Import the BOM import utility
    const bomImportUtility = await import('../utils/bomImportUtility.js');
    const results = await bomImportUtility.importBOMData(sampleBOMData);
    
    logger.info(results, 'Sample BOM import completed');
    return res.json({ 
      success: true, 
      data: results,
      message: `Successfully imported ${results.imported} parts with ${results.errors.length} errors`,
      sampleData: sampleBOMData
    });
  } catch (err) {
    logger.error({ err }, 'Failed to import sample BOM data');
    return res.status(500).json({ error: 'Failed to import sample BOM data. Please try again.' });
  }
};

export const getSampleBOMData = async (req, res) => {
  try {
    return res.json({ 
      success: true, 
      data: sampleBOMData,
      message: 'Sample BOM data retrieved successfully'
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get sample BOM data');
    return res.status(500).json({ error: 'Failed to retrieve sample BOM data.' });
  }
};

