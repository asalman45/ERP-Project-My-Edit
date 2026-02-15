// src/controllers/bomImport.controller.js
import * as productModel from '../models/product.model.js';
import * as materialModel from '../models/material.model.js';
import * as bomModel from '../models/bom.model.js';
import * as blankSpecModel from '../models/blankSpec.model.js';
import * as materialConsumptionModel from '../models/materialConsumption.model.js';
import * as routingModel from '../models/routing.model.js';
import { logger } from '../utils/logger.js';
import XLSX from 'xlsx';

export const importBOMFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const importResults = {
      products_created: 0,
      materials_created: 0,
      bom_items_created: 0,
      blank_specs_created: 0,
      process_flows_created: 0,
      errors: [],
      warnings: []
    };

    // Process each row from the spreadsheet
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        await processSpreadsheetRow(row, importResults);
      } catch (error) {
        importResults.errors.push(`Row ${i + 2}: ${error.message}`);
        logger.error({ error, row }, 'Failed to process spreadsheet row');
      }
    }

    logger.info({ 
      total_rows: data.length,
      results: importResults 
    }, 'BOM import completed');

    return res.json({
      success: true,
      message: 'BOM import completed',
      data: importResults
    });

  } catch (error) {
    logger.error({ error }, 'Failed to import BOM from Excel');
    return res.status(500).json({ error: 'Failed to import BOM data' });
  }
};

async function processSpreadsheetRow(row, importResults) {
  // Extract data from spreadsheet row (matching the image structure)
  const partNumber = row['Part No'] || row['Part Number'] || row['part_no'];
  const partDescription = row['Part Description'] || row['part_description'];
  const mode = row['Mode'] || row['mode'];
  const subAssemblies = row['Sub Assemblies'] || row['sub_assemblies'];
  
  // Blank size data
  const width = parseFloat(row['W'] || row['Width'] || row['width']) || 0;
  const length = parseFloat(row['L'] || row['Length'] || row['length']) || 0;
  const thickness = parseFloat(row['t'] || row['Thickness'] || row['thickness']) || 0;
  const quantity = parseInt(row['Qty'] || row['Quantity'] || row['qty']) || 1;
  
  // Material consumption data
  const blankWeight = parseFloat(row['Weight of the blank'] || row['blank_weight']) || 0;
  const sheetConsumption = parseFloat(row['4x8 Sheet Consumpti (%)'] || row['sheet_consumption']) || 0;
  const sheetWeight = parseFloat(row['4x8 Sheet Weight'] || row['sheet_weight']) || 0;
  const piecesPerSheet = parseInt(row['No of Pcs/She'] || row['pieces_per_sheet']) || 0;
  const totalBlanks = parseFloat(row['Total Blanks'] || row['total_blanks']) || 0;

  if (!partNumber || !partDescription) {
    throw new Error('Part number and description are required');
  }

  // Create or find product
  let product = await productModel.findByCode(partNumber);
  if (!product) {
    product = await productModel.create({
      product_code: partNumber,
      part_name: partDescription,
      description: `${partDescription} - ${mode}`,
      category: 'FINISHED_GOOD'
    });
    importResults.products_created++;
  }

  // Create or find material (assuming steel sheet for now)
  let material = await materialModel.findByCode('STEEL-SHEET');
  if (!material) {
    material = await materialModel.create({
      material_code: 'STEEL-SHEET',
      name: 'Steel Sheet',
      description: 'Standard steel sheet material',
      category: 'RAW_MATERIAL'
    });
    importResults.materials_created++;
  }

  // Parse sub-assemblies
  const subAssemblyList = subAssemblies ? subAssemblies.split(',').map(s => s.trim()) : ['Main'];

  // Create BOM items for each sub-assembly
  for (let j = 0; j < subAssemblyList.length; j++) {
    const subAssemblyName = subAssemblyList[j];
    
    // Create BOM item
    await bomModel.addSubAssembly({
      product_id: product.product_id,
      material_id: material.material_id,
      sub_assembly_name: subAssemblyName,
      quantity: quantity,
      step_sequence: j + 1,
      is_optional: false
    });
    importResults.bom_items_created++;

    // Create blank specification
    if (width > 0 && length > 0 && thickness > 0) {
      await blankSpecModel.create({
        product_id: product.product_id,
        sub_assembly_name: subAssemblyName,
        width_mm: width,
        length_mm: length,
        thickness_mm: thickness,
        quantity: quantity,
        blank_weight_kg: blankWeight,
        pcs_per_sheet: piecesPerSheet,
        sheet_util_pct: sheetConsumption,
        sheet_type: '4x8',
        sheet_weight_kg: sheetWeight,
        total_blanks: totalBlanks,
        consumption_pct: sheetConsumption,
        created_by: 'import'
      });
      importResults.blank_specs_created++;

      // Create material consumption record
      await materialConsumptionModel.upsert({
        product_id: product.product_id,
        material_id: material.material_id,
        sub_assembly_name: subAssemblyName,
        sheet_type: '4x8',
        sheet_width_mm: 1219, // 4 feet in mm
        sheet_length_mm: 2438, // 8 feet in mm
        sheet_weight_kg: sheetWeight,
        blank_width_mm: width,
        blank_length_mm: length,
        blank_thickness_mm: thickness,
        blank_weight_kg: blankWeight,
        pieces_per_sheet: piecesPerSheet,
        utilization_pct: sheetConsumption,
        total_blanks: totalBlanks,
        consumption_pct: sheetConsumption
      });
    }
  }

  // Create process flow based on the image (Calling/Shearing → Forming → Piercing → Cleaning → Paint → Dispatch)
  const processSteps = [
    { step_no: 1, operation: 'Calling/Shearing', work_center: 'Cutting', duration: 30 },
    { step_no: 2, operation: 'Forming', work_center: 'Forming', duration: 45 },
    { step_no: 3, operation: 'Piercing 1', work_center: 'Piercing', duration: 20 },
    { step_no: 4, operation: 'Piercing 2', work_center: 'Piercing', duration: 20 },
    { step_no: 5, operation: 'Cleaning', work_center: 'Cleaning', duration: 15 },
    { step_no: 6, operation: 'Paint', work_center: 'Painting', duration: 30 },
    { step_no: 7, operation: 'Dispatch', work_center: 'Dispatch', duration: 10 }
  ];

  // Check if process flow already exists
  const existingFlow = await routingModel.findByProductId(product.product_id);
  if (existingFlow.length === 0) {
    for (const step of processSteps) {
      await routingModel.create({
        product_id: product.product_id,
        step_no: step.step_no,
        operation: step.operation,
        work_center: step.work_center,
        duration: step.duration,
        is_primary_path: true,
        description: `Process step for ${partDescription}`
      });
    }
    importResults.process_flows_created++;
  }
}

