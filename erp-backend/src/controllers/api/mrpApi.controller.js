// src/controllers/api/mrpApi.controller.js
// API Controller for Material Requirement Planning (MRP)

import mrpService from '../../services/mrpService.js';
import { logger } from '../../utils/logger.js';
import db from '../../utils/db.js';
import procurementRequestService from '../../services/procurementRequest.service.js';

/**
 * Run MRP for a sales order or direct product order
 * POST /api/mrp/run
 * Body: { salesOrderId, productId, quantity, requiredByDate, createdBy }
 */
export async function runMRP(req, res) {
  try {
    const { salesOrderId, productId, quantity, requiredByDate, createdBy } = req.body;
    
    if (!salesOrderId && (!productId || !quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Either salesOrderId or (productId + quantity) is required'
      });
    }
    
    logger.info({ salesOrderId, productId, quantity }, 'API: Running MRP');
    
    const result = await mrpService.runMRP({
      salesOrderId,
      productId,
      quantity,
      requiredByDate,
      createdBy: createdBy || 'system'
    });
    
    res.json({
      success: true,
      data: result,
      message: `MRP run completed. ${result.summary.total_shortages} shortage(s) identified.`
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error running MRP');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run MRP'
    });
  }
}

/**
 * Get MRP results for a sales order
 * GET /api/mrp/results/:salesOrderId
 */
export async function getMRPResults(req, res) {
  try {
    const { salesOrderId } = req.params;
    
    logger.info({ salesOrderId }, 'API: Fetching MRP results');
    
    const result = await mrpService.getMRPResults(salesOrderId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, salesOrderId: req.params.salesOrderId }, 'API: Error fetching MRP results');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch MRP results'
    });
  }
}

/**
 * Generate purchase requisitions for material shortages
 * POST /api/mrp/generate-prs
 * Body: { salesOrderId }
 */
export async function generatePurchaseRequisitions(req, res) {
  try {
    const { salesOrderId } = req.body;
    
    if (!salesOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Sales Order ID is required'
      });
    }
    
    logger.info({ salesOrderId }, 'API: Generating purchase requisitions');
    
    const prIds = await mrpService.generatePurchaseRequisitions(salesOrderId);
    
    res.json({
      success: true,
      data: { purchase_requisition_ids: prIds },
      message: `${prIds.length} purchase requisition(s) generated successfully`
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error generating purchase requisitions');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate purchase requisitions'
    });
  }
}

/**
 * Get material requisitions for a sales order
 * GET /api/mrp/requisitions/:salesOrderId
 */
