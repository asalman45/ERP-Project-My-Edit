// src/controllers/bom.controller.js
import * as bomModel from '../models/bom.model.js';
import * as blankSpecModel from '../models/blankSpec.model.js';
import * as materialConsumptionModel from '../models/materialConsumption.model.js';
import * as scrapInventoryModel from '../models/scrapInventory.model.js';
import { validateAddMaterial, validateUpdateQuantity } from '../validators/bom.validator.js';
import { logger } from '../utils/logger.js';
import db from '../utils/db.js';

export const getBOM = async (req, res) => {
  const materials = await bomModel.findByProductId(req.params.productId);
  return res.json({ data: materials });
};

export const addMaterial = async (req, res) => {
  const { error, value } = validateAddMaterial(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const bomItem = await bomModel.addMaterial(value);
    logger.info({ product_id: value.product_id, material_id: value.material_id }, 'material added to BOM');
    return res.status(201).json({ data: bomItem });
  } catch (err) {
    logger.error({ err, product_id: value.product_id, material_id: value.material_id }, 'Failed to add material to BOM');
    return res.status(500).json({ error: 'Failed to add material to BOM. Please try again.' });
  }
};

export const removeMaterial = async (req, res) => {
  try {
    await bomModel.removeMaterial(req.params.productId, req.params.materialId);
    logger.info({ product_id: req.params.productId, material_id: req.params.materialId }, 'material removed from BOM');
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, product_id: req.params.productId, material_id: req.params.materialId }, 'Failed to remove material from BOM');
    return res.status(500).json({ error: 'Failed to remove material from BOM. Please try again.' });
  }
};

export const removeSubAssembly = async (req, res) => {
  try {
    const { productId, subAssemblyName } = req.params;
    const deleted = await blankSpecModel.removeByProductIdAndSubAssembly(productId, subAssemblyName);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Sub-assembly not found' });
    }
    
    logger.info({ product_id: productId, sub_assembly_name: subAssemblyName }, 'sub-assembly removed from blank specifications');
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, product_id: req.params.productId, sub_assembly_name: req.params.subAssemblyName }, 'Failed to remove sub-assembly from blank specifications');
    return res.status(500).json({ error: 'Failed to remove sub-assembly from blank specifications. Please try again.' });
  }
};

export const updateQuantity = async (req, res) => {
  const { error, value } = validateUpdateQuantity(req.body);
  if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

  try {
    const bomItem = await bomModel.updateQuantity(req.params.productId, req.params.materialId, value.quantity);
    if (!bomItem) return res.status(404).json({ error: 'BOM item not found' });
    
    logger.info({ product_id: req.params.productId, material_id: req.params.materialId, quantity: value.quantity }, 'BOM quantity updated');
    return res.json({ data: bomItem });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId, material_id: req.params.materialId }, 'Failed to update BOM quantity');
    return res.status(500).json({ error: 'Failed to update BOM quantity. Please try again.' });
  }
};

// Enhanced BOM functionality for spreadsheet-like data
export const getBOMWithSubAssemblies = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeBlankSpecs = true, includeConsumption = true } = req.query;

    logger.info({ product_id: productId }, 'Starting BOM retrieval');

    // Get BOM with sub-assembly breakdown
    const bomData = await bomModel.findByProductIdWithSubAssemblies(productId);
    logger.info({ product_id: productId, bom_count: bomData.length }, 'BOM data retrieved');
    
    let result = { bom: bomData || [] };

    if (includeBlankSpecs === 'true') {
      try {
        // Get blank specifications for each sub-assembly
        const blankSpecs = await blankSpecModel.findByProductId(productId);
        result.blankSpecs = blankSpecs || [];
        logger.info({ product_id: productId, blank_specs_count: blankSpecs?.length || 0 }, 'Blank specs retrieved');
      } catch (blankSpecError) {
        logger.warn({ product_id: productId, error: blankSpecError }, 'Failed to retrieve blank specs, continuing with empty array');
        result.blankSpecs = [];
      }
    }

    if (includeConsumption === 'true') {
      try {
        // Get material consumption calculations
        const consumptionData = await materialConsumptionModel.findByProductId(productId);
        result.materialConsumption = consumptionData || [];
        logger.info({ product_id: productId, consumption_count: consumptionData?.length || 0 }, 'Material consumption retrieved');
      } catch (consumptionError) {
        logger.warn({ product_id: productId, error: consumptionError }, 'Failed to retrieve material consumption, continuing with empty array');
        result.materialConsumption = [];
      }
    }

    logger.info({ product_id: productId }, 'BOM with sub-assemblies retrieved successfully');
    return res.json({ data: result });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId, stack: err.stack }, 'Failed to get BOM with sub-assemblies');
    return res.status(500).json({ error: 'Failed to retrieve BOM data. Please try again.' });
  }
};

