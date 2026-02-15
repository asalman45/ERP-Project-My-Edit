// src/models/raw_material.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT rm.*, u.code as uom_code, u.name as uom_name, m.material_id
     FROM raw_material rm
     LEFT JOIN uom u ON rm.uom_id = u.uom_id
     LEFT JOIN material m ON rm.material_code = m.material_code
     ORDER BY rm.raw_material_id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (rawMaterialId) => {
  const res = await db.query(
    `SELECT rm.*, u.code as uom_code, u.name as uom_name, m.material_id
     FROM raw_material rm
     LEFT JOIN uom u ON rm.uom_id = u.uom_id
     LEFT JOIN material m ON rm.material_code = m.material_code
     WHERE rm.raw_material_id = $1`,
    [rawMaterialId]
  );
  return res.rows[0];
};

export const findByMaterialCode = async (materialCode) => {
  const res = await db.query(
    `SELECT rm.*, u.code as uom_code, u.name as uom_name, m.material_id
     FROM raw_material rm
     LEFT JOIN uom u ON rm.uom_id = u.uom_id
     LEFT JOIN material m ON rm.material_code = m.material_code
     WHERE rm.material_code = $1`,
    [materialCode]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    material_code, name, description, uom_id
  } = payload;
  
  try {
    // First, create the Material record with generated UUID
    const materialRes = await db.query(
      `INSERT INTO material (material_id, material_code, name, description, category, uom_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [material_code, name, description, 'RAW_MATERIAL', uom_id]
    );
    
    // Then, create the RawMaterial record with generated UUID
    const rawMaterialRes = await db.query(
      `INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [material_code, name, description, uom_id]
    );
    
    // Return the raw material with joined data
    const result = await db.query(
      `SELECT rm.*, u.code as uom_code, u.name as uom_name, m.material_id
       FROM raw_material rm
       LEFT JOIN uom u ON rm.uom_id = u.uom_id
       LEFT JOIN material m ON rm.material_code = m.material_code
       WHERE rm.raw_material_id = $1`,
      [rawMaterialRes.rows[0].raw_material_id]
    );
    
    return result.rows[0];
    
  } catch (error) {
    console.error('Error creating raw material:', error);
    throw error;
  }
};