export async function getMaterialRequisitions(req, res) {
  try {
    const { salesOrderId } = req.params;
    const { status } = req.query;
    
    logger.info({ salesOrderId, status }, 'API: Fetching material requisitions');
    
    let query = `
      SELECT * FROM material_requisition
      WHERE sales_order_id = $1
    `;
    const params = [salesOrderId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY priority DESC, material_type, material_name`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    logger.error({ error, salesOrderId: req.params.salesOrderId }, 'API: Error fetching material requisitions');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch material requisitions'
    });
  }
}

/**
 * Get material shortages summary
 * GET /api/mrp/shortages/:salesOrderId
 */
export async function getMaterialShortages(req, res) {
  try {
    const { salesOrderId } = req.params;
    
    logger.info({ salesOrderId }, 'API: Fetching material shortages');
    
    const query = `
      SELECT 
        material_id,
        material_code,
        material_name,
        material_type,
        quantity_required,
        quantity_available,
        quantity_shortage,
        unit_cost,
        (quantity_shortage * unit_cost) as shortage_cost,
        priority,
        is_critical
      FROM material_requisition
      WHERE sales_order_id = $1
        AND quantity_shortage > 0
      ORDER BY priority DESC, shortage_cost DESC
    `;
    
    const result = await db.query(query, [salesOrderId]);
    
    const totalCost = result.rows.reduce((sum, row) => 
      sum + parseFloat(row.shortage_cost || 0), 0
    );
    
    res.json({
      success: true,
      data: {
        shortages: result.rows,
        summary: {
          total_shortages: result.rowCount,
          total_cost: totalCost,
          critical_shortages: result.rows.filter(r => r.is_critical).length
        }
      }
    });
    
  } catch (error) {
    logger.error({ error, salesOrderId: req.params.salesOrderId }, 'API: Error fetching material shortages');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch material shortages'
    });
  }
}

/**
 * Run MRP for a specific product and quantity (Frontend API)
 * POST /api/mrp-api/run-mrp
 * Body: { product_id, quantity }
 */
export async function runMRPForProduct(req, res) {
  try {
    const { product_id, quantity } = req.body;
    
    if (!product_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }
    
    logger.info({ product_id, quantity }, 'API: Running MRP for product');
    
    // Get BOM items for the product
    const bomQuery = `
      SELECT 
        b.item_name,
        b.quantity,
        b.operation_code,
        b.step_sequence,
        b.is_critical,
        b.scrap_allowance_pct,
        b.reference_type,
        b.reference_id,
        bs.blank_id,
        bs.width_mm,
        bs.length_mm,
        bs.thickness_mm,
        bs.blank_weight_kg,
        bs.pcs_per_sheet,
        bs.sheet_util_pct,
        bs.sheet_type,
        bs.material_type as blank_material_type,
        m.material_id,
        m.name as material_name,
        m.material_type,
        m.unit_cost,
        -- Use material_id from BOM directly, or find material for blanks
        -- Prefer materials that exist in raw_material table
        COALESCE(b.material_id, m.material_id,
          (SELECT m2.material_id FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE (m2.name ILIKE '%' || bs.sheet_type || '%' OR m2.material_type::text = bs.material_type)
           LIMIT 1),
          (SELECT m2.material_id FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE m2.name ILIKE '%Sheet%' AND m2.material_type = 'RAW_MATERIAL'
           LIMIT 1)
        ) as final_material_id,
        COALESCE(m.name,
          (SELECT m2.name FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE m2.material_id = b.material_id
           LIMIT 1),
          (SELECT m2.name FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE (m2.name ILIKE '%' || bs.sheet_type || '%' OR m2.material_type::text = bs.material_type)
           LIMIT 1),
          (SELECT m2.name FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE m2.name ILIKE '%Sheet%' AND m2.material_type = 'RAW_MATERIAL'
           LIMIT 1)
        ) as final_material_name,
        COALESCE(m.unit_cost, 
          (SELECT m2.unit_cost FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE (m2.name ILIKE '%' || bs.sheet_type || '%' OR m2.material_type::text = bs.material_type)
           LIMIT 1),
          (SELECT m2.unit_cost FROM material m2 
           INNER JOIN raw_material rm ON m2.material_code = rm.material_code
           WHERE m2.name ILIKE '%Sheet%' AND m2.material_type = 'RAW_MATERIAL'
           LIMIT 1),
          0
        ) as final_unit_cost
      FROM bom b
      LEFT JOIN blank_spec bs ON b.reference_id = bs.blank_id AND b.reference_type = 'BLANK'
      LEFT JOIN material m ON b.material_id = m.material_id
      WHERE b.product_id = $1
      ORDER BY b.step_sequence
    `;
    
    const bomResult = await db.query(bomQuery, [product_id]);
    
    if (bomResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No BOM found for this product'
      });
    }
    
    // Calculate material requirements
    const requirements = [];
    let totalCost = 0;
    
    // Get current inventory for all materials (aggregated across all locations)
    const inventoryQuery = `
      SELECT 
        material_id,
        SUM(quantity) as total_available
      FROM inventory 
      GROUP BY material_id
    `;
    const inventoryResult = await db.query(inventoryQuery);
    
    // Create inventory map for quick lookup
    const inventoryMap = new Map();
    inventoryResult.rows.forEach(inv => {
      inventoryMap.set(inv.material_id, parseFloat(inv.total_available));
    });
    
    // Collect all material IDs to fetch names from database (always fetch to ensure accuracy)
    const materialIdsToLookup = new Set();
    const materialNameMap = new Map();
    
    // First, add material names that were already joined in the query
    bomResult.rows.forEach(item => {
      if (item.material_id && item.material_name) {
        materialNameMap.set(item.material_id, item.material_name);
      }
      if (item.final_material_id && !materialNameMap.has(item.final_material_id)) {
        materialIdsToLookup.add(item.final_material_id);
      }
      if (item.material_id && !materialNameMap.has(item.material_id)) {
        materialIdsToLookup.add(item.material_id);
      }
    });
    
    // Batch fetch remaining material names from database
    if (materialIdsToLookup.size > 0) {
      const materialIdsArray = Array.from(materialIdsToLookup);
      const materialNameQuery = await db.query(
        `SELECT material_id, name FROM material WHERE material_id = ANY($1)`,
        [materialIdsArray]
      );
      materialNameQuery.rows.forEach(row => {
        materialNameMap.set(row.material_id, row.name);
      });
    }
    
    for (const bomItem of bomResult.rows) {
      const requiredQuantity = Math.ceil(quantity * bomItem.quantity * (1 + (bomItem.scrap_allowance_pct || 0) / 100));
      
      // For blank specs, calculate sheets needed
      if (bomItem.pcs_per_sheet && bomItem.pcs_per_sheet > 0) {
        const sheetsNeeded = Math.ceil(requiredQuantity / bomItem.pcs_per_sheet);
        const unitCost = parseFloat(bomItem.final_unit_cost) || 0;
        const sheetWeight = sheetsNeeded * (bomItem.blank_weight_kg * bomItem.pcs_per_sheet);
        const sheetCost = sheetWeight * unitCost;
        
        // Get available inventory for this material (aggregated across all locations)
        const availableQuantity = inventoryMap.get(bomItem.final_material_id) || 0;
        const shortage = Math.max(0, sheetsNeeded - availableQuantity);
        
        // Always use the material name from the database (never use item_name from BOM)
        // Try final_material_id first, then material_id, then final_material_name from query
        let actualMaterialName = materialNameMap.get(bomItem.final_material_id) 
          || materialNameMap.get(bomItem.material_id)
          || bomItem.final_material_name
          || bomItem.material_name;
        
        // If still no material name found, use a generic description but never item_name
        if (!actualMaterialName) {
          actualMaterialName = `Material (${bomItem.width_mm}×${bomItem.length_mm}×${bomItem.thickness_mm}mm)`;
        }
        
        requirements.push({
          material_id: bomItem.final_material_id,
          material_name: actualMaterialName,
          required_quantity: sheetsNeeded,
          available_quantity: availableQuantity,
          shortage: shortage,
          unit: 'Sheet',
          unit_cost: unitCost,
          total_cost: sheetCost,
          is_critical: bomItem.is_critical
        });
        
        totalCost += sheetCost;
      } else {
        // For raw materials
        const unitCost = parseFloat(bomItem.unit_cost) || 0;
        const materialCost = requiredQuantity * unitCost;
        
        // Get available inventory for this material (aggregated across all locations)
        const availableQuantity = inventoryMap.get(bomItem.material_id) || 0;
        const shortage = Math.max(0, requiredQuantity - availableQuantity);
        
        // Always use the material name from the database (never use item_name from BOM)
        // Try material_id first, then final_material_name from query
        let actualMaterialName = materialNameMap.get(bomItem.material_id)
          || bomItem.material_name;
        
        // Never use item_name as fallback - if no material name found, use a generic name
        if (!actualMaterialName) {
          actualMaterialName = 'Unknown Material';
        }
        
        requirements.push({
          material_id: bomItem.material_id,
          material_name: actualMaterialName,
          required_quantity: requiredQuantity,
          available_quantity: availableQuantity,
          shortage: shortage,
          unit: 'Pieces', // Default unit for materials
          unit_cost: unitCost,
          total_cost: materialCost,
          is_critical: bomItem.is_critical
        });
        
        totalCost += materialCost;
      }
    }
    
    res.json({
      success: true,
      requirements,
      summary: {
        total_materials: requirements.length,
        total_shortages: requirements.filter(r => r.shortage > 0).length,
        total_cost: totalCost,
        critical_shortages: requirements.filter(r => r.is_critical && r.shortage > 0).length
      }
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error running MRP for product');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run MRP for product'
    });
  }
}

/**
 * Generate purchase requisitions from requirements
 * POST /api/mrp-api/generate-prs
 * Body: { requirements }
 */
export async function generatePRsFromRequirements(req, res) {
  try {
    const { requirements } = req.body;

    if (!requirements || !Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        error: 'Requirements array is required'
      });
    }

    logger.info({ requirements_count: requirements.length }, 'API: Generating PRs from requirements');

    const groupedByMaterial = new Map();

    for (const req of requirements) {
      const shortageQty = Number(req.shortage ?? req.quantity_shortage ?? 0);
      if (!shortageQty || shortageQty <= 0) {
        continue;
      }

      const materialId = req.material_id || req.materialId || null;
      const materialCode = req.material_code || req.materialCode || req.item_code || null;
      const materialName = req.material_name || req.item_name || req.material || 'Unknown Material';
      const unit = req.unit || req.unit_of_measure || req.uom || 'Units';
      const requestedBy = req.requested_by || req.created_by || 'MRP System';
      const preferredSupplier = req.preferred_supplier || req.supplier || 'Default Supplier';
      const requiredDate = req.required_date || req.need_by_date || null;

      const key = materialId ? materialId : `${materialName}|${unit}`;

      if (!groupedByMaterial.has(key)) {
        groupedByMaterial.set(key, {
          material_id: materialId,
          material_code: materialCode,
          material_name: materialName,
          unit,
          supplier: preferredSupplier,
          requested_by: requestedBy,
          total_shortage: 0,
          required_dates: [],
          sources: []
        });
      }

      const entry = groupedByMaterial.get(key);
      entry.total_shortage += shortageQty;
      if (requiredDate) {
        entry.required_dates.push(new Date(requiredDate));
      }
      entry.sources.push({
        reference: req.reference || req.bom_item || req.item_name || req.material_name,
        shortage: shortageQty
      });
    }

    const prs = [];
    const procurementRequests = [];

    for (const entry of groupedByMaterial.values()) {
      const prId = `PR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const earliestDate = entry.required_dates.length > 0
        ? new Date(Math.min(...entry.required_dates.map(date => date.getTime())))
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const pr = {
        pr_id: prId,
        material_id: entry.material_id,
        material_code: entry.material_code,
        material_name: entry.material_name,
        quantity: Number(entry.total_shortage.toFixed(4)),
        unit: entry.unit,
        supplier: entry.supplier,
        required_date: earliestDate.toISOString().split('T')[0],
        status: 'PENDING',
        shortage_sources: entry.sources
      };

      prs.push(pr);

      if (entry.material_id) {
        try {
          const notes = entry.sources.length > 1
            ? `MRP auto-generated. Aggregated from ${entry.sources.length} shortage items for ${entry.material_name}.`
            : `MRP auto-generated shortage for ${entry.material_name}.`;

          const procurementRequest = await procurementRequestService.createProcurementRequest({
            material_id: entry.material_id,
            quantity: Number(entry.total_shortage.toFixed(4)),
            requested_by: entry.requested_by,
            notes
          });
          procurementRequests.push(procurementRequest);
        } catch (error) {
          logger.error({
            error,
            material_id: entry.material_id,
            material_name: entry.material_name,
          }, 'API: Failed to create procurement_request during aggregated PR generation');
        }
      } else {
        logger.warn({
          material_name: entry.material_name,
        }, 'API: Skipping procurement_request creation - missing material_id in aggregated requirement');
      }
    }

    res.json({
      success: true,
      prs,
      procurement_requests: procurementRequests,
      message: `${prs.length} purchase requisitions generated`
    });

  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error generating PRs from requirements');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate purchase requisitions'
    });
  }
}

