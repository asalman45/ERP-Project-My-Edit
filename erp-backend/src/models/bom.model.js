// src/models/bom.model.js
import db from '../utils/db.js';

export const findByProductId = async (productId) => {
  const res = await db.query(
    `SELECT b.*, m.material_code, m.name as material_name, u.code as uom_code, u.name as uom_name
     FROM bom b
     JOIN material m ON b.material_id = m.material_id
     LEFT JOIN uom u ON m.uom_id = u.uom_id
     WHERE b.product_id = $1 AND b.is_active = true
     ORDER BY b.material_id`,
    [productId]
  );
  return res.rows;
};

export const addMaterial = async (payload) => {
  const { product_id, material_id, quantity, sub_assembly_name } = payload;
  const subName = sub_assembly_name || null;

  // PostgreSQL cannot match NULL = NULL in ON CONFLICT, so use
  // an explicit upsert: try UPDATE first, INSERT if no match.
  const update = await db.query(
    `UPDATE bom SET quantity = $3
     WHERE product_id = $1
       AND material_id = $2
       AND sub_assembly_name IS NOT DISTINCT FROM $4
     RETURNING *`,
    [product_id, material_id, quantity, subName]
  );

  if (update.rows.length > 0) return update.rows[0];

  const insert = await db.query(
    `INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name)
     VALUES (gen_random_uuid(), $1, $2, $3, $4)
     RETURNING *`,
    [product_id, material_id, quantity, subName]
  );
  return insert.rows[0];
};

export const removeMaterial = async (productId, materialId) => {
  await db.query(
    'DELETE FROM bom WHERE product_id = $1 AND material_id = $2',
    [productId, materialId]
  );
  return true;
};

export const updateQuantity = async (productId, materialId, quantity) => {
  const res = await db.query(
    `UPDATE bom SET quantity = $3 
     WHERE product_id = $1 AND material_id = $2 
     RETURNING *`,
    [productId, materialId, quantity]
  );
  return res.rows[0];
};

// Enhanced BOM functionality for sub-assemblies
export const findByProductIdWithSubAssemblies = async (productId) => {
  const res = await db.query(
    `SELECT b.*, m.material_code, m.name as material_name, u.code as uom_code, u.name as uom_name
     FROM bom b
     JOIN material m ON b.material_id = m.material_id
     LEFT JOIN uom u ON b.uom_id = u.uom_id
     WHERE b.product_id = $1 AND b.is_active = true
     ORDER BY b.step_sequence, b.sub_assembly_name, b.material_id`,
    [productId]
  );
  return res.rows;
};

export const addSubAssembly = async (payload) => {
  const { product_id, material_id, sub_assembly_name, quantity, step_sequence, is_optional, uom_id } = payload;
  const res = await db.query(
    `INSERT INTO bom (product_id, material_id, sub_assembly_name, quantity, step_sequence, is_optional, uom_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (product_id, material_id, sub_assembly_name) 
     DO UPDATE SET quantity = EXCLUDED.quantity, step_sequence = EXCLUDED.step_sequence, is_optional = EXCLUDED.is_optional, uom_id = EXCLUDED.uom_id
     RETURNING *`,
    [product_id, material_id, sub_assembly_name, quantity, step_sequence, is_optional, uom_id]
  );
  return res.rows[0];
};

export const removeSubAssembly = async (productId, subAssemblyName) => {
  console.log('🔍 Attempting to delete sub-assembly:', { productId, subAssemblyName });

  // First, let's check what sub-assemblies exist for this product
  const checkRes = await db.query(
    'SELECT DISTINCT sub_assembly_name FROM bom WHERE product_id = $1',
    [productId]
  );
  console.log('📋 Existing sub-assemblies for product:', checkRes.rows);

  // Try exact match first
  let res = await db.query(
    'DELETE FROM bom WHERE product_id = $1 AND sub_assembly_name = $2',
    [productId, subAssemblyName]
  );

  console.log('🗑️ Exact match delete result:', { rowCount: res.rowCount, subAssemblyName });

  // If no exact match, try case-insensitive match
  if (res.rowCount === 0) {
    console.log('🔄 Trying case-insensitive match...');
    res = await db.query(
      'DELETE FROM bom WHERE product_id = $1 AND LOWER(sub_assembly_name) = LOWER($2)',
      [productId, subAssemblyName]
    );
    console.log('🗑️ Case-insensitive delete result:', { rowCount: res.rowCount, subAssemblyName });
  }

  // If still no match, try trimmed match
  if (res.rowCount === 0) {
    console.log('🔄 Trying trimmed match...');
    res = await db.query(
      'DELETE FROM bom WHERE product_id = $1 AND TRIM(sub_assembly_name) = TRIM($2)',
      [productId, subAssemblyName]
    );
    console.log('🗑️ Trimmed delete result:', { rowCount: res.rowCount, subAssemblyName });
  }

  return res.rowCount > 0;
};

