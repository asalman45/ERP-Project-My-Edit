// src/utils/bomImportUtility.js
import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient();

/**
 * BOM Import Utility for Ghandhara Industries Spreadsheet Format
 * Handles import of BOM data with sub-assemblies, blank specifications, and material consumption
 */

// Sample data structure from the spreadsheet
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
  }
  // Add more parts as needed
];

/**
 * Import BOM data from spreadsheet format
 */
export const importBOMData = async (bomData = sampleBOMData) => {
  try {
    logger.info({ count: bomData.length }, 'Starting BOM data import');
    
    const results = {
      imported: 0,
      errors: [],
      scrapEntries: []
    };

    for (const part of bomData) {
      try {
        // Create or find product
        const product = await upsertProduct(part);
        
        // Import sub-assemblies
        for (const subAssembly of part.subAssemblies) {
          await importSubAssembly(product.product_id, subAssembly, results);
        }
        
        results.imported++;
        logger.info({ partNo: part.partNo }, 'Part imported successfully');
        
      } catch (error) {
        logger.error({ error, partNo: part.partNo }, 'Failed to import part');
        results.errors.push({
          partNo: part.partNo,
          error: error.message
        });
      }
    }

    // Create scrap entries for leftover materials
    await createScrapEntries(results.scrapEntries);
    
    logger.info(results, 'BOM import completed');
    return results;
    
  } catch (error) {
    logger.error({ error }, 'BOM import failed');
    throw error;
  }
};

/**
 * Upsert product in database
 */
const upsertProduct = async (part) => {
  // Find or create OEM
  const oem = await prisma.oEM.upsert({
    where: { oem_name: 'Ghandhara Industries Ltd' },
    update: {},
    create: { oem_name: 'Ghandhara Industries Ltd' }
  });

  // Find or create Model
  const model = await prisma.model.upsert({
    where: { 
      oem_id_model_name: {
        oem_id: oem.oem_id,
        model_name: part.mode
      }
    },
    update: {},
    create: {
      oem_id: oem.oem_id,
      model_name: part.mode
    }
  });

  // Find or create UOM
  const uom = await prisma.uOM.upsert({
    where: { code: 'EA' },
    update: {},
    create: { code: 'EA', name: 'Each' }
  });

  // Create or update product
  const product = await prisma.product.upsert({
    where: { product_code: part.partNo },
    update: {
      part_name: part.partDescription,
      category: 'Automotive Parts'
    },
    create: {
      product_code: part.partNo,
      part_name: part.partDescription,
      oem_id: oem.oem_id,
      model_id: model.model_id,
      uom_id: uom.uom_id,
      category: 'Automotive Parts'
    }
  });

  return product;
};

/**
 * Import sub-assembly data
 */
const importSubAssembly = async (productId, subAssembly, results) => {
  // Skip if no valid data
  if (!subAssembly.blankSize.width || !subAssembly.blankSize.length) {
    logger.warn({ subAssembly: subAssembly.name }, 'Skipping sub-assembly with missing dimensions');
    return;
  }

  // Find or create material
  const material = await prisma.material.upsert({
    where: { material_code: `${subAssembly.name}_${productId.slice(-4)}` },
    update: {},
    create: {
      material_code: `${subAssembly.name}_${productId.slice(-4)}`,
      name: subAssembly.name,
      category: 'Raw Material'
    }
  });

  // Find UOM for material
  const uom = await prisma.uOM.upsert({
    where: { code: subAssembly.blankSize.unit === 'inch' ? 'IN' : 'MM' },
    update: {},
    create: { 
      code: subAssembly.blankSize.unit === 'inch' ? 'IN' : 'MM', 
      name: subAssembly.blankSize.unit === 'inch' ? 'Inch' : 'Millimeter' 
    }
  });

  // Create BOM entry
  const bomEntry = await prisma.bOM.upsert({
    where: {
      product_id_material_id: {
        product_id: productId,
        material_id: material.material_id
      }
    },
    update: {
      quantity: subAssembly.blankSize.quantity,
      step_sequence: 1,
      is_optional: false
    },
    create: {
      product_id: productId,
      material_id: material.material_id,
      quantity: subAssembly.blankSize.quantity,
      step_sequence: 1,
      is_optional: false,
      uom_id: uom.uom_id
    }
  });

  // Create blank specification if consumption data exists
  if (subAssembly.materialConsumption) {
    await prisma.blankSpec.upsert({
      where: { 
        product_id_sub_assembly_name: {
          product_id: productId,
          sub_assembly_name: subAssembly.name
        }
      },
      update: {
        width_mm: subAssembly.blankSize.width,
        length_mm: subAssembly.blankSize.length,
        thickness_mm: subAssembly.blankSize.thickness,
        quantity: subAssembly.blankSize.quantity,
        pieces_per_sheet: subAssembly.materialConsumption.piecesPerSheet,
        utilization_pct: subAssembly.materialConsumption.sheetConsumptionPercent
      },
      create: {
        product_id: productId,
        sub_assembly_name: subAssembly.name,
        width_mm: subAssembly.blankSize.width,
        length_mm: subAssembly.blankSize.length,
        thickness_mm: subAssembly.blankSize.thickness,
        quantity: subAssembly.blankSize.quantity,
        pieces_per_sheet: subAssembly.materialConsumption.piecesPerSheet,
        utilization_pct: subAssembly.materialConsumption.sheetConsumptionPercent,
        sheet_type: '4x8'
      }
    });

    // Calculate scrap/lost material
    const leftoverPercent = 100 - subAssembly.materialConsumption.sheetConsumptionPercent;
    if (leftoverPercent > 0) {
      const leftoverWeight = (subAssembly.materialConsumption.sheetWeight * leftoverPercent) / 100;
      
      results.scrapEntries.push({
        material_id: material.material_id,
        material_name: subAssembly.name,
        weight_kg: leftoverWeight,
        reason: 'Cutting loss from sheet utilization',
        suggested_action: 'reuse',
        estimated_salvage_value: leftoverWeight * 50 // Assuming $50/kg
      });
    }
  }

  return bomEntry;
};