/**
 * Get products for MRP planning with sales order production quantities
 * GET /api/mrp-api/products
 */
export async function getProductsForMRP(req, res) {
  try {
    logger.info('API: Fetching products for MRP with sales order quantities');

    const query = `
      SELECT 
        p.product_id,
        p.product_code,
        p.part_name,
        p.description,
        COUNT(DISTINCT b.bom_id) as bom_items_count,
        COALESCE((
          SELECT SUM(soi.quantity)
          FROM sales_order_item soi
          JOIN sales_order so ON soi.sales_order_id = so.sales_order_id
          WHERE soi.item_code = p.product_code
            AND so.status IN ('APPROVED', 'IN_PRODUCTION')
            AND soi.production_required = true
        ), 0) as total_production_quantity,
        COALESCE((
          SELECT COUNT(DISTINCT so.sales_order_id)
          FROM sales_order_item soi
          JOIN sales_order so ON soi.sales_order_id = so.sales_order_id
          WHERE soi.item_code = p.product_code
            AND so.status IN ('APPROVED', 'IN_PRODUCTION')
            AND soi.production_required = true
        ), 0) as active_sales_orders_count,
        COALESCE((
          SELECT SUM(pp.quantity_planned)
          FROM planned_production pp
          WHERE pp.product_id = p.product_id
            AND pp.status IN ('PLANNED', 'MRP_PLANNED', 'IN_PROGRESS')
        ), 0) as planned_production_quantity,
        COALESCE((
          SELECT COUNT(pp.planned_production_id)
          FROM planned_production pp
          WHERE pp.product_id = p.product_id
            AND pp.status IN ('PLANNED', 'MRP_PLANNED', 'IN_PROGRESS')
        ), 0) as active_planned_productions_count
      FROM product p
      LEFT JOIN bom b ON p.product_id = b.product_id
      GROUP BY p.product_id, p.product_code, p.part_name, p.description
      HAVING COUNT(DISTINCT b.bom_id) > 0
      ORDER BY (
        COALESCE((
          SELECT SUM(soi.quantity)
          FROM sales_order_item soi
          JOIN sales_order so ON soi.sales_order_id = so.sales_order_id
          WHERE soi.item_code = p.product_code
            AND so.status IN ('APPROVED', 'IN_PRODUCTION')
            AND soi.production_required = true
        ), 0) + COALESCE((
          SELECT SUM(pp.quantity_planned)
          FROM planned_production pp
          WHERE pp.product_id = p.product_id
            AND pp.status IN ('PLANNED', 'MRP_PLANNED', 'IN_PROGRESS')
        ), 0)
      ) DESC, p.product_code
    `;

    const result = await db.query(query);

    const products = result.rows.map(product => {
      const soQuantity = parseInt(product.total_production_quantity) || 0;
      const plannedQuantity = parseInt(product.planned_production_quantity) || 0;
      const totalQuantity = soQuantity + plannedQuantity;
      
      return {
        product_id: product.product_id,
        product_code: product.product_code,
        part_name: product.part_name,
        description: product.description,
        bom_items_count: parseInt(product.bom_items_count),
        total_production_quantity: totalQuantity,
        sales_order_quantity: soQuantity,
        planned_production_quantity: plannedQuantity,
        active_sales_orders_count: parseInt(product.active_sales_orders_count) || 0,
        active_planned_productions_count: parseInt(product.active_planned_productions_count) || 0,
        display_name: `${product.product_code} - ${product.part_name}`,
        has_production_demand: totalQuantity > 0
      };
    });

    logger.info(`Found ${products.length} products with BOM items`);

    res.json(products);

  } catch (error) {
    logger.error({ error }, 'API: Error fetching products for MRP');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch products for MRP'
    });
  }
}

