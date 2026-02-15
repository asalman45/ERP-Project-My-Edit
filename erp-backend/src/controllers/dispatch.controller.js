// src/controllers/dispatch.controller.js
// Controller for Dispatch operations

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { getOrCreateLocation, FINISHED_GOODS_CODE } from '../services/inventory.service.js';
import pdfGeneratorService from '../services/pdfGenerator.service.js';
import fs from 'fs';

/**
 * Create a new dispatch record
 * POST /api/dispatch
 */
export async function createDispatch(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const {
      so_id,
      so_number,
      customer_name,
      customer_id,
      product_id,
      product_name,
      quantity,
      dispatch_method,
      tracking_number,
      vehicle_no,
      driver_name,
      dispatched_by,
      notes,
      location_id
    } = req.body;

    if (!so_id || !product_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Sales order ID, product ID, and quantity are required'
      });
    }

    logger.info({ so_id, so_number, product_id, quantity }, 'Creating dispatch record');

    // 1. Get sales order details
    // Log the so_id being used for debugging
    logger.info({ so_id, so_id_type: typeof so_id }, 'Looking up sales order');
    
    // sales_order table uses sales_order_id (UUID) as primary key
    // dispatch_order.so_id (TEXT) stores the UUID as text
    const soQuery = `
      SELECT 
        sales_order_id as so_id,
        customer_id, 
        status
      FROM sales_order 
      WHERE sales_order_id = CAST($1 AS uuid)
      LIMIT 1
    `;
    
    let soResult;
    try {
      soResult = await client.query(soQuery, [so_id]);
    } catch (queryError) {
      logger.error({ 
        error: queryError.message, 
        so_id, 
        query: soQuery 
      }, 'Error querying sales_order table');
      await client.query('ROLLBACK');
      return res.status(500).json({
        success: false,
        error: `Database error: ${queryError.message}`
      });
    }
    
    if (soResult.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.warn({ so_id }, 'Sales order not found');
      return res.status(404).json({
        success: false,
        error: `Sales order not found with ID: ${so_id}`
      });
    }

    const salesOrder = soResult.rows[0];
    const finalCustomerId = customer_id || salesOrder.customer_id;

    // 2. Create dispatch order
    const dispatchId = uuidv4();
    // Generate short dispatch number (7-8 characters): DISP + 3-4 digit random number
    // Format: DISP123 (7 chars) or DISP1234 (8 chars)
    const randomNum = Math.floor(100 + Math.random() * 9900); // 3-4 digit number (100-9999)
    const dispatchNo = `DISP${randomNum}`;

    const dispatchOrderQuery = `
      INSERT INTO dispatch_order (
        dispatch_id, dispatch_no, so_id, customer_id, location_id,
        vehicle_no, driver_name, dispatch_date, created_by, status
      ) VALUES (
        $1, $2, $3::text, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, 'DISPATCHED'
      ) RETURNING dispatch_id, dispatch_no
    `;

    // Ensure so_id is stored as text (dispatch_order.so_id is TEXT column)
    const dispatchResult = await client.query(dispatchOrderQuery, [
      dispatchId,
      dispatchNo,
      String(so_id), // Explicitly convert to string
      finalCustomerId,
      location_id || null,
      vehicle_no || null,
      driver_name || null,
      dispatched_by || 'system'
    ]);

    const createdDispatch = dispatchResult.rows[0];

    // 3. Create dispatch item
    const dispatchItemId = uuidv4();
    
    // Get UOM from product
    const productQuery = `SELECT uom_id FROM product WHERE product_id = $1`;
    const productResult = await client.query(productQuery, [product_id]);
    const uomId = productResult.rows[0]?.uom_id || null;

    const dispatchItemQuery = `
      INSERT INTO dispatch_item (
        di_id, dispatch_id, product_id, qty, uom_id
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING di_id
    `;

    await client.query(dispatchItemQuery, [
      dispatchItemId,
      dispatchId,
      product_id,
      quantity,
      uomId
    ]);

    // 4. Update Finished Goods inventory status instead of removing the record
    let finishedGoodsLocationId = null;
    try {
      finishedGoodsLocationId = location_id || await getOrCreateLocation(
        FINISHED_GOODS_CODE,
        'Finished Goods Warehouse',
        'FINISHED_GOODS'
      );

      const inventorySelectQuery = `
        SELECT inventory_id, quantity, uom_id, batch_no
        FROM inventory
        WHERE product_id = $1
          AND location_id = $2
          AND status = 'AVAILABLE'
        ORDER BY updated_at ASC
        FOR UPDATE
      `;

      const inventoryResult = await client.query(inventorySelectQuery, [product_id, finishedGoodsLocationId]);
      const inventoryRows = inventoryResult.rows || [];

      const totalAvailable = inventoryRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
      if (totalAvailable < quantity) {
        throw new Error(`Insufficient finished goods inventory. Available: ${totalAvailable}, Required: ${quantity}`);
      }

      let remainingToDispatch = quantity;
      const dispatchedInventoryEntries = [];

      for (const record of inventoryRows) {
        if (remainingToDispatch <= 0) break;

        const recordQty = Number(record.quantity || 0);
        if (recordQty <= 0) continue;

        if (remainingToDispatch >= recordQty) {
          await client.query(
            `UPDATE inventory 
             SET status = 'ISSUED', updated_at = NOW() 
             WHERE inventory_id = $1`,
            [record.inventory_id]
          );

          dispatchedInventoryEntries.push({
            inventory_id: record.inventory_id,
            quantity: recordQty
          });

          remainingToDispatch -= recordQty;
        } else {
          const remainingQuantity = recordQty - remainingToDispatch;

          await client.query(
            `UPDATE inventory 
             SET quantity = $1, updated_at = NOW() 
             WHERE inventory_id = $2`,
            [remainingQuantity, record.inventory_id]
          );

          const newInventoryId = uuidv4();
          await client.query(
            `INSERT INTO inventory (
              inventory_id, product_id, quantity, location_id, uom_id, batch_no, status, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, 'ISSUED', NOW(), NOW()
            )`,
            [
              newInventoryId,
              product_id,
              remainingToDispatch,
              finishedGoodsLocationId,
              record.uom_id || null,
              record.batch_no || null
            ]
          );

          dispatchedInventoryEntries.push({
            inventory_id: newInventoryId,
            quantity: remainingToDispatch
          });

          remainingToDispatch = 0;
        }
      }

      for (const entry of dispatchedInventoryEntries) {
        await client.query(
          `INSERT INTO inventory_txn (
             txn_id, inventory_id, product_id, quantity, txn_type, location_id, reference, created_by, created_at
           ) VALUES (
             $1, $2, $3, $4, 'ISSUE', $5, $6, $7, NOW()
           )`,
          [
            uuidv4(),
            entry.inventory_id,
            product_id,
            -Math.abs(entry.quantity),
            finishedGoodsLocationId,
            `DISPATCH-${dispatchNo}`,
            dispatched_by || 'system'
          ]
        );
      }

      logger.info({
        product_id,
        quantity,
        dispatch_no: dispatchNo,
        location_id: finishedGoodsLocationId,
        inventory_records_updated: dispatchedInventoryEntries.length
      }, 'Finished goods marked as issued without removing inventory records');
    } catch (invError) {
      logger.error({ error: invError.message, stack: invError.stack }, 'Failed to update finished goods status, but dispatch created');
      // Continue with dispatch even if inventory update fails (will be logged)
    }

    // 5. Track shipped quantity via dispatch_item records
    // Fetch sales order items so we can match using product_id, item_code or name
    // sales_order_item table uses sales_order_id (UUID) as foreign key
    // Actual DB schema uses: item_id (UUID) and quantity
    const salesOrderItemsQuery = `
      SELECT 
        item_id,
        quantity,
        product_id,
        item_code,
        item_name
      FROM sales_order_item
      WHERE sales_order_id = CAST($1 AS uuid)
    `;
    const salesOrderItemsResult = await client.query(salesOrderItemsQuery, [so_id]);

    if (salesOrderItemsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'No items found for this sales order'
      });
    }

    const productInfoQuery = `
      SELECT product_code, part_name
      FROM product
      WHERE product_id = $1
    `;
    const productInfoResult = await client.query(productInfoQuery, [product_id]);
    const productInfo = productInfoResult.rows[0] || {};

    const normalize = (value) =>
      (value || '').toString().trim().toLowerCase();

    const requestedItemCode = req.body?.item_code;
    const requestedProductCode = req.body?.product_code;

    const salesOrderItem = salesOrderItemsResult.rows.find((item) => {
      if (item.product_id && item.product_id === product_id) {
        return true;
      }

      if (requestedItemCode && item.item_code && normalize(item.item_code) === normalize(requestedItemCode)) {
        return true;
      }

      if (requestedProductCode && item.item_code && normalize(item.item_code) === normalize(requestedProductCode)) {
        return true;
      }

      if (productInfo.product_code && item.item_code && normalize(item.item_code) === normalize(productInfo.product_code)) {
        return true;
      }

      if (productInfo.part_name && item.item_name && normalize(item.item_name) === normalize(productInfo.part_name)) {
        return true;
      }

      return false;
    });

    if (!salesOrderItem) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Sales order item not found for this product'
      });
    }

    // If the matched sales order item is missing product_id, update it for future lookups
    if (!salesOrderItem.product_id) {
      await client.query(
        `UPDATE sales_order_item SET product_id = $1 WHERE item_id = $2`,
        [product_id, salesOrderItem.item_id]
      );
    }

    const orderedQty = Number(salesOrderItem.quantity || 0);
    
    // Calculate total shipped quantity from all dispatch_item records for this sales order item
    // d.so_id is TEXT storing UUID, di.product_id is also TEXT storing UUID
    // Need to cast both to UUID for comparison
    const shippedQtyQuery = `
      SELECT COALESCE(SUM(di.qty), 0) as total_shipped
      FROM dispatch_order d
      JOIN dispatch_item di ON d.dispatch_id = di.dispatch_id
      WHERE CAST(d.so_id AS uuid) = CAST($1 AS uuid)
        AND CAST(di.product_id AS uuid) = CAST($2 AS uuid)
    `;
    const shippedResult = await client.query(shippedQtyQuery, [so_id, product_id]);
    const currentShippedQty = Number(shippedResult.rows[0]?.total_shipped || 0);
    const newShippedQty = currentShippedQty + quantity;
    
    // 6. Check if all items shipped, then update sales order status
    const allShipped = newShippedQty >= orderedQty;
    
    // Check if all items shipped, then update sales order status to DISPATCHED
    if (allShipped) {
      // Check all items for this sales order - see if all are fully dispatched
      const allItemsQuery = `
        SELECT 
          soi.item_id,
          soi.quantity as ordered_qty,
          COALESCE(SUM(di.qty), 0) as shipped_qty
        FROM sales_order_item soi
        LEFT JOIN dispatch_order d ON CAST(d.so_id AS uuid) = soi.sales_order_id
        LEFT JOIN dispatch_item di ON d.dispatch_id = di.dispatch_id AND CAST(di.product_id AS uuid) = soi.product_id
        WHERE soi.sales_order_id = CAST($1 AS uuid)
        GROUP BY soi.item_id, soi.quantity
      `;
      const allItemsResult = await client.query(allItemsQuery, [so_id]);
      
      const allFullyShipped = allItemsResult.rows.every(row => 
        Number(row.shipped_qty) >= Number(row.ordered_qty)
      );
      
      if (allFullyShipped && allItemsResult.rows.length > 0) {
        // Update sales order status to DISPATCHED
        // sales_order table uses sales_order_id (UUID) as primary key
        await client.query(`
          UPDATE sales_order 
          SET status = 'DISPATCHED'
          WHERE sales_order_id = CAST($1 AS uuid)
        `, [so_id]);
        
        logger.info({ so_id }, 'Sales order status updated to DISPATCHED');
      }
    }

    await client.query('COMMIT');

    logger.info({
      dispatch_id: dispatchId,
      dispatch_no: dispatchNo,
      so_id,
      product_id,
      quantity
    }, 'Dispatch record created successfully');

    res.json({
      success: true,
      data: {
        dispatch_id: dispatchId,
        dispatch_no: dispatchNo,
        so_id,
        product_id,
        quantity
      },
      message: 'Dispatch order created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, stack: error.stack, body: req.body }, 'Error creating dispatch record');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create dispatch record'
    });
  } finally {
    client.release();
  }
}