export const calculateMaterialConsumption = async (req, res) => {
  try {
    const { productId } = req.params;
    const { sheetType = '4x8', sheetWidth = 1219, sheetLength = 2438 } = req.body; // Default 4x8 feet in mm

    // Get all blank specifications for the product
    const blankSpecs = await blankSpecModel.findByProductId(productId);
    
    if (!blankSpecs || blankSpecs.length === 0) {
      return res.status(404).json({ error: 'No blank specifications found for this product' });
    }

    const consumptionResults = [];

    for (const spec of blankSpecs) {
      // Calculate pieces per sheet
      const piecesPerSheet = Math.floor((sheetWidth / spec.width_mm) * (sheetLength / spec.length_mm));
      
      // Calculate utilization percentage
      const blankArea = spec.width_mm * spec.length_mm;
      const sheetArea = sheetWidth * sheetLength;
      const utilizationPercent = ((blankArea * piecesPerSheet) / sheetArea) * 100;
      
      // Calculate total blanks needed
      const totalBlanks = spec.quantity * piecesPerSheet;
      
      // Calculate consumption percentage (assuming 100% utilization for now)
      const consumptionPercent = utilizationPercent;

      const result = {
        blank_id: spec.blank_id,
        sub_assembly_name: spec.sub_assembly_name,
        width_mm: spec.width_mm,
        length_mm: spec.length_mm,
        thickness_mm: spec.thickness_mm,
        quantity: spec.quantity,
        pieces_per_sheet: piecesPerSheet,
        utilization_percent: Math.round(utilizationPercent * 100) / 100,
        total_blanks: totalBlanks,
        consumption_percent: Math.round(consumptionPercent * 100) / 100,
        sheet_type: sheetType,
        sheet_width_mm: sheetWidth,
        sheet_length_mm: sheetLength
      };

      consumptionResults.push(result);

      // Save or update material consumption record
      await materialConsumptionModel.upsert({
        product_id: productId,
        material_id: spec.material_id || null,
        sub_assembly_name: spec.sub_assembly_name,
        sheet_type: sheetType,
        sheet_width_mm: sheetWidth,
        sheet_length_mm: sheetLength,
        sheet_weight_kg: null, // Will be calculated if material density is known
        blank_width_mm: spec.width_mm,
        blank_length_mm: spec.length_mm,
        blank_thickness_mm: spec.thickness_mm,
        blank_weight_kg: spec.blank_weight_kg,
        pieces_per_sheet: piecesPerSheet,
        utilization_pct: utilizationPercent,
        total_blanks: totalBlanks,
        consumption_pct: consumptionPercent
      });
    }

    logger.info({ product_id: productId, sheet_type: sheetType }, 'Material consumption calculated');
    return res.json({ 
      data: {
        product_id: productId,
        sheet_type: sheetType,
        sheet_dimensions: { width_mm: sheetWidth, length_mm: sheetLength },
        consumption_results: consumptionResults,
        summary: {
          total_sub_assemblies: consumptionResults.length,
          average_utilization: consumptionResults.reduce((sum, r) => sum + r.utilization_percent, 0) / consumptionResults.length,
          total_blanks: consumptionResults.reduce((sum, r) => sum + r.total_blanks, 0)
        }
      }
    });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to calculate material consumption');
    return res.status(500).json({ error: 'Failed to calculate material consumption. Please try again.' });
  }
};