/**
 * Get sales orders with production requirements for MRP planning
 * GET /api/mrp-api/sales-orders
 */
export async function getSalesOrdersForMRP(req, res) {
  try {
    logger.info('API: Fetching sales orders for MRP planning');

    const query = `
      SELECT 
        so.sales_order_id,
        so.order_number,
        so.status,
        so.required_date,
        so.delivery_date,
        c.company_name as customer_name,
        COUNT(soi.item_id) as total_items,
        SUM(CASE 
          WHEN soi.production_required = true 
          THEN soi.quantity 
          ELSE 0 
        END) as production_quantity,
        COUNT(CASE 
          WHEN soi.production_required = true 
          THEN soi.item_id 
          ELSE NULL 
        END) as production_items_count
      FROM sales_order so
      LEFT JOIN customer c ON so.customer_id = c.customer_id
      LEFT JOIN sales_order_item soi ON so.sales_order_id = soi.sales_order_id
      WHERE so.status IN ('APPROVED', 'IN_PRODUCTION')
      GROUP BY so.sales_order_id, so.order_number, so.status, so.required_date, so.delivery_date, c.company_name
      HAVING SUM(CASE WHEN soi.production_required = true THEN soi.quantity ELSE 0 END) > 0
      ORDER BY so.required_date ASC, so.order_number
    `;

    const result = await db.query(query);

    const salesOrders = result.rows.map(order => ({
      sales_order_id: order.sales_order_id,
      order_number: order.order_number,
      status: order.status,
      required_date: order.required_date,
      delivery_date: order.delivery_date,
      customer_name: order.customer_name,
      total_items: parseInt(order.total_items),
      production_quantity: parseInt(order.production_quantity),
      production_items_count: parseInt(order.production_items_count),
      display_name: `${order.order_number} - ${order.customer_name} (${order.production_quantity} pcs)`
    }));

    logger.info(`Found ${salesOrders.length} sales orders with production requirements`);

    res.json(salesOrders);

  } catch (error) {
    logger.error({ error }, 'API: Error fetching sales orders for MRP');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sales orders for MRP'
    });
  }
}

