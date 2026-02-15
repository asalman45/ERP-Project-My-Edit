// src/services/bomService.js
// BOM Service for dual-BOM workflow (Production Recipe + Cutting BOM)

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Explode BOM for a product (Dual-Level: Production Recipe + Cutting BOM)
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to produce
 * @returns {Promise<Object>} - Exploded BOM with material requirements
 */
export async function explodeBOM(productId, quantity) {
  try {
    logger.info({ productId, quantity }, 'Starting BOM explosion');
    
    // 1. Get all BOM items for the product
    const bomQuery = await db.query(`
      SELECT 
        b.bom_id,
        b.product_id,
        b.item_type,
        b.reference_type,
        b.reference_id,
        b.material_id,
        b.item_name,
        b.quantity as quantity_per_unit,
        b.sub_assembly_name,
        b.step_sequence,
        b.is_critical,
        b.scrap_allowance_pct,
        b.operation_code,
        b.uom_id,
        m.material_code,
        m.name as material_name,
        m.material_type,
        m.unit_cost,
        u.code as uom_code
      FROM bom b
      LEFT JOIN material m ON b.material_id = m.material_id
      LEFT JOIN uom u ON b.uom_id = u.uom_id
      WHERE b.product_id = $1
      ORDER BY b.step_sequence NULLS LAST, b.sub_assembly_name
    `, [productId]);
    
    if (bomQuery.rows.length === 0) {
      throw new Error(`No BOM found for product ${productId}`);
    }
    
    const result = {
      product_id: productId,
      quantity_requested: quantity,
      cut_parts: [],
      bought_outs: [],
      consumables: [],
      sub_assemblies: [],
      total_material_cost: 0,
      explosion_timestamp: new Date()
    };
    
    // 2. Process each BOM item
    for (const item of bomQuery.rows) {
      const totalQty = item.quantity_per_unit * quantity;
      const scrapQty = totalQty * (item.scrap_allowance_pct || 0) / 100;
      const requiredQty = totalQty + scrapQty;
      const cost = (item.unit_cost || 0) * requiredQty;
      
      const baseItem = {
        bom_id: item.bom_id,
        item_name: item.item_name || item.material_name,
        material_id: item.material_id,
        material_code: item.material_code,
        material_name: item.material_name,
        quantity_per_unit: item.quantity_per_unit,
        total_quantity: totalQty,
        scrap_allowance_pct: item.scrap_allowance_pct || 0,
        scrap_quantity: scrapQty,
        required_quantity: requiredQty,
        unit_cost: item.unit_cost || 0,
        total_cost: cost,
        uom: item.uom_code,
        sub_assembly_name: item.sub_assembly_name,
        is_critical: item.is_critical,
        operation_code: item.operation_code
      };
      
      // 3. Handle CUT_PART items (link to blank_spec)
      if (item.item_type === 'CUT_PART' && item.reference_id) {
        const blankQuery = await db.query(`
          SELECT 
            blank_id,
            product_id,
            sub_assembly_name,
            width_mm,
            length_mm,
            thickness_mm,
            blank_weight_kg,
            pcs_per_sheet,
            sheet_util_pct as efficiency_pct,
            sheet_type,
            sheet_width_mm,
            sheet_length_mm,
            material_type,
            cutting_direction,
            scrap_pct
          FROM blank_spec
          WHERE blank_id = $1
        `, [item.reference_id]);
        
        if (blankQuery.rows.length > 0) {
          const blank = blankQuery.rows[0];
          const sheetsNeeded = Math.ceil(requiredQty / blank.pcs_per_sheet);
          const actualBlanksProduced = sheetsNeeded * blank.pcs_per_sheet;
          const extraBlanks = actualBlanksProduced - requiredQty;
          
          result.cut_parts.push({
            ...baseItem,
            blank_id: blank.blank_id,
            blank_dimensions: {
              width_mm: blank.width_mm,
              length_mm: blank.length_mm,
              thickness_mm: blank.thickness_mm
            },
            blank_weight_kg: blank.blank_weight_kg,
            material_type: blank.material_type,
            sheet_size: `${blank.sheet_width_mm}×${blank.sheet_length_mm}×${blank.thickness_mm}`,
            sheet_dimensions: {
              width_mm: blank.sheet_width_mm,
              length_mm: blank.sheet_length_mm,
              thickness_mm: blank.thickness_mm
            },
            pcs_per_sheet: blank.pcs_per_sheet,
            sheets_required: sheetsNeeded,
            actual_blanks_produced: actualBlanksProduced,
            extra_blanks: extraBlanks,
            efficiency_pct: blank.efficiency_pct,
            scrap_pct: blank.scrap_pct,
            cutting_direction: blank.cutting_direction,
            estimated_scrap_weight_kg: (sheetsNeeded * blank.blank_weight_kg * blank.pcs_per_sheet * (blank.scrap_pct || 0)) / 100
          });
          
          result.total_material_cost += cost;
        }
      }
      // 4. Handle BOUGHT_OUT items
      else if (item.item_type === 'BOUGHT_OUT') {
        result.bought_outs.push(baseItem);
        result.total_material_cost += cost;
      }
      // 5. Handle CONSUMABLE items
      else if (item.item_type === 'CONSUMABLE') {
        result.consumables.push(baseItem);
        result.total_material_cost += cost;
      }
      // 6. Handle SUB_ASSEMBLY items (recursive BOM)
      else if (item.item_type === 'SUB_ASSEMBLY' && item.reference_id) {
        const subAssemblyBOM = await explodeBOM(item.reference_id, requiredQty);
        result.sub_assemblies.push({
          ...baseItem,
          sub_assembly_product_id: item.reference_id,
          sub_assembly_bom: subAssemblyBOM
        });
        result.total_material_cost += subAssemblyBOM.total_material_cost;
      }
    }
    
    // 7. Calculate summary statistics
    result.summary = {
      total_cut_parts: result.cut_parts.length,
      total_sheets_required: result.cut_parts.reduce((sum, item) => sum + item.sheets_required, 0),
      total_bought_outs: result.bought_outs.length,
      total_consumables: result.consumables.length,
      total_material_cost: result.total_material_cost,
      critical_items: [
        ...result.cut_parts,
        ...result.bought_outs,
        ...result.consumables
      ].filter(item => item.is_critical).length
    };
    
    logger.info({ 
      productId, 
      quantity, 
      totalSheets: result.summary.total_sheets_required,
      totalCost: result.total_material_cost
    }, 'BOM explosion completed');
    
    return result;
    
  } catch (error) {
    logger.error({ error, productId, quantity }, 'Error exploding BOM');
    throw error;
  }
}