export const getProcessFlow = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get routing information with process flow
    const processFlow = await bomModel.getProcessFlowByProductId(productId);
    
    logger.info({ product_id: productId }, 'Process flow retrieved');
    return res.json({ data: processFlow });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get process flow');
    return res.status(500).json({ error: 'Failed to retrieve process flow. Please try again.' });
  }
};

export const addSubAssembly = async (req, res) => {
  try {
    const { productId } = req.params;
    const { material_id, sub_assembly_name, quantity, step_sequence, is_optional = false, uom_id } = req.body;

    if (!material_id || !sub_assembly_name || !quantity) {
      return res.status(400).json({ error: 'material_id, sub_assembly_name, and quantity are required' });
    }

    const bomItem = await bomModel.addSubAssembly({
      product_id: productId,
      material_id,
      sub_assembly_name,
      quantity,
      step_sequence,
      is_optional,
      uom_id
    });

    logger.info({ 
      product_id: productId, 
      material_id, 
      sub_assembly_name, 
      quantity 
    }, 'Sub-assembly added to BOM');

    return res.status(201).json({ data: bomItem });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to add sub-assembly to BOM');
    return res.status(500).json({ error: 'Failed to add sub-assembly. Please try again.' });
  }
};

export const getReusableMaterials = async (req, res) => {
  try {
    const { productId } = req.params;
    const { materialId } = req.query;

    // Get available scrap/reusable materials that could be used for this product
    const reusableMaterials = await scrapInventoryModel.findReusableForProduct(productId, materialId);
    
    logger.info({ product_id: productId, material_id: materialId }, 'Reusable materials retrieved');
    return res.json({ data: reusableMaterials });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get reusable materials');
    return res.status(500).json({ error: 'Failed to retrieve reusable materials. Please try again.' });
  }
};

export const optimizeMaterialUsage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { prioritizeScrap = true, sheetType = '4x8' } = req.body;

    // Get BOM requirements
    const bomData = await bomModel.findByProductIdWithSubAssemblies(productId);
    const blankSpecs = await blankSpecModel.findByProductId(productId);
    
    // Get available scrap materials
    const availableScrap = await scrapInventoryModel.findAvailableScrap();
    
    const optimizationResults = {
      product_id: productId,
      recommendations: [],
      scrap_usage: [],
      new_material_requirements: [],
      cost_savings: 0
    };

    // Analyze each sub-assembly for scrap optimization
    for (const spec of blankSpecs) {
      const matchingScrap = availableScrap.filter(scrap => 
        scrap.width_mm >= spec.width_mm && 
        scrap.length_mm >= spec.length_mm && 
        scrap.thickness_mm >= spec.thickness_mm
      );

      if (matchingScrap.length > 0 && prioritizeScrap) {
        // Use scrap material
        const bestScrap = matchingScrap[0]; // Could implement better selection logic
        optimizationResults.scrap_usage.push({
          blank_id: spec.blank_id,
          sub_assembly_name: spec.sub_assembly_name,
          scrap_id: bestScrap.scrap_id,
          scrap_dimensions: {
            width: bestScrap.width_mm,
            length: bestScrap.length_mm,
            thickness: bestScrap.thickness_mm
          },
          required_dimensions: {
            width: spec.width_mm,
            length: spec.length_mm,
            thickness: spec.thickness_mm
          },
          utilization: ((spec.width_mm * spec.length_mm) / (bestScrap.width_mm * bestScrap.length_mm)) * 100
        });
      } else {
        // Need new material
        optimizationResults.new_material_requirements.push({
          blank_id: spec.blank_id,
          sub_assembly_name: spec.sub_assembly_name,
          required_dimensions: {
            width: spec.width_mm,
            length: spec.length_mm,
            thickness: spec.thickness_mm
          },
          quantity: spec.quantity
        });
      }
    }

    logger.info({ product_id: productId, prioritize_scrap: prioritizeScrap }, 'Material usage optimized');
    return res.json({ data: optimizationResults });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to optimize material usage');
    return res.status(500).json({ error: 'Failed to optimize material usage. Please try again.' });
  }
};