/**
 * Get sales order items for a specific sales order
 * GET /api/mrp-api/sales-orders/:salesOrderId/items
 */
export async function getSalesOrderItems(req, res) {
  try {
    const { salesOrderId } = req.params;
    logger.info('API: Fetching sales order items for MRP planning');

    const query = `
      SELECT 
        soi.item_id,
        soi.item_code,
        soi.item_name,
        soi.description,
        soi.specification,
        soi.quantity,
        soi.unit_of_measure,
        soi.unit_price,
        soi.line_total,
        soi.production_required,
        soi.delivery_required,
        soi.delivery_date,
        p.product_id,
        p.product_code as product_code,
        p.part_name as product_name
      FROM sales_order_item soi
      LEFT JOIN product p ON soi.item_code = p.product_code
      WHERE soi.sales_order_id = $1
      ORDER BY soi.created_at
    `;

    const result = await db.query(query, [salesOrderId]);

    const items = result.rows.map(item => ({
      item_id: item.item_id,
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description,
      specification: item.specification,
      quantity: parseInt(item.quantity),
      unit_of_measure: item.unit_of_measure,
      unit_price: parseFloat(item.unit_price),
      line_total: parseFloat(item.line_total),
      production_required: item.production_required,
      delivery_required: item.delivery_required,
      delivery_date: item.delivery_date,
      product_id: item.product_id,
      product_code: item.product_code,
      product_name: item.product_name,
      display_name: `${item.item_code} - ${item.item_name}`,
      has_product_link: !!item.product_id
    }));

    logger.info(`Found ${items.length} items for sales order ${salesOrderId}`);

    res.json(items);

  } catch (error) {
    logger.error({ error }, 'API: Error fetching sales order items');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sales order items'
    });
  }
}
export async function getSuppliersForMRP(req, res) {
  try {
    logger.info('API: Fetching suppliers for MRP');

    const query = `
      SELECT 
        supplier_id,
        code,
        name,
        contact,
        phone,
        email,
        address,
        lead_time_days
      FROM supplier
      ORDER BY name
    `;

    const result = await db.query(query);

    const suppliers = result.rows.map(supplier => ({
      supplier_id: supplier.supplier_id,
      code: supplier.code,
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      lead_time_days: supplier.lead_time_days || 7,
      display_name: `${supplier.code} - ${supplier.name}`
    }));

    logger.info(`Found ${suppliers.length} suppliers`);

    res.json({
      success: true,
      data: suppliers
    });

  } catch (error) {
    logger.error({ error }, 'API: Error fetching suppliers for MRP');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch suppliers'
    });
  }
}