export const update = async (rawMaterialId, payload) => {
  // Get the material_code first
  const existing = await findById(rawMaterialId);
  if (!existing) return null;
  
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update the Material record
    const materialKeys = Object.keys(payload).filter(key => 
      ['name', 'description', 'uom_id'].includes(key)
    );
    
    if (materialKeys.length > 0) {
      const materialSetParts = materialKeys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
      const materialValues = [existing.material_code, ...materialKeys.map(k => payload[k])];
      
      await client.query(
        `UPDATE material SET ${materialSetParts} WHERE material_code = $1`,
        materialValues
      );
    }
    
    // Update the RawMaterial record
    const rawMaterialKeys = Object.keys(payload).filter(key => 
      ['name', 'description', 'uom_id'].includes(key)
    );
    
    if (rawMaterialKeys.length > 0) {
      const rawMaterialSetParts = rawMaterialKeys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
      const rawMaterialValues = [rawMaterialId, ...rawMaterialKeys.map(k => payload[k])];
      
      await client.query(
        `UPDATE raw_material SET ${rawMaterialSetParts} WHERE raw_material_id = $1`,
        rawMaterialValues
      );
    }
    
    await client.query('COMMIT');
    
    // Return updated record
    return await findById(rawMaterialId);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Check for references before deletion
export const checkReferences = async (materialCode) => {
  const references = {
    inventory: 0,
    bom: 0,
    purchaseOrders: 0,
    purchaseRequisitions: 0,
    wastages: 0,
    scrapInventory: 0,
    productionMaterialUsages: 0,
    materialReservations: 0,
    materialConsumptions: 0,
    invoiceItems: 0,
    procurementRequests: 0,
    goodsReceiptItems: 0,
    stockLedgers: 0
  };
  
  const issues = [];
  
  try {
    // Get material_id from material_code
    const materialResult = await db.query(
      'SELECT material_id FROM material WHERE material_code = $1',
      [materialCode]
    );
    
    if (materialResult.rows.length === 0) {
      return { hasReferences: false, references, issues: [] };
    }
    
    const materialId = materialResult.rows[0].material_id;
    
    // Check inventory
    const invResult = await db.query(
      'SELECT COUNT(*) as count FROM inventory WHERE material_id = $1',
      [materialId]
    );
    references.inventory = parseInt(invResult.rows[0].count);
    if (references.inventory > 0) {
      issues.push(`${references.inventory} inventory record(s)`);
    }
    
    // Check BOM items
    const bomResult = await db.query(
      'SELECT COUNT(*) as count FROM bom WHERE material_id = $1',
      [materialId]
    );
    references.bom = parseInt(bomResult.rows[0].count);
    if (references.bom > 0) {
      issues.push(`${references.bom} BOM item(s)`);
    }
    
    // Check purchase order items
    const poResult = await db.query(
      'SELECT COUNT(*) as count FROM purchase_order_item WHERE material_id = $1',
      [materialId]
    );
    references.purchaseOrders = parseInt(poResult.rows[0].count);
    if (references.purchaseOrders > 0) {
      issues.push(`${references.purchaseOrders} purchase order item(s)`);
    }
    
    // Check purchase requisition items
    const prResult = await db.query(
      'SELECT COUNT(*) as count FROM purchase_requisition_item WHERE material_id = $1',
      [materialId]
    );
    references.purchaseRequisitions = parseInt(prResult.rows[0].count);
    if (references.purchaseRequisitions > 0) {
      issues.push(`${references.purchaseRequisitions} purchase requisition item(s)`);
    }
    
    // Check wastages
    const wastageResult = await db.query(
      'SELECT COUNT(*) as count FROM wastage WHERE material_id = $1',
      [materialId]
    );
    references.wastages = parseInt(wastageResult.rows[0].count);
    if (references.wastages > 0) {
      issues.push(`${references.wastages} wastage record(s)`);
    }
    
    // Check scrap inventory
    const scrapResult = await db.query(
      'SELECT COUNT(*) as count FROM scrap_inventory WHERE material_id = $1',
      [materialId]
    );
    references.scrapInventory = parseInt(scrapResult.rows[0].count);
    if (references.scrapInventory > 0) {
      issues.push(`${references.scrapInventory} scrap inventory record(s)`);
    }
    
    // Check production material usages
    const prodResult = await db.query(
      'SELECT COUNT(*) as count FROM production_material_usage WHERE material_id = $1',
      [materialId]
    );
    references.productionMaterialUsages = parseInt(prodResult.rows[0].count);
    if (references.productionMaterialUsages > 0) {
      issues.push(`${references.productionMaterialUsages} production material usage record(s)`);
    }
    
    // Check material reservations
    const resResult = await db.query(
      'SELECT COUNT(*) as count FROM material_reservation WHERE material_id = $1',
      [materialId]
    );
    references.materialReservations = parseInt(resResult.rows[0].count);
    if (references.materialReservations > 0) {
      issues.push(`${references.materialReservations} material reservation(s)`);
    }
    
    // Check material consumptions
    const consResult = await db.query(
      'SELECT COUNT(*) as count FROM material_consumption WHERE material_id = $1',
      [materialId]
    );
    references.materialConsumptions = parseInt(consResult.rows[0].count);
    if (references.materialConsumptions > 0) {
      issues.push(`${references.materialConsumptions} material consumption record(s)`);
    }
    
    // Check invoice items
    const invItemResult = await db.query(
      'SELECT COUNT(*) as count FROM invoice_item WHERE material_id = $1',
      [materialId]
    );
    references.invoiceItems = parseInt(invItemResult.rows[0].count);
    if (references.invoiceItems > 0) {
      issues.push(`${references.invoiceItems} invoice item(s)`);
    }
    
    // Check procurement requests
    const procResult = await db.query(
      'SELECT COUNT(*) as count FROM procurement_request WHERE material_id = $1',
      [materialId]
    );
    references.procurementRequests = parseInt(procResult.rows[0].count);
    if (references.procurementRequests > 0) {
      issues.push(`${references.procurementRequests} procurement request(s)`);
    }
    
    // Check goods receipt items
    const grResult = await db.query(
      'SELECT COUNT(*) as count FROM goods_receipt_item WHERE material_id = $1',
      [materialId]
    );
    references.goodsReceiptItems = parseInt(grResult.rows[0].count);
    if (references.goodsReceiptItems > 0) {
      issues.push(`${references.goodsReceiptItems} goods receipt item(s)`);
    }
    
    // Check stock ledgers (if table exists)
    try {
      const ledgerResult = await db.query(
        'SELECT COUNT(*) as count FROM stock_ledger WHERE material_id = $1',
        [materialId]
      );
      references.stockLedgers = parseInt(ledgerResult.rows[0].count);
      if (references.stockLedgers > 0) {
        issues.push(`${references.stockLedgers} stock ledger record(s)`);
      }
    } catch (e) {
      // Table might not exist, ignore
    }
    
    const hasReferences = issues.length > 0;
    
    return { hasReferences, references, issues };
    
  } catch (error) {
    // If we can't check references, assume there are references
    return { hasReferences: true, references, issues: ['Unable to check all references'] };
  }
};

export const remove = async (rawMaterialId) => {
  // Get the material_code first
  const existing = await findById(rawMaterialId);
  if (!existing) return false;
  
  // Check for references before attempting deletion
  const refCheck = await checkReferences(existing.material_code);
  if (refCheck.hasReferences) {
    const error = new Error('Material has active references');
    error.code = '23503';
    error.references = refCheck.references;
    error.issues = refCheck.issues;
    throw error;
  }
  
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete the Material record first - this will CASCADE delete the raw_material automatically
    // due to the foreign key constraint: raw_material.material_code -> material.material_code ON DELETE CASCADE
    const materialResult = await client.query(
      'DELETE FROM material WHERE material_code = $1 RETURNING material_id',
      [existing.material_code]
    );
    
    // Verify raw_material was cascade deleted
    const rawMatCheck = await client.query(
      'SELECT COUNT(*) as count FROM raw_material WHERE raw_material_id = $1',
      [rawMaterialId]
    );
    
    if (rawMatCheck.rows[0].count > 0) {
      // If cascade didn't work (shouldn't happen), manually delete
      await client.query('DELETE FROM raw_material WHERE raw_material_id = $1', [rawMaterialId]);
    }
    
    await client.query('COMMIT');
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