export const exportBOMToExcel = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeBlankSpecs = true, includeProcessFlow = true } = req.query;

    // Get BOM data
    const bomData = await bomModel.findByProductIdWithSubAssemblies(productId);
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Prepare data for Excel export
    const excelData = [];

    for (const bomItem of bomData) {
      const row = {
        'Part No': product.product_code,
        'Part Description': product.part_name,
        'Mode': 'NMR', // Default mode
        'Sub Assemblies': bomItem.sub_assembly_name,
        'Material Code': bomItem.material_code,
        'Material Name': bomItem.material_name,
        'Quantity': bomItem.quantity,
        'UOM': bomItem.uom_code || 'PCS',
        'Step Sequence': bomItem.step_sequence
      };

      // Add blank specifications if requested
      if (includeBlankSpecs === 'true') {
        const blankSpecs = await blankSpecModel.findByProductIdAndSubAssembly(
          productId, 
          bomItem.sub_assembly_name
        );
        
        if (blankSpecs.length > 0) {
          const spec = blankSpecs[0];
          row['W'] = spec.width_mm;
          row['L'] = spec.length_mm;
          row['t'] = spec.thickness_mm;
          row['Qty'] = spec.quantity;
          row['Weight of the blank'] = spec.blank_weight_kg;
          row['4x8 Sheet Consumpti (%)'] = spec.sheet_util_pct;
          row['4x8 Sheet Weight'] = spec.sheet_weight_kg;
          row['No of Pcs/She'] = spec.pcs_per_sheet;
          row['Total Blanks'] = spec.total_blanks;
        }
      }

      excelData.push(row);
    }

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOM Data');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bom-${product.product_code}-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', excelBuffer.length);

    return res.end(excelBuffer);

  } catch (error) {
    logger.error({ error, product_id: req.params.productId }, 'Failed to export BOM to Excel');
    return res.status(500).json({ error: 'Failed to export BOM data' });
  }
};

export const validateImportData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const validationResults = {
      total_rows: data.length,
      valid_rows: 0,
      invalid_rows: 0,
      errors: [],
      warnings: [],
      sample_data: data.slice(0, 3) // First 3 rows as sample
    };

    // Validate each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors = [];
      const rowWarnings = [];

      // Check required fields
      if (!row['Part No'] && !row['Part Number'] && !row['part_no']) {
        rowErrors.push('Part number is required');
      }

      if (!row['Part Description'] && !row['part_description']) {
        rowErrors.push('Part description is required');
      }

      // Check numeric fields
      const width = parseFloat(row['W'] || row['Width'] || row['width']);
      const length = parseFloat(row['L'] || row['Length'] || row['length']);
      const thickness = parseFloat(row['t'] || row['Thickness'] || row['thickness']);

      if (width <= 0) {
        rowWarnings.push('Width should be greater than 0');
      }

      if (length <= 0) {
        rowWarnings.push('Length should be greater than 0');
      }

      if (thickness <= 0) {
        rowWarnings.push('Thickness should be greater than 0');
      }

      if (rowErrors.length === 0) {
        validationResults.valid_rows++;
      } else {
        validationResults.invalid_rows++;
        validationResults.errors.push(`Row ${i + 2}: ${rowErrors.join(', ')}`);
      }

      if (rowWarnings.length > 0) {
        validationResults.warnings.push(`Row ${i + 2}: ${rowWarnings.join(', ')}`);
      }
    }

    logger.info({ 
      total_rows: data.length,
      valid_rows: validationResults.valid_rows,
      invalid_rows: validationResults.invalid_rows
    }, 'Import data validation completed');

    return res.json({
      success: true,
      data: validationResults
    });

  } catch (error) {
    logger.error({ error }, 'Failed to validate import data');
    return res.status(500).json({ error: 'Failed to validate import data' });
  }
};