export const getProcessFlowByProductId = async (productId) => {
  const res = await db.query(
    `SELECT r.*, p.part_name, p.product_code
     FROM routing r
     JOIN product p ON r.product_id = p.product_id
     WHERE r.product_id = $1
     ORDER BY r.step_no`,
    [productId]
  );
  return res.rows;
};

export const createNewVersion = async (productId) => {
  // Get current active version items
  const currentItems = await db.query(
    `SELECT * FROM bom WHERE product_id = $1 AND is_active = true`,
    [productId]
  );
  
  if (currentItems.rows.length === 0) return 1;
  
  const currentVersion = currentItems.rows[0].version || 1;
  const newVersion = currentVersion + 1;
  
  // Set existing to inactive
  await db.query(
    `UPDATE bom SET is_active = false WHERE product_id = $1`,
    [productId]
  );
  
  // Insert new version
  for (const item of currentItems.rows) {
    await db.query(
      `INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, version, is_active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [productId, item.material_id, item.quantity, item.sub_assembly_name, item.step_sequence, item.is_optional, item.uom_id, newVersion]
    );
  }
  
  return newVersion;
};

// Maximum BOM functionality
export const getMaximumBom = async (productId) => {
  console.log('🔍 Getting Maximum BOM for product:', productId);

  const res = await db.query(
    `SELECT b.*, m.material_code, m.name as material_name, m.grade, m.thickness, m.unit_cost,
            u.code as uom_code, u.name as uom_name
     FROM bom b
     JOIN material m ON b.material_id = m.material_id
     LEFT JOIN uom u ON b.uom_id = u.uom_id
     WHERE b.product_id = $1 AND b.is_active = true
     ORDER BY b.step_sequence, b.sub_assembly_name, b.material_id`,
    [productId]
  );

  console.log(`📋 Found ${res.rows.length} Maximum BOM items`);
  return res.rows;
};

export const checkMaterialAvailability = async (productId, requiredQuantity = 1) => {
  console.log('🔍 Checking material availability for product:', productId, 'quantity:', requiredQuantity);

  // Get BOM requirements
  const bomRes = await db.query(
    `SELECT b.*, m.material_code, m.name as material_name, m.unit_cost
     FROM bom b
     JOIN material m ON b.material_id = m.material_id
     WHERE b.product_id = $1 AND b.is_optional = false AND b.is_active = true
     ORDER BY b.step_sequence`,
    [productId]
  );

  const shortages = [];
  const availableMaterials = [];

  for (const bomItem of bomRes.rows) {
    // Check current stock
    const stockRes = await db.query(
      `SELECT COALESCE(SUM(quantity), 0) as available_stock
       FROM inventory 
       WHERE material_id = $1 AND quantity > 0`,
      [bomItem.material_id]
    );

    const currentStock = parseFloat(stockRes.rows[0].available_stock);
    const requiredQty = parseFloat(bomItem.quantity) * requiredQuantity;

    if (currentStock < requiredQty) {
      const shortage = {
        material_id: bomItem.material_id,
        material_code: bomItem.material_code,
        material_name: bomItem.material_name,
        required_quantity: requiredQty,
        available_stock: currentStock,
        shortage_quantity: requiredQty - currentStock,
        sub_assembly_name: bomItem.sub_assembly_name,
        is_critical: bomItem.is_critical || false
      };

      // Check for incoming POs (optional; schema may vary)
      let incomingQty = 0;
      try {
        const incomingRes = await db.query(
          `SELECT COALESCE(SUM(remaining_quantity), 0) as incoming_quantity
           FROM purchase_order_items poi
           JOIN purchase_orders po ON poi.purchase_order_id = po.purchase_order_id
           WHERE poi.material_id = $1 AND po.status IN ('confirmed', 'partial_received')
           AND po.expected_delivery_date <= CURRENT_DATE + INTERVAL '15 days'`,
          [bomItem.material_id]
        );
        incomingQty = parseFloat(incomingRes.rows?.[0]?.incoming_quantity || 0);
      } catch (e) {
        // Table may not exist in current deployment; treat as no incoming stock
        incomingQty = 0;
      }
      shortage.incoming_quantity = incomingQty;
      shortage.total_available = currentStock + incomingQty;
      shortage.still_short = Math.max(0, requiredQty - (currentStock + incomingQty));

      shortages.push(shortage);
    } else {
      availableMaterials.push({
        material_id: bomItem.material_id,
        material_code: bomItem.material_code,
        material_name: bomItem.material_name,
        available_stock: currentStock,
        required_quantity: requiredQty,
        sub_assembly_name: bomItem.sub_assembly_name
      });
    }
  }

  return {
    has_shortages: shortages.length > 0,
    shortages: shortages,
    available_materials: availableMaterials,
    total_shortages: shortages.length,
    critical_shortages: shortages.filter(s => s.still_short > 0).length
  };
};

export const findSubstituteMaterials = async (materialId, grade, thickness) => {
  console.log('🔄 Finding substitute materials for:', { materialId, grade, thickness });

  // Fallback: select active materials excluding the same id; no grade/thickness dependency
  const res = await db.query(
    `SELECT m.*, 0 as priority
     FROM material m
     WHERE m.material_id != $1 AND m.active = true
     ORDER BY m.name ASC`,
    [materialId]
  );

  return res.rows;
};

export const generateProductionRecipe = async (productId, requiredQuantity = 1) => {
  console.log('🎯 Generating production recipe for product:', productId, 'quantity:', requiredQuantity);

  // Get Maximum BOM
  const maximumBom = await getMaximumBom(productId);

  // Check availability
  const availability = await checkMaterialAvailability(productId, requiredQuantity);

  const recipe = [];
  const substitutions = [];

  for (const bomItem of maximumBom) {
    const requiredQty = parseFloat(bomItem.quantity) * requiredQuantity;

    // Check if primary material is available
    const stockRes = await db.query(
      `SELECT COALESCE(SUM(quantity), 0) as available_stock
       FROM inventory 
       WHERE material_id = $1 AND quantity > 0`,
      [bomItem.material_id]
    );

    const currentStock = parseFloat(stockRes.rows[0].available_stock);

    if (currentStock >= requiredQty) {
      // Use primary material
      recipe.push({
        material_id: bomItem.material_id,
        material_code: bomItem.material_code,
        material_name: bomItem.material_name,
        chosen_quantity: requiredQty,
        is_substitute: false,
        substitution_reason: null,
        cost_impact: 0,
        sub_assembly_name: bomItem.sub_assembly_name
      });
    } else {
      // Try to find substitutes
      const substitutes = await findSubstituteMaterials(
        bomItem.material_id,
        bomItem.grade,
        bomItem.thickness
      );

      let substituteFound = false;

      for (const substitute of substitutes) {
        const subStockRes = await db.query(
          `SELECT COALESCE(SUM(quantity), 0) as available_stock
           FROM inventory 
           WHERE material_id = $1 AND quantity > 0`,
          [substitute.material_id]
        );

        const subStock = parseFloat(subStockRes.rows[0].available_stock);

        if (subStock >= requiredQty) {
          // Use substitute
          recipe.push({
            material_id: substitute.material_id,
            material_code: substitute.material_code,
            material_name: substitute.material_name,
            chosen_quantity: requiredQty,
            is_substitute: true,
            substitution_reason: `Substituted for ${bomItem.material_code} (${substitute.priority === 1 ? 'same grade' : 'different grade'})`,
            cost_impact: ((substitute.unit_cost - bomItem.unit_cost) / bomItem.unit_cost) * 100,
            sub_assembly_name: bomItem.sub_assembly_name,
            original_material_id: bomItem.material_id
          });

          substitutions.push({
            original: bomItem,
            substitute: substitute,
            reason: `Shortage of ${bomItem.material_code}`
          });

          substituteFound = true;
          break;
        }
      }

      if (!substituteFound) {
        // No substitute available - mark as shortage
        recipe.push({
          material_id: bomItem.material_id,
          material_code: bomItem.material_code,
          material_name: bomItem.material_name,
          chosen_quantity: requiredQty,
          is_substitute: false,
          substitution_reason: 'SHORTAGE - No substitute available',
          cost_impact: 0,
          sub_assembly_name: bomItem.sub_assembly_name,
          is_shortage: true
        });
      }
    }
  }

  return {
    recipe: recipe,
    substitutions: substitutions,
    has_shortages: recipe.some(item => item.is_shortage),
    total_cost_impact: recipe.reduce((sum, item) => sum + (item.cost_impact || 0), 0),
    substitution_count: substitutions.length
  };
};

export const saveRecipeSnapshot = async (workOrderId, productId, recipe) => {
  console.log('💾 Saving recipe snapshot for work order:', workOrderId);

  const snapshots = [];

  for (const item of recipe) {
    const res = await db.query(
      `INSERT INTO production_recipe_snapshots 
       (work_order_id, product_id, material_id, substitute_material_id, chosen_quantity, 
        substitution_reason, cost_impact, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        workOrderId,
        productId,
        item.material_id,
        item.is_substitute ? item.material_id : null,
        item.chosen_quantity,
        item.substitution_reason,
        item.cost_impact || 0,
        !item.is_substitute
      ]
    );

    snapshots.push(res.rows[0]);
  }

  return snapshots;
};

export const createShortageAlert = async (poId, productId, shortages) => {
  console.log('🚨 Creating shortage alert for PO:', poId, 'product:', productId);

  const alertData = {
    po_id: poId,
    product_id: productId,
    alert_type: 'material_shortage',
    severity: shortages.some(s => s.still_short > 0) ? 'critical' : 'warning',
    message: `Material shortage detected for PO ${poId}`,
    details: JSON.stringify(shortages),
    status: 'pending'
  };

  const res = await db.query(
    `INSERT INTO shortage_alerts (po_id, product_id, alert_type, severity, message, details, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [alertData.po_id, alertData.product_id, alertData.alert_type, alertData.severity,
    alertData.message, alertData.details, alertData.status]
  );

  return res.rows[0];
};