/**
 * Get all dispatch records
 * GET /api/dispatch
 */
export async function getDispatchRecords(req, res) {
  try {
    const query = `
      SELECT 
        d.dispatch_id,
        d.dispatch_no,
        d.so_id,
        so.order_number as so_number,
        so.reference_number as po_number,
        c.company_name as customer_name,
        d.vehicle_no,
        d.driver_name,
        d.dispatch_date,
        d.created_by as dispatched_by,
        d.status,
        d.created_at,
        di.product_id,
        p.product_code,
        p.part_name as product_name,
        di.qty as quantity,
        u.code as uom_code
      FROM dispatch_order d
      LEFT JOIN sales_order so ON d.so_id = so.sales_order_id::text
      LEFT JOIN customer c ON d.customer_id = c.customer_id
      LEFT JOIN dispatch_item di ON d.dispatch_id = di.dispatch_id
      LEFT JOIN product p ON di.product_id = p.product_id
      LEFT JOIN uom u ON di.uom_id = u.uom_id
      ORDER BY d.dispatch_date DESC, d.created_at DESC
    `;

    const result = await db.query(query);

    // Group by dispatch_id to combine items
    const dispatchMap = new Map();
    result.rows.forEach(row => {
      if (!dispatchMap.has(row.dispatch_id)) {
        dispatchMap.set(row.dispatch_id, {
          dispatch_id: row.dispatch_id,
          dispatch_no: row.dispatch_no,
          so_id: row.so_id,
          so_number: row.so_number,
          po_number: row.po_number,
          customer_name: row.customer_name,
          vehicle_no: row.vehicle_no,
          driver_name: row.driver_name,
          dispatch_date: row.dispatch_date,
          dispatched_by: row.dispatched_by,
          status: row.status,
          created_at: row.created_at,
          items: []
        });
      }
      
      if (row.product_id) {
        dispatchMap.get(row.dispatch_id).items.push({
          product_id: row.product_id,
          product_code: row.product_code,
          product_name: row.product_name,
          quantity: row.quantity,
          uom_code: row.uom_code
        });
      }
    });

    const dispatchRecords = Array.from(dispatchMap.values());

    res.json({
      success: true,
      data: dispatchRecords
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching dispatch records');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dispatch records'
    });
  }
}