/**
 * Create scrap entries for leftover materials
 */
const createScrapEntries = async (scrapEntries) => {
  if (scrapEntries.length === 0) return;

  logger.info({ count: scrapEntries.length }, 'Creating scrap entries');

  for (const scrap of scrapEntries) {
    try {
      await prisma.scrapInventory.create({
        data: {
          material_id: scrap.material_id,
          width_mm: null, // Will be calculated based on leftover dimensions
          length_mm: null,
          thickness_mm: null,
          weight_kg: scrap.weight_kg,
          status: 'AVAILABLE',
          reference: 'BOM_IMPORT',
          notes: scrap.reason
        }
      });
    } catch (error) {
      logger.error({ error, scrap }, 'Failed to create scrap entry');
    }
  }
};

/**
 * Export BOM data in the specified format
 */
export const exportBOMData = async (format = 'csv') => {
  try {
    const bomData = await prisma.product.findMany({
      include: {
        BOM: {
          include: {
            material: true,
            blankSpec: true
          }
        }
      }
    });

    if (format === 'csv') {
      return generateBOMCSV(bomData);
    }

    return bomData;
  } catch (error) {
    logger.error({ error }, 'Failed to export BOM data');
    throw error;
  }
};

/**
 * Generate CSV for BOM data
 */
const generateBOMCSV = (bomData) => {
  const headers = [
    'Part No',
    'Part Description', 
    'Mode',
    'Sub Assembly',
    'Width (W)',
    'Length (L)',
    'Thickness (t)',
    'Qty',
    'Weight (per blank)',
    '4x8 Sheet Consumption (%)',
    '4x8 Sheet Weight',
    'No. of Pcs/Sheet',
    'Total Blanks',
    'Total Weight'
  ];

  const rows = [];

  for (const product of bomData) {
    for (const bom of product.BOM) {
      const blankSpec = bom.blankSpec;
      
      rows.push([
        product.product_code,
        product.part_name,
        product.model?.model_name || 'MISSING',
        bom.material?.name || 'MISSING',
        blankSpec?.width_mm || 'MISSING',
        blankSpec?.length_mm || 'MISSING',
        blankSpec?.thickness_mm || 'MISSING',
        bom.quantity || 'MISSING',
        'MISSING', // Weight per blank - needs to be calculated
        blankSpec?.utilization_pct || 'MISSING',
        'MISSING', // Sheet weight - needs to be calculated
        blankSpec?.pieces_per_sheet || 'MISSING',
        'MISSING', // Total blanks - needs to be calculated
        'MISSING'  // Total weight - needs to be calculated
      ]);
    }
  }

  return {
    headers,
    rows,
    csvContent: [headers, ...rows].map(row => row.join(',')).join('\n')
  };
};

/**
 * Export scrap management data
 */
export const exportScrapData = async () => {
  try {
    const scrapData = await prisma.scrapInventory.findMany({
      include: {
        material: true
      }
    });

    const headers = [
      'Material ID',
      'Material Name',
      'Quantity Left',
      'Unit',
      'Reason',
      'Suggested Action',
      'Estimated Salvage Value'
    ];

    const rows = scrapData.map(scrap => [
      scrap.material?.material_id || 'MISSING',
      scrap.material?.name || 'MISSING',
      scrap.weight_kg || 'MISSING',
      'kg',
      scrap.notes || 'Cutting loss',
      'reuse',
      (scrap.weight_kg || 0) * 50 // Assuming $50/kg
    ]);

    return {
      headers,
      rows,
      csvContent: [headers, ...rows].map(row => row.join(',')).join('\n')
    };
  } catch (error) {
    logger.error({ error }, 'Failed to export scrap data');
    throw error;
  }
};

export default {
  importBOMData,
  exportBOMData,
  exportScrapData
};