// Import BOM data from spreadsheet format
export const importBOMFromSpreadsheet = async (req, res) => {
  try {
    const bomImportUtility = await import('../utils/bomImportUtility.js');
    const results = await bomImportUtility.importBOMData(req.body);
    
    logger.info(results, 'BOM import completed');
    return res.json({ 
      success: true, 
      data: results,
      message: `Successfully imported ${results.imported} parts with ${results.errors.length} errors`
    });
  } catch (err) {
    logger.error({ err }, 'Failed to import BOM from spreadsheet');
    return res.status(500).json({ error: 'Failed to import BOM data. Please try again.' });
  }
};

// Export BOM data in specified format
export const exportBOMData = async (req, res) => {
  try {
    const { format = 'csv', productId } = req.query;
    
    if (format === 'csv') {
      // Get BOM data in standard format
      let bomData = null;
      if (productId) {
        const bomResponse = await getBOMInStandardFormat({ params: { productId } });
        bomData = bomResponse.data || bomResponse;
      }
      
      if (!bomData) {
        return res.status(404).json({ error: 'No BOM data found for export' });
      }
      
      // Generate CSV content
      let csvContent = '';
      
      // Header - matching the exact table format from the image
      csvContent += 'Part No,Part Description,Mode (e.g. NMR / NPR),Sub Assembly,Blank Size W,Blank Size L,Blank Size t,Blank Size Qty,Picture,Weight of the blank,4x8 Sheet Consumption (%),4x8 Sheet Weight,No of Pcs/Sheet,Total Blanks Wt\n';
      
      // Data rows - one row per sub-assembly
      bomData.subAssemblies.forEach(subAssembly => {
        const totalWeight = typeof subAssembly.weightPerBlank === 'number' && typeof subAssembly.blankSize.quantity === 'number' 
          ? (subAssembly.weightPerBlank * subAssembly.blankSize.quantity).toFixed(2) 
          : 'MISSING';
        
        csvContent += `"${bomData.partNo}","${bomData.partDescription}","${bomData.mode}","${subAssembly.name}","${subAssembly.blankSize.width}","${subAssembly.blankSize.length}","${subAssembly.blankSize.thickness}","${subAssembly.blankSize.quantity}","${bomData.picture || 'No Image'}","${subAssembly.weightPerBlank}","${subAssembly.materialConsumption.sheetConsumptionPercent}","${subAssembly.materialConsumption.sheetWeight}","${subAssembly.materialConsumption.piecesPerSheet}","${totalWeight}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=bom_${bomData.partNo}_${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvContent);
    }
    
    return res.status(400).json({ error: 'Unsupported export format' });
  } catch (err) {
    logger.error({ err }, 'Failed to export BOM data');
    return res.status(500).json({ error: 'Failed to export BOM data. Please try again.' });
  }
};

// Export scrap management data
export const exportScrapData = async (req, res) => {
  try {
    const { productId } = req.query;
    
    // Get scrap data
    let scrapData = null;
    if (productId) {
      const scrapResponse = await getScrapManagement({ params: { productId } });
      scrapData = scrapResponse.data || scrapResponse;
    }
    
    if (!scrapData || !scrapData.scrapDetails || scrapData.scrapDetails.length === 0) {
      return res.status(404).json({ error: 'No scrap data found for export' });
    }
    
    // Generate CSV content
    let csvContent = '';
    
    // Header
    csvContent += 'Material ID,Material Name,Quantity,Unit,Reason,Suggested Action,Estimated Salvage Value,Width,Length,Thickness\n';
    
    // Data rows
    scrapData.scrapDetails.forEach(scrap => {
      csvContent += `"${scrap.materialId}","${scrap.materialName}","${scrap.quantity}","${scrap.unit}","${scrap.reason}","${scrap.suggestedAction}","${scrap.estimatedSalvageValue}","${scrap.dimensions.width}","${scrap.dimensions.length}","${scrap.dimensions.thickness}"\n`;
    });
    
    // Add consolidated summary section
    csvContent += '\n\n--- CONSOLIDATED SCRAP SUMMARY ---\n';
    csvContent += 'Material Name,Material ID,Total Quantity,Total Value,Number of Entries,Avg per Entry\n';
    
    scrapData.consolidatedSummary.forEach(summary => {
      const avgPerEntry = summary.entries.length > 0 ? (summary.totalQuantity / summary.entries.length).toFixed(2) : '0';
      csvContent += `"${summary.materialName}","${summary.materialId}","${summary.totalQuantity}","${summary.totalValue}","${summary.entries.length}","${avgPerEntry}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=scrap_management_${productId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvContent);
  } catch (err) {
    logger.error({ err }, 'Failed to export scrap data');
    return res.status(500).json({ error: 'Failed to export scrap data. Please try again.' });
  }
};

// Get BOM data in the new standardized format
export const getBOMInStandardFormat = async (req, res) => {
  try {
    const { productId } = req.params;
    logger.info({ product_id: productId }, 'Getting BOM in standard format');
    
    // Get product details with model information
    const productRes = await db.query(
      `SELECT p.*, m.model_name, o.oem_name 
       FROM product p 
       LEFT JOIN model m ON p.model_id = m.model_id 
       LEFT JOIN oem o ON m.oem_id = o.oem_id 
       WHERE p.product_id = $1`,
      [productId]
    );
    
    logger.info({ product_count: productRes.rows.length }, 'Product query result');
    
    if (productRes.rows.length === 0) {
      logger.warn({ product_id: productId }, 'Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productRes.rows[0];
    
    // Get blank specifications with material consumption data
    const blankSpecs = await blankSpecModel.findByProductId(productId);
    logger.info({ blank_specs_count: blankSpecs.length }, 'Blank specs found');
    
    // Get material consumption data
    const consumptionData = await materialConsumptionModel.findByProductId(productId);
    logger.info({ consumption_data_count: consumptionData.length }, 'Consumption data found');
    
    // Format data according to the exact step-by-step specification
    const standardizedBOM = {
      // Step 1: Part No
      partNo: product.product_code || 'MISSING',
      // Step 2: Part Description  
      partDescription: product.part_name || 'MISSING',
      // Step 3: Mode (e.g. NMR / NPR)
      mode: product.model_name || 'MISSING',
      // Step 4: Sub Assembly (will be populated below)
      subAssemblies: [],
      // Step 7: Picture (placeholder for now)
      picture: null, // TODO: Add image support
      // Step 9: Total Weight / Totals
      totalWeight: 0
    };
    
    let totalWeight = 0;

    // If no blank specs found, return basic product info
    if (!blankSpecs || blankSpecs.length === 0) {
      logger.warn({ product_id: productId }, 'No blank specifications found for product');
      const basicBOM = {
        partNo: product.product_code || 'MISSING',
        partDescription: product.part_name || 'MISSING',
        mode: product.model_name || 'MISSING',
        subAssemblies: [],
        picture: null,
        totalWeight: 0
      };
      return res.json({ data: basicBOM });
    }

    // Process each blank specification as a sub-assembly
    for (const spec of blankSpecs) {
      // Find corresponding consumption data
      const consumption = consumptionData.find(c => 
        c.sub_assembly_name === spec.sub_assembly_name &&
        c.blank_width_mm === spec.width_mm &&
        c.blank_length_mm === spec.length_mm
      );
      
      const subAssembly = {
        // Step 4: Sub Assembly
        name: validateField(spec.sub_assembly_name, 'sub_assembly_name'),
        // Step 5: Blank Size — Width (W), Length (L), Thickness (t), Qty
          blankSize: {
          width: validateField(spec.width_mm, 'width_mm'),
          length: validateField(spec.length_mm, 'length_mm'), 
          thickness: validateField(spec.thickness_mm, 'thickness_mm'),
          quantity: validateField(spec.quantity, 'quantity')
        },
        // Step 7: Weight (per blank)
        weightPerBlank: validateField(spec.blank_weight_kg, 'blank_weight_kg'),
        // Step 8: Material Consumption
          materialConsumption: {
          sheetConsumptionPercent: validateField(
            consumption?.utilization_pct || spec.sheet_util_pct, 
            'sheet_utilization_percent'
          ),
          sheetWeight: validateField(
            consumption?.sheet_weight_kg || spec.sheet_weight_kg, 
            'sheet_weight_kg'
          ),
          piecesPerSheet: validateField(
            consumption?.pieces_per_sheet || spec.pcs_per_sheet, 
            'pieces_per_sheet'
          ),
          totalBlanks: validateField(
            consumption?.total_blanks || spec.total_blanks, 
            'total_blanks'
          )
        }
      };
      
      // Calculate total weight for this sub-assembly
      if (typeof spec.blank_weight_kg === 'number' && typeof spec.quantity === 'number') {
        totalWeight += spec.blank_weight_kg * spec.quantity;
      }
      
      standardizedBOM.subAssemblies.push(subAssembly);
    }
    
    standardizedBOM.totalWeight = totalWeight;
    
    logger.info({ 
      product_id: productId, 
      sub_assemblies_count: standardizedBOM.subAssemblies.length,
      sub_assemblies: standardizedBOM.subAssemblies,
      full_bom_data: standardizedBOM
    }, 'BOM data retrieved in standard format');
    return res.json({ data: standardizedBOM });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get BOM in standard format');
    return res.status(500).json({ error: 'Failed to retrieve BOM data. Please try again.' });
  }
};

// Validation helper function
const validateField = (value, fieldName) => {
  if (value === null || value === undefined || value === '' || 
      (typeof value === 'number' && isNaN(value))) {
    return 'MISSING';
  }
  return value;
};

// Get scrap/leftover materials for a product
export const getScrapManagement = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get all scrap inventory entries that could be leftover from this product
    const scrapEntries = await scrapInventoryModel.findByProductId(productId);
    
    // Group scrap by material for consolidated summary
    const scrapSummary = {};
    const scrapDetails = [];
    
    for (const scrap of scrapEntries) {
      // Get material details
      const materialRes = await db.query(
        `SELECT m.material_code, m.name as material_name 
         FROM material m 
         WHERE m.material_id = $1`,
        [scrap.material_id]
      );
      
      const material = materialRes.rows[0] || { material_code: 'UNKNOWN', material_name: 'Unknown Material' };
      
      const scrapEntry = {
        materialId: validateField(scrap.material_id, 'scrap_material_id'),
        materialName: validateField(material.material_name, 'material_name'),
        quantity: validateField(scrap.weight_kg, 'scrap_weight_kg'),
        unit: 'kg',
        reason: 'cutting loss', // Default reason, could be enhanced
        suggestedAction: scrap.status === 'AVAILABLE' ? 'reuse' : 'scrap',
        estimatedSalvageValue: 0, // TODO: Calculate based on material value
        dimensions: {
          width: validateField(scrap.width_mm, 'scrap_width_mm'),
          length: validateField(scrap.length_mm, 'scrap_length_mm'),
          thickness: validateField(scrap.thickness_mm, 'scrap_thickness_mm')
        }
      };
      
      scrapDetails.push(scrapEntry);
      
      // Add to summary
      const materialKey = material.material_name;
      if (!scrapSummary[materialKey]) {
        scrapSummary[materialKey] = {
          materialId: scrap.material_id,
          materialName: material.material_name,
          totalQuantity: 0,
          totalValue: 0,
          entries: []
        };
      }
      
      scrapSummary[materialKey].totalQuantity += typeof scrap.weight_kg === 'number' ? scrap.weight_kg : 0;
      scrapSummary[materialKey].totalValue += scrapEntry.estimatedSalvageValue;
      scrapSummary[materialKey].entries.push(scrapEntry);
    }
    
    const result = {
      productId,
      scrapDetails,
      consolidatedSummary: Object.values(scrapSummary)
    };
    
    logger.info({ product_id: productId, scrap_entries_count: scrapEntries.length }, 'Scrap management data retrieved');
    return res.json({ data: result });
  } catch (err) {
    logger.error({ err, product_id: req.params.productId }, 'Failed to get scrap management data');
    return res.status(500).json({ error: 'Failed to retrieve scrap management data. Please try again.' });
  }
};