/**
 * Update dispatch status (e.g., DELIVERED)
 * PUT /api/dispatch/:dispatchId/status
 */
export async function updateDispatchStatus(req, res) {
  try {
    const { dispatchId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Fix: Cast status to enum type and use separate parameter for comparison to avoid type inference issues
    const query = `
      UPDATE dispatch_order 
      SET status = $1::"DispatchStatus", 
          dispatch_date = CASE 
            WHEN $3 = true THEN COALESCE(dispatch_date, CURRENT_TIMESTAMP) 
            ELSE dispatch_date 
          END
      WHERE dispatch_id = $2
      RETURNING dispatch_id, dispatch_no, status, so_id
    `;

    const isDelivered = status === 'DELIVERED';
    const result = await db.query(query, [status, dispatchId, isDelivered]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch order not found'
      });
    }

    const dispatch = result.rows[0];

    // If status is DELIVERED, check if all items for sales order are delivered
    if (status === 'DELIVERED' && dispatch.so_id) {
      const checkQuery = `
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered
        FROM dispatch_order
        WHERE so_id = $1::text
      `;
      const checkResult = await db.query(checkQuery, [dispatch.so_id]);
      const { total, delivered } = checkResult.rows[0];

      if (parseInt(total) === parseInt(delivered)) {
        // Update sales order status to DELIVERED (not COMPLETED - DELIVERED is the correct status)
        // sales_order table uses sales_order_id (UUID) as primary key
        await db.query(`
          UPDATE sales_order 
          SET status = 'DELIVERED'
          WHERE sales_order_id = CAST($1 AS uuid)
        `, [dispatch.so_id]);
        
        logger.info({ so_id: dispatch.so_id }, 'Sales order status updated to DELIVERED');
      }
    }

    logger.info({ dispatch_id: dispatchId, status }, 'Dispatch status updated');

    res.json({
      success: true,
      data: dispatch,
      message: `Dispatch status updated to ${status}`
    });

  } catch (error) {
    logger.error({ error }, 'Error updating dispatch status');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update dispatch status'
    });
  }
}