/**
 * Convert Purchase Requisition to Purchase Order
 * POST /api/mrp-api/convert-pr-to-po
 * Body: { pr_data, supplier_id, unit_cost }
 */
export async function convertPRToPO(req, res) {
  try {
    const { pr_data, supplier_id, unit_cost } = req.body;

    if (!pr_data || !pr_data.pr_id) {
      return res.status(400).json({
        success: false,
        error: 'PR data is required'
      });
    }

    logger.info({ pr_id: pr_data.pr_id, supplier_id, unit_cost }, 'API: Converting PR to PO');

    const pr = pr_data;

    // First, create the Purchase Requisition in the database (for PO reference)
    const prQuery = `
      INSERT INTO purchase_requisition (
        pr_id, pr_no, requested_by, status, notes, created_at
      ) VALUES (
        $1, $2, 'system', 'OPEN', $3, CURRENT_TIMESTAMP
      ) RETURNING pr_id
    `;

    const prNo = `PR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const prNotes = `Material: ${pr.material_name}, Quantity: ${pr.quantity} ${pr.unit}`;
    
    const prResult = await db.query(prQuery, [
      pr.pr_id, prNo, prNotes
    ]);

    logger.info({ pr_id: pr.pr_id }, 'Purchase Requisition created in database');

    // Generate PO ID FIRST (before using it in procurement request)
    const poId = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Find the correct material_id based on the PR material_name (do this ONCE for both procurement request and PO item)
    logger.info({ 
      pr_material_name: pr.material_name,
      pr_id: pr.pr_id,
      po_id: poId
    }, 'Looking up material for PR to PO conversion');

    // Get material_id from the database using material name
    const materialQuery = `SELECT material_id, name FROM material WHERE name ILIKE $1 LIMIT 1`;
    const materialResult = await db.query(materialQuery, [`%${pr.material_name}%`]);
    let materialId = materialResult.rows.length > 0 ? materialResult.rows[0].material_id : null;

    logger.info({ 
      searched_material: pr.material_name,
      found_material_id: materialId,
      found_material_name: materialResult.rows.length > 0 ? materialResult.rows[0].name : null,
      query_used: `%${pr.material_name}%`
    }, 'Material lookup result');

    // Fallback: If material not found by name, try to find by material_code or use first available
    if (!materialId) {
      logger.warn({ material_name: pr.material_name }, 'Material not found by name, trying fallback approach');
      const fallbackQuery = `SELECT material_id FROM material LIMIT 1`;
      const fallbackResult = await db.query(fallbackQuery);
      materialId = fallbackResult.rows.length > 0 ? fallbackResult.rows[0].material_id : null;
      
      if (materialId) {
        logger.warn({ 
          fallback_material_id: materialId,
          original_material_name: pr.material_name 
        }, 'Using fallback material - original material name not found');
      }
    }

    if (!materialId) {
      throw new Error(`Material not found for: ${pr.material_name}`);
    }

    // Also create a Procurement Request (for Procurement page visibility)
    try {
      await procurementRequestService.createProcurementRequest({
        material_id: materialId,
        quantity: pr.quantity,
        requested_by: 'MRP System',
        notes: `Auto-generated from MRP Planning for ${pr.material_name}. PR ID: ${pr.pr_id}. PO will be: ${poId}`,
        reference_po: poId
      });
      logger.info({ pr_id: pr.pr_id, material_id: materialId, po_id: poId }, 'Procurement Request created for Procurement page');
    } catch (procError) {
      // Don't fail the entire operation if procurement request creation fails
      logger.error({ error: procError }, 'Failed to create Procurement Request, continuing with PO creation');
    }

    // Create Purchase Order using correct column names and valid enum value
    const poQuery = `
      INSERT INTO purchase_order (
        po_id, po_no, supplier_id, pr_id, order_date, expected_date, 
        status, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, 'OPEN', 'system', CURRENT_TIMESTAMP
      ) RETURNING po_id
    `;

    const finalUnitCost = unit_cost || pr.unit_cost || 0;
    
    // Get a valid supplier ID from the database if none provided
    let supplierId = supplier_id;
    if (!supplierId) {
      const supplierQuery = `SELECT supplier_id FROM supplier LIMIT 1`;
      const supplierResult = await db.query(supplierQuery);
      supplierId = supplierResult.rows.length > 0 ? supplierResult.rows[0].supplier_id : null;
    }

    // Use PR creation date as order date, and required_date as expected_date
    const orderDate = new Date(); // Today's date for when PO was created
    const expectedDate = new Date(pr.required_date); // PR's required date as expected delivery

    logger.info({ 
      pr_required_date: pr.required_date, 
      order_date: orderDate, 
      expected_date: expectedDate 
    }, 'PO date mapping');

    const poResult = await db.query(poQuery, [
      poId, supplierId, pr.pr_id, orderDate, expectedDate
    ]);

    const purchaseOrderId = poResult.rows[0].po_id;

    // Create PO Items using correct column names
    // Use the materialId that was found earlier based on the PR material_name
    const poItemQuery = `
      INSERT INTO purchase_order_item (
        po_item_id, po_id, material_id, quantity, received_qty, unit_price, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 0, $4, CURRENT_TIMESTAMP
      ) RETURNING po_item_id
    `;

    logger.info({ 
      po_id: purchaseOrderId,
      material_id: materialId,
      material_name: pr.material_name,
      quantity: pr.quantity,
      unit_cost: finalUnitCost
    }, 'Creating PO item with correct material');

    await db.query(poItemQuery, [
      purchaseOrderId, materialId, pr.quantity, finalUnitCost
    ]);

    logger.info({ pr_id: pr.pr_id, po_id: purchaseOrderId }, 'PR successfully converted to PO');

    res.json({
      success: true,
      data: {
        pr_id: pr.pr_id,
        po_id: purchaseOrderId,
        po_no: poId,
        total_amount: pr.quantity * finalUnitCost,
        status: 'PO_CREATED'
      },
      message: 'Purchase Requisition successfully converted to Purchase Order'
    });

  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error converting PR to PO');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert PR to PO'
    });
  }
}

export default {
  runMRP,
  getMRPResults,
  generatePurchaseRequisitions,
  getMaterialRequisitions,
  getMaterialShortages,
  runMRPForProduct,
  generatePRsFromRequirements,
  getProductsForMRP,
  getSalesOrdersForMRP,
  getSalesOrderItems,
  getSuppliersForMRP,
  convertPRToPO
};