/**
 * Get production recipe BOM for a product
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Array of BOM items with complete details
 */
export async function getProductionRecipeBOM(productId) {
  try {
    // Use a simpler query to avoid type conflicts
    const query = await db.query(`
      SELECT 
        b.*,
        m.material_code,
        m.name as material_name,
        m.material_type,
        m.unit_cost,
        u.code as uom_code,
        u.name as uom_name,
        -- Blank specification details for cut parts
        bs.blank_id,
        bs.sub_assembly_name as blank_name,
        bs.width_mm,
        bs.length_mm,
        bs.thickness_mm,
        bs.blank_weight_kg,
        bs.pcs_per_sheet,
        bs.sheet_util_pct,
        bs.sheet_weight_kg,
        bs.total_blanks,
        bs.consumption_pct,
        bs.material_density,
        bs.sheet_type
      FROM bom b
      LEFT JOIN material m ON b.material_id = m.material_id
      LEFT JOIN uom u ON b.uom_id = u.uom_id
      LEFT JOIN blank_spec bs ON b.reference_id = bs.blank_id AND b.item_type = 'CUT_PART'
      WHERE b.product_id = $1
      ORDER BY b.step_sequence NULLS LAST, b.sub_assembly_name
    `, [productId]);
    
    return query.rows;
  } catch (error) {
    logger.error({ error, productId }, 'Error fetching production recipe BOM');
    throw error;
  }
}

/**
 * Create or update BOM item
 * @param {Object} bomItem - BOM item data
 * @returns {Promise<Object>} - Created/updated BOM item
 */
