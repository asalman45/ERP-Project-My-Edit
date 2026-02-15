// src/models/scrapInventory.model.js
import db from '../utils/db.js';

export const findAll = async (filters = {}) => {
  let query = `
    SELECT si.*, 
           l.name as location_name, 
           COALESCE(m.material_code, bom_m.material_code) as material_code, 
           COALESCE(m.name, bom_m.name, si.material_name, 'HRC Sheet') as material_name, 
           STRING_AGG(DISTINCT bs.sub_assembly_name, ', ' ORDER BY bs.sub_assembly_name) as sub_assembly_names,
           COUNT(DISTINCT bs.sub_assembly_name) as sub_assembly_count,
           wo.wo_no as work_order_no,
           wo.wo_id as work_order_id
    FROM scrap_inventory si
    LEFT JOIN location l ON si.location_id = l.location_id
    LEFT JOIN material m ON si.material_id = m.material_id
    LEFT JOIN work_order wo ON si.reference = wo.wo_id
    LEFT JOIN scrap_origin so ON si.scrap_id = so.scrap_id
    LEFT JOIN blank_spec bs ON so.product_id = bs.product_id
    LEFT JOIN bom ON bs.product_id = bom.product_id 
                  AND (bs.sub_assembly_name = bom.sub_assembly_name 
                       OR bs.sub_assembly_name LIKE bom.sub_assembly_name || '%'
                       OR bom.sub_assembly_name LIKE bs.sub_assembly_name || '%')
    LEFT JOIN material bom_m ON bom.material_id = bom_m.material_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 0;

  if (filters.status) {
    paramCount++;
    query += ` AND si.status = $${paramCount}`;
    params.push(filters.status);
  }

  if (filters.location_id) {
    paramCount++;
    query += ` AND si.location_id = $${paramCount}`;
    params.push(filters.location_id);
  }

  if (filters.material_id) {
    paramCount++;
    query += ` AND si.material_id = $${paramCount}`;
    params.push(filters.material_id);
  }

  if (filters.min_width) {
    paramCount++;
    query += ` AND si.width_mm >= $${paramCount}`;
    params.push(filters.min_width);
  }

  if (filters.min_length) {
    paramCount++;
    query += ` AND si.length_mm >= $${paramCount}`;
    params.push(filters.min_length);
  }

  if (filters.min_thickness) {
    paramCount++;
    query += ` AND si.thickness_mm >= $${paramCount}`;
    params.push(filters.min_thickness);
  }

  query += ` GROUP BY si.scrap_id, l.name, m.material_code, bom_m.material_code, m.name, bom_m.name, si.material_name, wo.wo_no, wo.wo_id`;
  query += ` ORDER BY si.created_at DESC`;

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }

  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(filters.offset);
  }

  const res = await db.query(query, params);
  return res.rows;
};

export const findById = async (scrapId) => {
  const res = await db.query(
    `SELECT si.*, 
            l.name as location_name, 
            COALESCE(m.material_code, bom_m.material_code) as material_code, 
            COALESCE(m.name, bom_m.name, si.material_name, 'HRC Sheet') as material_name, 
            STRING_AGG(DISTINCT bs.sub_assembly_name, ', ' ORDER BY bs.sub_assembly_name) as sub_assembly_names,
            COUNT(DISTINCT bs.sub_assembly_name) as sub_assembly_count,
            wo.wo_no as work_order_no,
            wo.wo_id as work_order_id
     FROM scrap_inventory si
     LEFT JOIN location l ON si.location_id = l.location_id
     LEFT JOIN material m ON si.material_id = m.material_id
     LEFT JOIN work_order wo ON si.reference = wo.wo_id
     LEFT JOIN scrap_origin so ON si.scrap_id = so.scrap_id
     LEFT JOIN blank_spec bs ON so.product_id = bs.product_id
     LEFT JOIN bom ON bs.product_id = bom.product_id 
                   AND (bs.sub_assembly_name = bom.sub_assembly_name 
                        OR bs.sub_assembly_name LIKE bom.sub_assembly_name || '%'
                        OR bom.sub_assembly_name LIKE bs.sub_assembly_name || '%')
     LEFT JOIN material bom_m ON bom.material_id = bom_m.material_id
     WHERE si.scrap_id = $1
     GROUP BY si.scrap_id, l.name, m.material_code, bom_m.material_code, m.name, bom_m.name, si.material_name, wo.wo_no, wo.wo_id`,
    [scrapId]
  );
  return res.rows[0];
};

export const findByProductId = async (productId) => {
  const res = await db.query(
    `SELECT si.*, l.name as location_name, 
            COALESCE(m.material_code, bom_m.material_code) as material_code, 
            COALESCE(m.name, bom_m.name, si.material_name) as material_name, 
            bs.sub_assembly_name
     FROM scrap_inventory si
     LEFT JOIN location l ON si.location_id = l.location_id
     LEFT JOIN material m ON si.material_id = m.material_id
     LEFT JOIN scrap_origin so ON si.scrap_id = so.scrap_id
     LEFT JOIN blank_spec bs ON COALESCE(si.blank_id, so.blank_id) = bs.blank_id
     LEFT JOIN bom ON bs.product_id = bom.product_id AND bs.sub_assembly_name = bom.sub_assembly_name
     LEFT JOIN material bom_m ON bom.material_id = bom_m.material_id
     WHERE bs.product_id = $1 OR si.material_id IN (
       SELECT DISTINCT material_id FROM bom WHERE product_id = $1
     )
     ORDER BY si.created_at DESC`,
    [productId]
  );
  return res.rows;
};

// Restore scrap to inventory
export const restoreToInventory = async (scrapId, restoreData) => {
  const { quantity_to_restore, reason, restored_by, material_id } = restoreData;
  
  // Get current scrap record
  const scrapRes = await db.query('SELECT * FROM scrap_inventory WHERE scrap_id = $1', [scrapId]);
  if (scrapRes.rows.length === 0) {
    throw new Error('Scrap record not found');
  }
  
  const scrap = scrapRes.rows[0];
  
  // Use provided material_id or fallback to scrap's material_id
  const sourceMaterialId = material_id || scrap.material_id;
  
  if (!sourceMaterialId) {
    throw new Error('Material ID is required for restoration');
  }
  
  // Get the source material details
  const materialRes = await db.query(
    `SELECT material_id, material_code, name, category, uom_id 
     FROM material 
     WHERE material_id = $1`,
    [sourceMaterialId]
  );
  
  if (materialRes.rows.length === 0) {
    throw new Error('Source material not found');
  }
  
  const sourceMaterial = materialRes.rows[0];
  
  // Create material name with "_leftover" suffix
  const leftoverMaterialName = `${sourceMaterial.name}_leftover`;
  
  // Convert quantity from kg to grams (multiply by 1000)
  const quantityInGrams = quantity_to_restore * 1000;
  
  if (quantity_to_restore > scrap.weight_kg) {
    throw new Error('Cannot restore more than available scrap quantity');
  }
  
  // Get or create GR (Grams) UOM
  let gramsUomId;
  const gramsUomRes = await db.query(
    `SELECT uom_id FROM uom WHERE code = 'GR' OR code = 'G' OR code = 'GRAM' LIMIT 1`
  );
  
  if (gramsUomRes.rows.length > 0) {
    gramsUomId = gramsUomRes.rows[0].uom_id;
  } else {
    // Create GR UOM if it doesn't exist
    const newUomRes = await db.query(
      `INSERT INTO uom (uom_id, code, name)
       VALUES (gen_random_uuid(), 'GR', 'Grams')
       RETURNING uom_id`
    );
    gramsUomId = newUomRes.rows[0].uom_id;
  }
  
  // Get or create MAIN-STORE location (same as used for all inventory)
  const MAIN_STORE_CODE = 'MAIN-STORE';
  let mainStoreLocationId;
  const locationRes = await db.query(
    `SELECT location_id FROM location WHERE code = $1 LIMIT 1`,
    [MAIN_STORE_CODE]
  );
  
  if (locationRes.rows.length > 0) {
    mainStoreLocationId = locationRes.rows[0].location_id;
  } else {
    // Create MAIN-STORE location if it doesn't exist
    const newLocationRes = await db.query(
      `INSERT INTO location (location_id, code, name, type)
       VALUES (gen_random_uuid(), $1, 'Main Store', 'STORAGE')
       RETURNING location_id`,
      [MAIN_STORE_CODE]
    );
    mainStoreLocationId = newLocationRes.rows[0].location_id;
  }
  
  // Start transaction
  await db.query('BEGIN');
  
  try {
    // Update scrap inventory - reduce quantity or mark as consumed
    if (quantity_to_restore >= scrap.weight_kg) {
      await db.query(
        `UPDATE scrap_inventory 
         SET status = 'RESTORED'
         WHERE scrap_id = $1`,
        [scrapId]
      );
    } else {
      await db.query(
        `UPDATE scrap_inventory 
         SET weight_kg = weight_kg - $2
         WHERE scrap_id = $1`,
        [scrapId, quantity_to_restore]
      );
    }
    
    // Check if leftover material already exists
    const existingLeftoverMaterial = await db.query(
      `SELECT material_id FROM material WHERE name = $1 LIMIT 1`,
      [leftoverMaterialName]
    );
    
    let leftoverMaterialId;
    
    if (existingLeftoverMaterial.rows.length > 0) {
      // Use existing leftover material
      leftoverMaterialId = existingLeftoverMaterial.rows[0].material_id;
    } else {
      // Create new material with "_leftover" suffix
      const leftoverMaterialCode = `${sourceMaterial.material_code}_LEFTOVER_${Date.now()}`;
      const newMaterialRes = await db.query(
        `INSERT INTO material (material_id, material_code, name, category, uom_id)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         RETURNING material_id`,
        [leftoverMaterialCode, leftoverMaterialName, sourceMaterial.category, gramsUomId]
      );
      leftoverMaterialId = newMaterialRes.rows[0].material_id;
    }
    
    // Check if inventory already exists for this leftover material at MAIN-STORE location with GR UOM
    const existingInventory = await db.query(
      `SELECT inventory_id, quantity 
       FROM inventory 
       WHERE material_id = $1 
         AND location_id = $2 
         AND uom_id = $3
         AND status = 'AVAILABLE' 
       LIMIT 1`,
      [leftoverMaterialId, mainStoreLocationId, gramsUomId]
    );
    
    if (existingInventory.rows.length > 0) {
      // UPDATE: Leftover material already exists at MAIN-STORE - merge quantities (in grams)
      const existing = existingInventory.rows[0];
      const newQuantity = existing.quantity + quantityInGrams; // Add grams to grams
      
      await db.query(
        `UPDATE inventory 
         SET quantity = $1, 
             updated_at = NOW()
         WHERE inventory_id = $2`,
        [newQuantity, existing.inventory_id]
      );
    } else {
      // INSERT: Leftover material doesn't exist at MAIN-STORE - create new record
      await db.query(
        `INSERT INTO inventory (inventory_id, material_id, quantity, location_id, uom_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
        [
          leftoverMaterialId,    // Use leftover material (with "_leftover" suffix)
          quantityInGrams,       // Quantity in GRAMS (converted from kg)
          mainStoreLocationId,    // MAIN-STORE location (same as all inventory)
          gramsUomId            // UOM = GR (Grams)
        ]
      );
    }
    
    // Create restoration audit record
    await db.query(
      `INSERT INTO scrap_movement (
        scrap_id, movement_type, quantity, reason, reference, created_by, created_at
      ) VALUES ($1, 'RESTORE', $2, $3, $4, $5, NOW())`,
      [scrapId, quantity_to_restore, reason, 'Restored to inventory (in grams)', restored_by || 'system']
    );
    
    await db.query('COMMIT');
    
    return { 
      success: true, 
      restored_quantity: quantity_to_restore,
      restored_quantity_grams: quantityInGrams,
      leftover_material_id: leftoverMaterialId,
      leftover_material_name: leftoverMaterialName,
      location_code: MAIN_STORE_CODE,
      uom: 'GR'
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

// Reuse scrap in production
export const reuseInProduction = async (scrapId, reuseData) => {
  const { 
    production_order_id, 
    product_id, 
    quantity_to_reuse, 
    reason, 
    reused_by 
  } = reuseData;
  
  // Get current scrap record
  const scrapRes = await db.query('SELECT * FROM scrap_inventory WHERE scrap_id = $1', [scrapId]);
  if (scrapRes.rows.length === 0) {
    throw new Error('Scrap record not found');
  }
  
  const scrap = scrapRes.rows[0];
  
  if (quantity_to_reuse > scrap.weight_kg) {
    throw new Error('Cannot reuse more than available scrap quantity');
  }
  
  // Start transaction
  await db.query('BEGIN');
  
  try {
    // Update scrap inventory - reduce quantity or mark as consumed
    if (quantity_to_reuse >= scrap.weight_kg) {
      // Fully consumed
      await db.query(
        `UPDATE scrap_inventory 
         SET status = 'REUSED', updated_at = NOW(), updated_by = $2
         WHERE scrap_id = $1`,
        [scrapId, reused_by]
      );
    } else {
      // Partially consumed
      await db.query(
        `UPDATE scrap_inventory 
         SET weight_kg = weight_kg - $2, updated_at = NOW(), updated_by = $3
         WHERE scrap_id = $1`,
        [scrapId, quantity_to_reuse, reused_by]
      );
    }
    
    // Create production consumption record for reused material
    await db.query(
      `INSERT INTO production_material_consumption (
        consumption_id, production_order_id, product_id, blank_spec_id,
        sub_assembly_name, material_id, planned_quantity, consumed_quantity,
        scrap_quantity, consumption_type, created_by, created_at, updated_at
      ) VALUES (gen_random_uuid(), $1, $2, NULL, 'SCRAP_REUSE', $3, $4, $4, 0, 'SCRAP', $5, NOW(), NOW())`,
      [production_order_id, product_id, scrap.material_id, quantity_to_reuse, reused_by]
    );
    
    // Create reuse audit record
    await db.query(
      `INSERT INTO scrap_movement (
        scrap_id, movement_type, quantity, reason, reference, created_by, created_at
      ) VALUES ($1, 'REUSE', $2, $3, $4, $5, NOW())`,
      [scrapId, quantity_to_reuse, reason, `Production Order: ${production_order_id}`, reused_by]
    );
    
    await db.query('COMMIT');
    
    return { success: true, reused_quantity: quantity_to_reuse };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

// Get scrap movement history
export const getScrapMovementHistory = async (scrapId) => {
  const res = await db.query(
    `SELECT sm.*, si.scrap_id, si.reference as scrap_reference
     FROM scrap_movement sm
     JOIN scrap_inventory si ON sm.scrap_id = si.scrap_id
     WHERE sm.scrap_id = $1
     ORDER BY sm.created_at DESC`,
    [scrapId]
  );
  return res.rows;
};

export const create = async (payload) => {
  const {
    blank_id,
    material_id,
    width_mm,
    length_mm,
    thickness_mm,
    weight_kg,
    location_id,
    status = 'AVAILABLE',
    created_by,
    reference,
    consumed_by_po
  } = payload;

  const res = await db.query(
    `INSERT INTO scrap_inventory (
      blank_id, material_id, width_mm, length_mm, thickness_mm, weight_kg,
      location_id, status, created_by, reference, consumed_by_po
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      blank_id, material_id, width_mm, length_mm, thickness_mm, weight_kg,
      location_id, status, created_by, reference, consumed_by_po
    ]
  );
  return res.rows[0];
};

export const update = async (scrapId, payload) => {
  const {
    width_mm,
    length_mm,
    thickness_mm,
    weight_kg,
    location_id,
    status,
    reference,
    consumed_by_po
  } = payload;

  const res = await db.query(
    `UPDATE scrap_inventory SET 
      width_mm = $2, length_mm = $3, thickness_mm = $4, weight_kg = $5,
      location_id = $6, status = $7, reference = $8, consumed_by_po = $9
     WHERE scrap_id = $1
     RETURNING *`,
    [scrapId, width_mm, length_mm, thickness_mm, weight_kg, location_id, status, reference, consumed_by_po]
  );
  return res.rows[0];
};

export const remove = async (scrapId) => {
  await db.query('DELETE FROM scrap_inventory WHERE scrap_id = $1', [scrapId]);
  return true;
};

export const findAvailableScrap = async (filters = {}) => {
  let query = `
    SELECT si.*, l.name as location_name, 
           COALESCE(m.material_code, bom_m.material_code) as material_code, 
           COALESCE(m.name, bom_m.name, si.material_name) as material_name,
           bs.sub_assembly_name
    FROM scrap_inventory si
    LEFT JOIN location l ON si.location_id = l.location_id
    LEFT JOIN material m ON si.material_id = m.material_id
    LEFT JOIN scrap_origin so ON si.scrap_id = so.scrap_id
    LEFT JOIN blank_spec bs ON COALESCE(si.blank_id, so.blank_id) = bs.blank_id
    LEFT JOIN bom ON bs.product_id = bom.product_id AND bs.sub_assembly_name = bom.sub_assembly_name
    LEFT JOIN material bom_m ON bom.material_id = bom_m.material_id
    WHERE si.status = 'AVAILABLE'
  `;
  
  const params = [];
  let paramCount = 0;

  if (filters.material_id) {
    paramCount++;
    query += ` AND si.material_id = $${paramCount}`;
    params.push(filters.material_id);
  }

  if (filters.min_width) {
    paramCount++;
    query += ` AND si.width_mm >= $${paramCount}`;
    params.push(filters.min_width);
  }

  if (filters.min_length) {
    paramCount++;
    query += ` AND si.length_mm >= $${paramCount}`;
    params.push(filters.min_length);
  }

  if (filters.min_thickness) {
    paramCount++;
    query += ` AND si.thickness_mm >= $${paramCount}`;
    params.push(filters.min_thickness);
  }

  query += ` ORDER BY si.weight_kg DESC, si.created_at ASC`;

  const res = await db.query(query, params);
  return res.rows;
};

export const findReusableForProduct = async (productId, materialId = null) => {
  let query = `
    SELECT si.*, l.name as location_name, 
           COALESCE(m.material_code, bom_m.material_code) as material_code, 
           COALESCE(m.name, bom_m.name, si.material_name) as material_name,
           bs.sub_assembly_name, bs.width_mm as required_width, bs.length_mm as required_length, bs.thickness_mm as required_thickness
    FROM scrap_inventory si
    LEFT JOIN location l ON si.location_id = l.location_id
    LEFT JOIN material m ON si.material_id = m.material_id
    LEFT JOIN scrap_origin so ON si.scrap_id = so.scrap_id
    LEFT JOIN blank_spec bs ON COALESCE(si.blank_id, so.blank_id) = bs.blank_id
    LEFT JOIN bom ON bs.product_id = bom.product_id AND bs.sub_assembly_name = bom.sub_assembly_name
    LEFT JOIN material bom_m ON bom.material_id = bom_m.material_id
    WHERE si.status = 'AVAILABLE'
    AND si.width_mm >= (
      SELECT MIN(bs2.width_mm) FROM blank_spec bs2 WHERE bs2.product_id = $1
    )
    AND si.length_mm >= (
      SELECT MIN(bs2.length_mm) FROM blank_spec bs2 WHERE bs2.product_id = $1
    )
    AND si.thickness_mm >= (
      SELECT MIN(bs2.thickness_mm) FROM blank_spec bs2 WHERE bs2.product_id = $1
    )
  `;
  
  const params = [productId];
  let paramCount = 1;

  if (materialId) {
    paramCount++;
    query += ` AND si.material_id = $${paramCount}`;
    params.push(materialId);
  }

  query += ` ORDER BY si.weight_kg DESC, si.created_at ASC`;

  const res = await db.query(query, params);
  return res.rows;
};

export const findMatchingScrap = async (width_mm, length_mm, thickness_mm, materialId = null) => {
  let query = `
    SELECT si.*, l.name as location_name, 
           COALESCE(m.material_code, bom_m.material_code) as material_code, 
           COALESCE(m.name, bom_m.name, si.material_name) as material_name,
           bs.sub_assembly_name,
           ((si.width_mm * si.length_mm) / ($1 * $2)) * 100 as utilization_percent
    FROM scrap_inventory si
    LEFT JOIN location l ON si.location_id = l.location_id
    LEFT JOIN material m ON si.material_id = m.material_id
    LEFT JOIN scrap_origin so ON si.scrap_id = so.scrap_id
    LEFT JOIN blank_spec bs ON COALESCE(si.blank_id, so.blank_id) = bs.blank_id
    LEFT JOIN bom ON bs.product_id = bom.product_id AND bs.sub_assembly_name = bom.sub_assembly_name
    LEFT JOIN material bom_m ON bom.material_id = bom_m.material_id
    WHERE si.status = 'AVAILABLE'
    AND si.width_mm >= $1
    AND si.length_mm >= $2
    AND si.thickness_mm >= $3
  `;
  
  const params = [width_mm, length_mm, thickness_mm];
  let paramCount = 3;

  if (materialId) {
    paramCount++;
    query += ` AND si.material_id = $${paramCount}`;
    params.push(materialId);
  }

  query += ` ORDER BY utilization_percent ASC, si.weight_kg DESC`;

  const res = await db.query(query, params);
  return res.rows;
};

export const markAsConsumed = async (scrapId, consumedByPo = null) => {
  const res = await db.query(
    `UPDATE scrap_inventory SET 
      status = 'CONSUMED', consumed_by_po = $2
     WHERE scrap_id = $1
     RETURNING *`,
    [scrapId, consumedByPo]
  );
  return res.rows[0];
};

export const getScrapSummary = async () => {
  // Get overall totals
  const totalsQuery = `
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_items,
      COUNT(CASE WHEN status = 'CONSUMED' THEN 1 END) as consumed_items,
      COUNT(CASE WHEN status = 'SOLD' THEN 1 END) as sold_items,
      COUNT(CASE WHEN status = 'QUARANTINED' THEN 1 END) as quarantined_items,
      COALESCE(SUM(weight_kg), 0) as total_weight,
      COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN weight_kg ELSE 0 END), 0) as available_weight,
      0 as total_value
    FROM scrap_inventory
  `;
  
  // Get breakdown by status
  const statusQuery = `
    SELECT 
       status,
       COUNT(*) as count,
      COALESCE(SUM(weight_kg), 0) as total_weight
     FROM scrap_inventory 
     GROUP BY status
    ORDER BY status
  `;
  
  // Get breakdown by material
  const materialQuery = `
    SELECT 
      material_name,
      COUNT(*) as count,
      COALESCE(SUM(weight_kg), 0) as total_weight
    FROM scrap_inventory 
    WHERE material_name IS NOT NULL
    GROUP BY material_name
    ORDER BY total_weight DESC
    LIMIT 10
  `;
  
  const [totalsRes, statusRes, materialRes] = await Promise.all([
    db.query(totalsQuery),
    db.query(statusQuery),
    db.query(materialQuery)
  ]);
  
  const totals = totalsRes.rows[0];
  
  // Convert status array to object
  const by_status = {};
  statusRes.rows.forEach(row => {
    by_status[row.status] = parseInt(row.count);
  });
  
  return {
    total_items: parseInt(totals.total_items) || 0,
    available_items: parseInt(totals.available_items) || 0,
    consumed_items: parseInt(totals.consumed_items) || 0,
    sold_items: parseInt(totals.sold_items) || 0,
    quarantined_items: parseInt(totals.quarantined_items) || 0,
    total_weight: parseFloat(totals.total_weight) || 0,
    available_weight: parseFloat(totals.available_weight) || 0,
    total_value: parseFloat(totals.total_value) || 0,
    by_status,
    by_material: materialRes.rows.map(row => ({
      material_name: row.material_name,
      count: parseInt(row.count),
      total_weight: parseFloat(row.total_weight)
    }))
  };
};

// New: Create scrap with origin (enterprise-grade 3-table approach)
export const createScrapWithOrigin = async (inventoryData, originData) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Create scrap inventory entry
    const inventoryQuery = `
      INSERT INTO scrap_inventory (
        scrap_id, material_id, material_name, width_mm, length_mm, thickness_mm, weight_kg,
        leftover_area_mm2, orientation, sheet_original_size, blank_size,
        efficiency_percentage, scrap_percentage, unit, status, blank_id, reference, created_by
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const inventoryResult = await client.query(inventoryQuery, [
      inventoryData.material_id,
      inventoryData.material_name,
      inventoryData.width_mm,
      inventoryData.length_mm,
      inventoryData.thickness_mm,
      inventoryData.weight_kg,
      inventoryData.leftover_area_mm2,
      inventoryData.orientation,
      inventoryData.sheet_original_size,
      inventoryData.blank_size,
      inventoryData.efficiency_percentage,
      inventoryData.scrap_percentage,
      inventoryData.unit || 'kg',
      inventoryData.status || 'AVAILABLE',
      inventoryData.blank_id,
      inventoryData.reference,
      inventoryData.created_by || 'system'
    ]);

    const scrapId = inventoryResult.rows[0].scrap_id;

    // 2. Create scrap origin entry
    const originQuery = `
      INSERT INTO scrap_origin (
        scrap_id, source_type, source_reference, product_id, blank_id,
        process_step, bom_efficiency, sheet_dimensions, blank_dimensions,
        leftover_width, leftover_length, cutting_direction, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    await client.query(originQuery, [
      scrapId,
      originData.source_type || 'BOM',
      originData.source_reference,
      originData.product_id,
      originData.blank_id,
      originData.process_step || 'Sheet Cutting',
      originData.bom_efficiency,
      originData.sheet_dimensions,
      originData.blank_dimensions,
      originData.leftover_width,
      originData.leftover_length,
      originData.cutting_direction || 'HORIZONTAL',
      originData.created_by || 'system'
    ]);

    // 3. Create initial transaction log entry
    const logQuery = `
      INSERT INTO scrap_transaction_log (
        scrap_id, transaction_type, quantity_before, quantity_after,
        quantity_changed, reason, performed_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await client.query(logQuery, [
      scrapId,
      'CREATED',
      0,
      inventoryData.weight_kg,
      inventoryData.weight_kg,
      `Auto-created from BOM optimization (${inventoryData.scrap_percentage}% scrap)`,
      originData.created_by || 'system'
    ]);

    await client.query('COMMIT');
    
    return inventoryResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// New: Find reuse opportunities with bounding box matching
export const findReuseOpportunities = async (scrapId) => {
  const scrap = await findById(scrapId);
  
  if (!scrap || scrap.status !== 'AVAILABLE') {
    return [];
  }

  // Smart SQL bounding box query for reuse matching
  const query = `
    SELECT 
      bs.blank_id,
      bs.product_id,
      bs.sub_assembly_name,
      bs.width_mm,
      bs.length_mm,
      bs.thickness_mm,
      p.product_code,
      p.part_name,
      -- Calculate how many blanks can fit in this scrap
      FLOOR($1 / bs.width_mm) * FLOOR($2 / bs.length_mm) as blanks_fit_horizontal,
      FLOOR($1 / bs.length_mm) * FLOOR($2 / bs.width_mm) as blanks_fit_vertical,
      GREATEST(
        FLOOR($1 / bs.width_mm) * FLOOR($2 / bs.length_mm),
        FLOOR($1 / bs.length_mm) * FLOOR($2 / bs.width_mm)
      ) as max_blanks_fit
    FROM blank_spec bs
    INNER JOIN product p ON bs.product_id = p.product_id
    WHERE 
      bs.thickness_mm <= $3
      AND (
        (bs.width_mm <= $1 AND bs.length_mm <= $2) OR
        (bs.length_mm <= $1 AND bs.width_mm <= $2)
      )
      AND GREATEST(
        FLOOR($1 / bs.width_mm) * FLOOR($2 / bs.length_mm),
        FLOOR($1 / bs.length_mm) * FLOOR($2 / bs.width_mm)
      ) > 0
    ORDER BY max_blanks_fit DESC, bs.created_at DESC
    LIMIT 10
  `;

  const result = await db.query(query, [
    scrap.width_mm,
    scrap.length_mm,
    scrap.thickness_mm
  ]);

  return result.rows;
};
