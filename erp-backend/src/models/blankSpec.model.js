// src/models/blankSpec.model.js
import db from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export const findByProductId = async (productId) => {
  const res = await db.query(
    `SELECT bs.*, p.part_name, p.product_code
     FROM blank_spec bs
     JOIN product p ON bs.product_id = p.product_id
     WHERE bs.product_id = $1
     ORDER BY bs.sub_assembly_name, bs.created_at`,
    [productId]
  );
  return res.rows;
};

export const findByProductIdAndSubAssembly = async (productId, subAssemblyName) => {
  const res = await db.query(
    `SELECT bs.*, p.part_name, p.product_code
     FROM blank_spec bs
     JOIN product p ON bs.product_id = p.product_id
     WHERE bs.product_id = $1 AND bs.sub_assembly_name = $2
     ORDER BY bs.created_at`,
    [productId, subAssemblyName]
  );
  return res.rows;
};

export const create = async (payload) => {
  const {
    product_id,
    sub_assembly_name,
    width_mm,
    length_mm,
    thickness_mm,
    quantity,
    blank_weight_kg,
    pcs_per_sheet,
    sheet_util_pct,
    sheet_type,
    sheet_weight_kg,
    total_blanks,
    consumption_pct,
    material_density,
    created_by
  } = payload;

  const blank_id = uuidv4();
  const res = await db.query(
    `INSERT INTO blank_spec (
      blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity,
      blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg,
      total_blanks, consumption_pct, material_density, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
     RETURNING *`,
    [
      blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity,
      blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg,
      total_blanks, consumption_pct, material_density, created_by
    ]
  );
  return res.rows[0];
};

export const update = async (blankId, payload) => {
  const {
    sub_assembly_name,
    width_mm,
    length_mm,
    thickness_mm,
    quantity,
    blank_weight_kg,
    pcs_per_sheet,
    sheet_util_pct,
    sheet_type,
    sheet_weight_kg,
    total_blanks,
    consumption_pct,
    material_density
  } = payload;

  const res = await db.query(
    `UPDATE blank_spec SET 
      sub_assembly_name = $2, width_mm = $3, length_mm = $4, thickness_mm = $5, quantity = $6,
      blank_weight_kg = $7, pcs_per_sheet = $8, sheet_util_pct = $9, sheet_type = $10, 
      sheet_weight_kg = $11, total_blanks = $12, consumption_pct = $13, material_density = $14,
      updated_at = NOW()
     WHERE blank_id = $1
     RETURNING *`,
    [
      blankId, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity,
      blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg,
      total_blanks, consumption_pct, material_density
    ]
  );
  return res.rows[0];
};

export const remove = async (blankId) => {
  await db.query('DELETE FROM blank_spec WHERE blank_id = $1', [blankId]);
  return true;
};

export const calculateSheetUtilization = async (productId, sheetType = '4x8') => {
  // Get all blank specifications for the product
  const blankSpecs = await findByProductId(productId);
  
  // Standard sheet sizes (in mm)
  const sheetSizes = {
    '4x8': { width: 1219, length: 2438 }, // 4x8 feet
    '5x10': { width: 1524, length: 3048 }, // 5x10 feet
    '6x12': { width: 1829, length: 3658 }  // 6x12 feet
  };

  const sheetSize = sheetSizes[sheetType] || sheetSizes['4x8'];
  const results = [];

  for (const spec of blankSpecs) {
    // Calculate pieces per sheet
    const piecesPerSheet = Math.floor((sheetSize.width / spec.width_mm) * (sheetSize.length / spec.length_mm));
    
    // Calculate utilization percentage
    const blankArea = spec.width_mm * spec.length_mm;
    const sheetArea = sheetSize.width * sheetSize.length;
    const utilizationPercent = ((blankArea * piecesPerSheet) / sheetArea) * 100;
    
    // Calculate total blanks needed
    const totalBlanks = spec.quantity * piecesPerSheet;

    results.push({
      blank_id: spec.blank_id,
      sub_assembly_name: spec.sub_assembly_name,
      width_mm: spec.width_mm,
      length_mm: spec.length_mm,
      thickness_mm: spec.thickness_mm,
      quantity: spec.quantity,
      pieces_per_sheet: piecesPerSheet,
      utilization_percent: Math.round(utilizationPercent * 100) / 100,
      total_blanks: totalBlanks,
      sheet_type: sheetType,
      sheet_dimensions: sheetSize
    });
  }

  return results;
};

export const findById = async (blankId) => {
  const res = await db.query(
    `SELECT bs.*, p.part_name, p.product_code
     FROM blank_spec bs
     JOIN product p ON bs.product_id = p.product_id
     WHERE bs.blank_id = $1`,
    [blankId]
  );
  return res.rows[0];
};

export const removeByProductIdAndSubAssembly = async (productId, subAssemblyName) => {
  console.log('🔍 Attempting to delete blank spec sub-assembly:', { productId, subAssemblyName });
  
  // First, let's check what sub-assemblies exist for this product in blank_spec
  const checkRes = await db.query(
    'SELECT DISTINCT sub_assembly_name FROM blank_spec WHERE product_id = $1',
    [productId]
  );
  console.log('📋 Existing blank spec sub-assemblies for product:', checkRes.rows);
  
  // Try exact match first
  let res = await db.query(
    'DELETE FROM blank_spec WHERE product_id = $1 AND sub_assembly_name = $2',
    [productId, subAssemblyName]
  );
  
  console.log('🗑️ Exact match delete result:', { rowCount: res.rowCount, subAssemblyName });
  
  // If no exact match, try case-insensitive match
  if (res.rowCount === 0) {
    console.log('🔄 Trying case-insensitive match...');
    res = await db.query(
      'DELETE FROM blank_spec WHERE product_id = $1 AND LOWER(sub_assembly_name) = LOWER($2)',
      [productId, subAssemblyName]
    );
    console.log('🗑️ Case-insensitive delete result:', { rowCount: res.rowCount, subAssemblyName });
  }
  
  // If still no match, try trimmed match
  if (res.rowCount === 0) {
    console.log('🔄 Trying trimmed match...');
    res = await db.query(
      'DELETE FROM blank_spec WHERE product_id = $1 AND TRIM(sub_assembly_name) = TRIM($2)',
      [productId, subAssemblyName]
    );
    console.log('🗑️ Trimmed delete result:', { rowCount: res.rowCount, subAssemblyName });
  }
  
  return res.rowCount > 0;
};