export async function createOrUpdateBOMItem(bomItem) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      bom_id,
      product_id,
      item_type,
      reference_type,
      reference_id,
      material_id,
      item_name,
      quantity,
      sub_assembly_name,
      step_sequence,
      is_optional = false,  // Default to false
      is_critical = false,  // Default to false
      scrap_allowance_pct = 0,  // Default to 0
      operation_code,
      bom_version = 'v1.0',  // Default version
      uom_id
    } = bomItem;
    
    let result;
    
    if (bom_id) {
      // Update existing
      result = await client.query(`
        UPDATE bom SET
          item_type = $1,
          reference_type = $2,
          reference_id = $3,
          material_id = $4,
          item_name = $5,
          quantity = $6,
          sub_assembly_name = $7,
          step_sequence = $8,
          is_optional = $9,
          is_critical = $10,
          scrap_allowance_pct = $11,
          operation_code = $12,
          bom_version = $13,
          uom_id = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE bom_id = $15
        RETURNING *
      `, [
        item_type, reference_type, reference_id, material_id, item_name,
        quantity, sub_assembly_name, step_sequence, is_optional, is_critical,
        scrap_allowance_pct, operation_code, bom_version, uom_id, bom_id
      ]);
    } else {
      // Create new (with UUID generation)
      result = await client.query(`
        INSERT INTO bom (
          bom_id, product_id, item_type, reference_type, reference_id, material_id,
          item_name, quantity, sub_assembly_name, step_sequence, is_optional,
          is_critical, scrap_allowance_pct, operation_code, bom_version, uom_id,
          created_at, updated_at
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        product_id, item_type, reference_type, reference_id, material_id,
        item_name, quantity, sub_assembly_name, step_sequence, is_optional,
        is_critical, scrap_allowance_pct, operation_code, bom_version, uom_id
      ]);
    }
    
    await client.query('COMMIT');
    
    logger.info({ bomId: result.rows[0].bom_id, productId: product_id }, 'BOM item saved');
    
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, bomItem }, 'Error saving BOM item');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Link a cut part BOM item to a blank_spec
 * @param {string} bomId - BOM item ID
 * @param {string} blankSpecId - Blank spec ID
 * @returns {Promise<Object>} - Updated BOM item
 */
export async function linkCutPartToBlankSpec(bomId, blankSpecId) {
  try {
    const result = await db.query(`
      UPDATE bom SET
        item_type = 'CUT_PART',
        reference_type = 'blank_spec',
        reference_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE bom_id = $2
      RETURNING *
    `, [blankSpecId, bomId]);
    
    if (result.rows.length === 0) {
      throw new Error(`BOM item ${bomId} not found`);
    }
    
    logger.info({ bomId, blankSpecId }, 'Cut part linked to blank spec');
    
    return result.rows[0];
  } catch (error) {
    logger.error({ error, bomId, blankSpecId }, 'Error linking cut part to blank spec');
    throw error;
  }
}

/**
 * Delete BOM item
 * @param {string} bomId - BOM item ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteBOMItem(bomId) {
  try {
    const result = await db.query(`
      DELETE FROM bom WHERE bom_id = $1
      RETURNING bom_id
    `, [bomId]);
    
    if (result.rows.length === 0) {
      throw new Error(`BOM item ${bomId} not found`);
    }
    
    logger.info({ bomId }, 'BOM item deleted');
    
    return true;
  } catch (error) {
    logger.error({ error, bomId }, 'Error deleting BOM item');
    throw error;
  }
}

/**
 * Log BOM explosion for audit trail
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity
 * @param {Object} explosionData - BOM explosion result
 * @param {string} explodedBy - User who ran the explosion
 * @returns {Promise<string>} - Explosion log ID
 */
export async function logBOMExplosion(productId, quantity, explosionData, explodedBy) {
  try {
    const result = await db.query(`
      INSERT INTO bom_explosion_log (
        product_id,
        quantity,
        explosion_data,
        total_sheet_count,
        total_bought_items_count,
        total_consumables_count,
        total_material_cost,
        exploded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING explosion_id
    `, [
      productId,
      quantity,
      JSON.stringify(explosionData),
      explosionData.summary?.total_sheets_required || 0,
      explosionData.bought_outs?.length || 0,
      explosionData.consumables?.length || 0,
      explosionData.total_material_cost || 0,
      explodedBy
    ]);
    
    logger.info({ explosionId: result.rows[0].explosion_id, productId }, 'BOM explosion logged');
    
    return result.rows[0].explosion_id;
  } catch (error) {
    logger.error({ error, productId }, 'Error logging BOM explosion');
    throw error;
  }
}

export default {
  explodeBOM,
  getProductionRecipeBOM,
  createOrUpdateBOMItem,
  linkCutPartToBlankSpec,
  deleteBOMItem,
  logBOMExplosion
};