/**
 * Generate Dispatch Invoice PDF
 * GET /api/dispatch/:dispatchId/invoice-pdf
 */
export async function generateDispatchInvoicePDF(req, res) {
  try {
    const { dispatchId } = req.params;

    // Fetch dispatch order with customer and sales order info
    const dispatchQuery = `
      SELECT 
        d.dispatch_id,
        d.dispatch_no,
        d.dispatch_date,
        d.vehicle_no,
        d.driver_name,
        d.created_by,
        d.status,
        d.so_id,
        c.customer_id,
        c.company_name as customer_name,
        c.customer_code,
        COALESCE(c.billing_address, c.shipping_address) as customer_address,
        c.phone as contact_phone,
        c.email as customer_email,
        c.contact_person,
        c.tax_id as customer_ntn,
        so.order_number as so_number,
        so.order_date as so_date,
        so.tax_rate,
        so.subtotal as so_subtotal,
        so.tax_amount as so_tax_amount,
        so.total_amount as so_total_amount
      FROM dispatch_order d
      LEFT JOIN customer c ON d.customer_id = c.customer_id
      LEFT JOIN sales_order so ON d.so_id = so.sales_order_id::text
      WHERE d.dispatch_id = $1
    `;

    const dispatchResult = await db.query(dispatchQuery, [dispatchId]);

    if (dispatchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dispatch order not found'
      });
    }

    const dispatch = dispatchResult.rows[0];

    // Get sales_order_id from dispatch.so_id if available
    const salesOrderId = dispatch.so_id || null;

    // Fetch dispatch items with product details INCLUDING OEM and Model
    // Use unit_price from sales_order_item, fallback to product.standard_cost if NULL
    const itemsQuery = salesOrderId ? `
      SELECT 
        di.di_id,
        di.qty as quantity,
        p.product_id,
        p.product_code,
        p.part_name as product_name,
        p.description,
        o.oem_name,
        m.model_name,
        COALESCE(soi.unit_price, p.standard_cost, 0) as unit_price,
        u.code as uom_code
      FROM dispatch_item di
      LEFT JOIN product p ON di.product_id = p.product_id
      LEFT JOIN oem o ON p.oem_id = o.oem_id
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN sales_order_item soi ON (
        soi.sales_order_id = CAST($2 AS uuid)
        AND (
          (soi.product_id IS NOT NULL AND soi.product_id::text = di.product_id::text)
          OR (soi.item_code IS NOT NULL AND soi.item_code = p.product_code)
        )
      )
      LEFT JOIN uom u ON di.uom_id = u.uom_id
      WHERE di.dispatch_id = $1
    ` : `
      SELECT 
        di.di_id,
        di.qty as quantity,
        p.product_id,
        p.product_code,
        p.part_name as product_name,
        p.description,
        o.oem_name,
        m.model_name,
        COALESCE(p.standard_cost, 0) as unit_price,
        u.code as uom_code
      FROM dispatch_item di
      LEFT JOIN product p ON di.product_id = p.product_id
      LEFT JOIN oem o ON p.oem_id = o.oem_id
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN uom u ON di.uom_id = u.uom_id
      WHERE di.dispatch_id = $1
    `;

    const itemsResult = await db.query(
      itemsQuery, 
      salesOrderId ? [dispatchId, salesOrderId] : [dispatchId]
    );
    
    // Debug: Log the query results to verify unit_price
    logger.info({
      dispatchId,
      salesOrderId,
      itemsCount: itemsResult.rows.length,
      items: itemsResult.rows.map(row => ({
        product_code: row.product_code,
        product_id: row.product_id,
        unit_price: row.unit_price,
        standard_cost: row.standard_cost
      }))
    }, 'Dispatch invoice items query results');
    
    // Map items with OEM/Model info
    const items = itemsResult.rows.map(item => ({
      product_id: item.product_id,
      product_code: item.product_code,
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price) || 0,  // Ensure numeric conversion
      uom_code: item.uom_code,
      oem_name: item.oem_name,
      model_name: item.model_name
    }));

    // Extract OEM and Model information from items
    const oemInfo = itemsResult.rows
      .filter(item => item.oem_name || item.model_name)
      .map(item => ({
        oem_name: item.oem_name,
        model_name: item.model_name
      }));

    // Get unique OEMs and Models
    const uniqueOEMs = [...new Set(itemsResult.rows.map(item => item.oem_name).filter(Boolean))];
    const uniqueModels = [...new Set(itemsResult.rows.map(item => item.model_name).filter(Boolean))];

    // Prepare dispatch data for PDF generation
    const dispatchData = {
      dispatch_no: dispatch.dispatch_no,
      dispatch_date: dispatch.dispatch_date || dispatch.created_at,
      customer_name: dispatch.customer_name,
      customer_code: dispatch.customer_code,
      customer_address: dispatch.customer_address,
      contact_phone: dispatch.contact_phone,
      customer_email: dispatch.customer_email,
      so_number: dispatch.so_number,
      vehicle_no: dispatch.vehicle_no,
      driver_name: dispatch.driver_name,
      items: items,
      oem_name: uniqueOEMs.length === 1 ? uniqueOEMs[0] : (uniqueOEMs.length > 1 ? uniqueOEMs.join(', ') : null),
      model_name: uniqueModels.length === 1 ? uniqueModels[0] : (uniqueModels.length > 1 ? uniqueModels.join(', ') : null),
      oem_info: oemInfo.length > 0 ? oemInfo : null,
      tax_percentage: dispatch.tax_rate || 18,  // Use sales order tax rate, fallback to 18%
      subtotal: dispatch.so_subtotal || null,  // Use sales order subtotal
      tax_amount: dispatch.so_tax_amount || null,  // Use sales order tax amount
      total_amount: dispatch.so_total_amount || null  // Use sales order total amount
    };

    // Generate PDF
    const pdfResult = await pdfGeneratorService.createDispatchInvoicePDF(dispatchData);

    if (!pdfResult.success) {
      return res.status(500).json({
        success: false,
        error: `PDF generation failed: ${pdfResult.error}`
      });
    }

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
    
    const pdfBuffer = fs.readFileSync(pdfResult.filePath);
    res.send(pdfBuffer);

    logger.info({
      dispatch_id: dispatchId,
      dispatch_no: dispatch.dispatch_no,
      file_name: pdfResult.fileName,
      oem_name: dispatchData.oem_name
    }, 'Dispatch Invoice PDF generated and sent');

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, dispatchId: req.params.dispatchId }, 'Error generating dispatch invoice PDF');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate dispatch invoice PDF'
    });
  }
}

export default {
  createDispatch,
  getDispatchRecords,
  updateDispatchStatus,
  generateDispatchInvoicePDF
};
