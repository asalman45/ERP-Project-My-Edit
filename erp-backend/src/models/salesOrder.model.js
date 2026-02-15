// Sales Order Model - Handles all database operations for sales orders

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { createMasterWorkOrder, createChildWorkOrder } from '../services/hierarchicalWorkOrderService.js';
import * as routingModel from './routing.model.js';

// Generate unique order number
const generateOrderNumber = async (referenceNumber) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  if (referenceNumber) {
    // Extract PO number (remove "PO" prefix if exists, then add it back)
    const poNumber = referenceNumber.replace(/^PO/i, '').trim();
    return `SO-${dateStr}-PO${poNumber}`;
  }
  
  // Fallback if no reference number
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SO-${dateStr}-${timestamp}-${random}`;
};

// Create a new sales order
export const createSalesOrder = async (orderData) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const {
      customer_id,
      reference_number,
      customer_po_date,
      required_date,
      delivery_date,
      order_type = 'STANDARD',
      order_source = 'MANUAL',
      priority = 'NORMAL',
      shipping_method,
      shipping_address,
      delivery_instructions,
      payment_terms,
      warranty_terms,
      special_instructions,
      items = [],
      created_by = 'system'
    } = orderData;

    // Generate unique order number
    const order_number = await generateOrderNumber(reference_number);
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      subtotal += lineTotal;
    });
    
    const tax_rate = 18.00; // Default 18% tax
    const tax_amount = subtotal * (tax_rate / 100);
    const total_amount = subtotal + tax_amount;

    // Insert sales order header
    const orderQuery = `
      INSERT INTO sales_order (
        order_number, customer_id, order_date, required_date, delivery_date,
        status, priority, order_type, order_source, reference_number,
        customer_po_date, subtotal, tax_rate, tax_amount, total_amount,
        shipping_method, shipping_address, delivery_instructions,
        payment_terms, warranty_terms, special_instructions,
        created_by, created_at
      ) VALUES (
        $1, $2, CURRENT_DATE, $3, $4, 'DRAFT', $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const orderResult = await client.query(orderQuery, [
      order_number, customer_id, required_date, delivery_date, priority,
      order_type, order_source, reference_number, customer_po_date,
      subtotal, tax_rate, tax_amount, total_amount, shipping_method,
      shipping_address, delivery_instructions, payment_terms,
      warranty_terms, special_instructions, created_by
    ]);

    const salesOrder = orderResult.rows[0];

    // Insert sales order items
    const itemPromises = items.map(item => {
      const lineTotal = item.quantity * item.unit_price;
      
      const itemQuery = `
        INSERT INTO sales_order_item (
          sales_order_id, item_code, item_name, description, specification,
          quantity, unit_of_measure, unit_price, discount_percent,
          discount_amount, line_total, production_required,
          estimated_production_time, delivery_required, delivery_date,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
      
      return client.query(itemQuery, [
        salesOrder.sales_order_id,
        item.item_code || '',
        item.item_name,
        item.description || '',
        item.specification || '',
        item.quantity,
        item.unit_of_measure || 'PCS',
        item.unit_price,
        item.discount_percent || 0,
        item.discount_amount || 0,
        lineTotal,
        item.production_required !== false,
        item.estimated_production_time,
        item.delivery_required !== false,
        item.delivery_date
      ]);
    });

    const itemResults = await Promise.all(itemPromises);
    const orderItems = itemResults.map(result => result.rows[0]);

    await client.query('COMMIT');

    logger.info({
      sales_order_id: salesOrder.sales_order_id,
      order_number,
      customer_id,
      items_count: items.length,
      total_amount
    }, 'Sales order created successfully');

    return {
      ...salesOrder,
      items: orderItems
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, orderData }, 'Failed to create sales order');
    throw error;
  } finally {
    client.release();
  }
};

// Get all sales orders with filters
export const getAllSalesOrders = async (filters = {}) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      customer_id,
      start_date,
      end_date,
      search,
      order_by = 'created_at',
      order_direction = 'DESC'
    } = filters;

    let query = `
      SELECT 
        so.sales_order_id,
        so.order_number,
        so.customer_id,
        so.order_date,
        so.required_date,
        so.delivery_date,
        so.status,
        so.priority,
        so.order_type,
        so.order_source,
        so.reference_number,
        so.customer_po_date,
        so.currency,
        so.subtotal,
        so.tax_rate,
        so.tax_amount,
        so.discount_amount,
        so.shipping_cost,
        so.total_amount,
        so.shipping_method,
        so.shipping_address,
        so.delivery_instructions,
        so.payment_terms,
        so.warranty_terms,
        so.special_instructions,
        so.salesperson_id,
        so.created_by,
        so.approved_by,
        so.approved_at,
        so.created_at,
        so.updated_at,
        c.company_name as customer_name,
        c.contact_person as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        COUNT(soi.item_id) as items_count
      FROM sales_order so
      LEFT JOIN customer c ON so.customer_id = c.customer_id
      LEFT JOIN sales_order_item soi ON so.sales_order_id = soi.sales_order_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND so.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (customer_id) {
      paramCount++;
      query += ` AND so.customer_id = $${paramCount}`;
      queryParams.push(customer_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND so.order_date >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND so.order_date <= $${paramCount}`;
      queryParams.push(end_date);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        so.order_number ILIKE $${paramCount} OR 
        so.reference_number ILIKE $${paramCount} OR
        c.company_name ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    // Build GROUP BY clause with all selected columns from so
    const orderByColumn = order_by.replace(/[^a-zA-Z0-9_]/g, '');
    const orderDirection = order_direction === 'ASC' ? 'ASC' : 'DESC';
    
    query += `
      GROUP BY 
        so.sales_order_id, so.order_number, so.customer_id, so.order_date,
        so.required_date, so.delivery_date, so.status, so.priority,
        so.order_type, so.order_source, so.reference_number, so.customer_po_date,
        so.currency, so.subtotal, so.tax_rate, so.tax_amount, so.discount_amount,
        so.shipping_cost, so.total_amount, so.shipping_method, so.shipping_address,
        so.delivery_instructions, so.payment_terms, so.warranty_terms,
        so.special_instructions, so.salesperson_id, so.created_by, so.approved_by,
        so.approved_at, so.created_at, so.updated_at,
        c.company_name, c.contact_person, c.email, c.phone
      ORDER BY so.${orderByColumn} ${orderDirection}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    return result.rows;

  } catch (error) {
    logger.error({ error: error.message, filters }, 'Failed to get sales orders');
    throw error;
  }
};

// Get sales order by ID with items
export const getSalesOrderById = async (salesOrderId) => {
  try {
    // Get sales order header
    const orderQuery = `
      SELECT 
        so.*,
        c.company_name as customer_name,
        c.contact_person as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        c.billing_address as customer_billing_address,
        c.shipping_address as customer_shipping_address,
        c.tax_id as customer_tax_id,
        c.payment_terms as customer_payment_terms
      FROM sales_order so
      LEFT JOIN customer c ON so.customer_id = c.customer_id
      WHERE so.sales_order_id = $1
    `;
    
    const orderResult = await db.query(orderQuery, [salesOrderId]);
    
    if (orderResult.rows.length === 0) {
      return null;
    }

    const salesOrder = orderResult.rows[0];

    // Get sales order items
    const itemsQuery = `
      SELECT 
        soi.*,
        p.part_name as product_name,
        p.product_code,
        p.product_id
      FROM sales_order_item soi
      LEFT JOIN product p ON soi.item_code = p.product_code
      WHERE soi.sales_order_id = $1
      ORDER BY soi.created_at
    `;
    
    const itemsResult = await db.query(itemsQuery, [salesOrderId]);
    salesOrder.items = itemsResult.rows;

    return salesOrder;

  } catch (error) {
    logger.error({ error: error.message, salesOrderId }, 'Failed to get sales order by ID');
    throw error;
  }
};

// Get sales order by order number
export const getSalesOrderByNumber = async (orderNumber) => {
  try {
    const query = `
      SELECT 
        so.*,
        c.company_name as customer_name,
        c.contact_person as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone
      FROM sales_order so
      LEFT JOIN customer c ON so.customer_id = c.customer_id
      WHERE so.order_number = $1
    `;
    
    const result = await db.query(query, [orderNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const salesOrder = result.rows[0];

    // Get items
    const itemsQuery = `
      SELECT 
        soi.*,
        p.part_name as product_name,
        p.product_code,
        p.product_id
      FROM sales_order_item soi
      LEFT JOIN product p ON soi.item_code = p.product_code
      WHERE soi.sales_order_id = $1
      ORDER BY soi.created_at
    `;
    
    const itemsResult = await db.query(itemsQuery, [salesOrder.sales_order_id]);
    salesOrder.items = itemsResult.rows;

    return salesOrder;

  } catch (error) {
    logger.error({ error: error.message, orderNumber }, 'Failed to get sales order by number');
    throw error;
  }
};

/**
 * Check and allocate finished goods inventory to sales order items
 * This runs automatically when sales order is approved
 * @param {string} salesOrderId - Sales order ID
 * @returns {Promise<Object>} - Allocation summary
 */
export const allocateInventoryToSalesOrder = async (salesOrderId) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get sales order with items
    // Note: sales_order table uses so_id as primary key
    const orderQuery = `
      SELECT so.*, c.company_name as customer_name, c.customer_id
      FROM sales_order so
      LEFT JOIN customer c ON so.customer_id = c.customer_id
      WHERE so.so_id::text = $1::text
    `;
    const orderResult = await client.query(orderQuery, [salesOrderId]);
    
    if (orderResult.rows.length === 0) {
      throw new Error('Sales order not found');
    }
    
    const salesOrder = orderResult.rows[0];
    
    // Get items with product information
    // Note: sales_order_item uses 'item_code' to link to product, and 'soi_id' as primary key
    const itemsQuery = `
      SELECT 
        soi.*, 
        p.product_id,
        p.product_code,
        p.part_name as product_name,
        COALESCE(soi.quantity, soi.qty_ordered) as qty_ordered
      FROM sales_order_item soi
      LEFT JOIN product p ON soi.item_code = p.product_code OR soi.product_id = p.product_id
      WHERE soi.so_id::text = $1::text
    `;
    const itemsResult = await client.query(itemsQuery, [salesOrderId]);
    const items = itemsResult.rows;
    
    const allocationSummary = {
      total_items: items.length,
      items_allocated: 0,
      items_partially_allocated: 0,
      items_requiring_production: 0,
      total_allocated: 0,
      total_shortage: 0
    };
    
    // For each item, check inventory and allocate
    for (const item of items) {
      if (!item.product_id) {
        logger.warn({ item_id: item.item_id || item.soi_id, item_code: item.item_code }, 
          'Skipping allocation - no product_id found');
        continue;
      }
      
      const orderedQuantity = parseFloat(item.quantity || item.qty_ordered || 0);
      
      // Check available finished goods inventory
      const inventoryQuery = `
        SELECT 
          inventory_id,
          COALESCE(SUM(quantity), 0) as available_quantity
        FROM inventory
        WHERE product_id = $1 
          AND status = 'AVAILABLE'
        GROUP BY inventory_id
        ORDER BY created_at ASC
        LIMIT 1
      `;
      
      const inventoryResult = await client.query(inventoryQuery, [item.product_id]);
      const availableQuantity = parseFloat(inventoryResult.rows[0]?.available_quantity || 0);
      
      // Calculate allocation
      const quantityToAllocate = Math.min(availableQuantity, orderedQuantity);
      const shortageQuantity = Math.max(0, orderedQuantity - quantityToAllocate);
      
      // Update sales_order_item with allocation info
      // Note: sales_order_item uses 'soi_id' as primary key, not 'item_id'
      const itemId = item.soi_id || item.item_id;
      await client.query(`
        UPDATE sales_order_item
        SET qty_allocated_from_stock = $1,
            qty_to_produce = $2
        WHERE soi_id = $3
      `, [quantityToAllocate, shortageQuantity, itemId]);
      
      // If inventory available, reserve it
      if (quantityToAllocate > 0) {
        // Deduct from inventory (reserve it)
        const inventoryId = inventoryResult.rows[0]?.inventory_id;
        
        if (inventoryId) {
          await client.query(`
            UPDATE inventory
            SET quantity = quantity - $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE inventory_id = $2
              AND quantity >= $1
          `, [quantityToAllocate, inventoryId]);
          
          // Create inventory transaction to track reservation
          await client.query(`
            INSERT INTO inventory_txn (
              txn_id, inventory_id, product_id, txn_type, 
              quantity, reference, created_by, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, 'RESERVATION', 
              -$3, $4, 'system', CURRENT_TIMESTAMP
            )
          `, [inventoryId, item.product_id, quantityToAllocate, salesOrder.order_number || salesOrder.so_no]);
        }
        
        allocationSummary.total_allocated += quantityToAllocate;
        
        if (shortageQuantity > 0) {
          allocationSummary.items_partially_allocated++;
          allocationSummary.items_requiring_production++;
        } else {
          allocationSummary.items_allocated++;
        }
      }
      
      // Track shortage
      if (shortageQuantity > 0) {
        allocationSummary.total_shortage += shortageQuantity;
        if (quantityToAllocate === 0) {
          allocationSummary.items_requiring_production++;
        }
      }
    }
    
    await client.query('COMMIT');
    
    logger.info({
      sales_order_id: salesOrderId,
      order_number: salesOrder.order_number || salesOrder.so_no,
      allocation_summary: allocationSummary
    }, 'Inventory allocated to sales order');
    
    return {
      success: true,
      sales_order_id: salesOrderId,
      order_number: salesOrder.order_number || salesOrder.so_no,
      allocation_summary: allocationSummary
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, salesOrderId }, 
      'Failed to allocate inventory to sales order');
    throw error;
  } finally {
    client.release();
  }
};

// Update sales order status
export const updateSalesOrderStatus = async (salesOrderId, status, updatedBy, reason = null) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Get current status
    const currentOrder = await client.query(
      'SELECT status FROM sales_order WHERE sales_order_id = $1',
      [salesOrderId]
    );
    
    if (currentOrder.rows.length === 0) {
      throw new Error('Sales order not found');
    }
    
    const oldStatus = currentOrder.rows[0].status;
    
    // Update status (keep it simple - only update status and updated_at)
    const updateQuery = `
      UPDATE sales_order 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE sales_order_id = $2
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [status, salesOrderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Sales order not found');
    }
    
    // ⭐ NEW: If status is APPROVED, automatically allocate inventory
    if (status === 'APPROVED') {
      try {
        await allocateInventoryToSalesOrder(salesOrderId);
        logger.info({ sales_order_id: salesOrderId }, 
          'Auto-allocated inventory after approval');
      } catch (allocError) {
        logger.warn({ error: allocError.message, sales_order_id: salesOrderId }, 
          'Failed to auto-allocate inventory, but status updated');
        // Don't fail the status update if allocation fails
      }
    }
    
    // Try to record status change in history (skip if table doesn't exist)
    // Temporarily disabled to fix transaction issue
    // try {
    //   await client.query(`
    //     INSERT INTO sales_order_status_history (
    //       sales_order_id, old_status, new_status, changed_by, change_reason, changed_at
    //     ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    //   `, [salesOrderId, oldStatus, status, updatedBy, reason]);
    // } catch (historyError) {
    //   // Log the error but don't let it affect the main transaction
    //   logger.warn({ error: historyError.message }, 'Could not record status history (table may not exist)');
    // }
    
    await client.query('COMMIT');

    logger.info({
      sales_order_id: salesOrderId,
      old_status: oldStatus,
      new_status: status,
      updated_by: updatedBy
    }, 'Sales order status updated');

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, salesOrderId, status }, 'Failed to update sales order status');
    throw error;
  } finally {
    client.release();
  }
};

// Get sales order statistics
export const getSalesOrderStats = async () => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'IN_PRODUCTION' THEN 1 END) as in_production_count,
        COUNT(CASE WHEN status = 'READY_FOR_DISPATCH' THEN 1 END) as ready_dispatch_count,
        COUNT(CASE WHEN status = 'DISPATCHED' THEN 1 END) as dispatched_count,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'ON_HOLD' THEN 1 END) as on_hold_count,
        COALESCE(SUM(total_amount), 0) as total_value,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as orders_last_30_days
      FROM sales_order
    `;
    
    const result = await db.query(statsQuery);
    
    return result.rows[0];

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get sales order statistics');
    throw error;
  }
};

// Get all customers
export const getAllCustomers = async () => {
  try {
    const query = `
      SELECT 
        customer_id,
        customer_code,
        company_name,
        contact_person,
        email,
        phone,
        city,
        tax_id,
        payment_terms,
        created_at
      FROM customer
      ORDER BY company_name
    `;
    
    const result = await db.query(query);
    return result.rows;

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get customers');
    throw error;
  }
};

// Create new customer
export const createCustomer = async (customerData) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      mobile,
      billing_address,
      shipping_address,
      city,
      state,
      postal_code,
      country = 'Pakistan',
      tax_id,
      payment_terms = 'NET 30',
      credit_limit = 0
    } = customerData;

    const query = `
      INSERT INTO customer (
        company_name, contact_person, email, phone, mobile,
        billing_address, shipping_address, city, state, postal_code,
        country, tax_id, payment_terms, credit_limit, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const result = await db.query(query, [
      company_name, contact_person, email, phone, mobile,
      billing_address, shipping_address, city, state, postal_code,
      country, tax_id, payment_terms, credit_limit
    ]);
    
    logger.info({
      customer_id: result.rows[0].customer_id,
      company_name
    }, 'Customer created successfully');
    
    return result.rows[0];

  } catch (error) {
    logger.error({ error: error.message, customerData }, 'Failed to create customer');
    throw error;
  }
};

// Delete sales order
export const deleteSalesOrder = async (salesOrderId) => {
  try {
    const query = 'DELETE FROM sales_order WHERE sales_order_id = $1 RETURNING *';
    const result = await db.query(query, [salesOrderId]);
    
    if (result.rows.length === 0) {
      throw new Error('Sales order not found');
    }
    
    logger.info({ sales_order_id: salesOrderId }, 'Sales order deleted');
    return result.rows[0];

  } catch (error) {
    logger.error({ error: error.message, salesOrderId }, 'Failed to delete sales order');
    throw error;
  }
};

// Convert sales order to work orders
export const convertSalesOrderToWorkOrders = async (salesOrderId, createdBy = 'system') => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get sales order with items and linked purchase order (use client to get latest data within transaction)
    const orderQuery = `
      SELECT 
        so.*, 
        c.company_name as customer_name,
        po.po_no as purchase_order_no
      FROM sales_order so
      LEFT JOIN customer c ON so.customer_id = c.customer_id
      LEFT JOIN purchase_order po ON so.linked_po_id = po.po_id
      WHERE so.sales_order_id = $1
    `;
    const orderResult = await client.query(orderQuery, [salesOrderId]);
    
    if (orderResult.rows.length === 0) {
      throw new Error('Sales order not found');
    }
    
    const salesOrder = orderResult.rows[0];
    
    // Get items with allocation info
    const itemsQuery = `
      SELECT 
        soi.*, 
        p.part_name as product_name,
        p.product_code,
        p.product_id,
        COALESCE(soi.qty_allocated_from_stock, 0) as qty_allocated_from_stock,
        COALESCE(soi.qty_to_produce, soi.quantity) as qty_to_produce
      FROM sales_order_item soi
      LEFT JOIN product p ON soi.item_code = p.product_code
      WHERE soi.sales_order_id = $1
    `;
    const itemsResult = await client.query(itemsQuery, [salesOrderId]);
    salesOrder.items = itemsResult.rows;
    
    if (salesOrder.status !== 'APPROVED') {
      throw new Error('Sales order must be approved before converting to work orders');
    }
    
    // ⭐ MODIFIED: Filter items that need production AND have shortage
    const productionItems = salesOrder.items.filter(item => {
      const productionRequired =
        item.production_required === true ||
        item.production_required === 'true' ||
        item.production_required === 1 ||
        item.production_required === null ||
        typeof item.production_required === 'undefined';

      let qtyToProduce = parseFloat(item.qty_to_produce);

      if (isNaN(qtyToProduce) || qtyToProduce <= 0) {
        const orderedQty = parseFloat(item.quantity ?? item.qty_ordered ?? 0);
        const allocatedQty = parseFloat(item.qty_allocated_from_stock ?? 0);
        qtyToProduce = orderedQty - allocatedQty;
      }

      return productionRequired && qtyToProduce > 0;
    });
    
    if (productionItems.length === 0) {
      // Check if all items are fully allocated from stock
      const fullyAllocated = salesOrder.items.every(item => 
        parseFloat(item.qty_allocated_from_stock || 0) >= parseFloat(item.quantity || item.qty_ordered || 0)
      );
      
      if (fullyAllocated) {
        // All items are in stock, update status to READY_FOR_DISPATCH
        await client.query(
          `UPDATE sales_order SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE sales_order_id = $2`,
          ['READY_FOR_DISPATCH', salesOrderId]
        );
        
        await client.query('COMMIT');
        return {
          sales_order_id: salesOrderId,
          order_number: salesOrder.order_number || salesOrder.so_no,
          work_orders: [],
          message: 'All items available in stock, no work orders needed',
          status: 'READY_FOR_DISPATCH'
        };
      }
      
      throw new Error('No items require production in this sales order');
    }
    
    const workOrders = [];
    
    // Create hierarchical work orders for each production item
    for (const item of productionItems) {
      // Get or find product_id
      let productId = item.product_id;
      
      // If no product_id, try to find by item_code
      if (!productId && item.item_code) {
        const productResult = await client.query(
          'SELECT product_id FROM product WHERE product_code = $1 LIMIT 1',
          [item.item_code]
        );
        if (productResult.rows.length > 0) {
          productId = productResult.rows[0].product_id;
        }
      }
      
      // If still no product_id, skip this item
      if (!productId) {
        logger.warn({
          item_id: item.item_id,
          item_name: item.item_name
        }, 'Skipping work order creation - no product_id found');
        continue;
      }
      
      
      // ⭐ KEY CHANGE: Use qty_to_produce instead of full quantity
      let quantityToProduce = parseFloat(item.qty_to_produce);
      if (isNaN(quantityToProduce) || quantityToProduce <= 0) {
        const orderedQty = parseFloat(item.quantity ?? item.qty_ordered ?? 0);
        const allocatedQty = parseFloat(item.qty_allocated_from_stock ?? 0);
        quantityToProduce = orderedQty - allocatedQty;
      }
      
      if (quantityToProduce <= 0) {
        continue; // Skip if no shortage
      }
      
      // Determine purchase order reference: use linked PO number, or fallback to reference_number if it looks like a PO
      let purchaseOrderRef = salesOrder.purchase_order_no || null;
      if (!purchaseOrderRef && salesOrder.reference_number) {
        // If reference_number looks like a PO (starts with "PO" or contains "PO-"), use it
        const refNum = String(salesOrder.reference_number).trim();
        if (refNum.toUpperCase().startsWith('PO') || refNum.includes('PO-')) {
          purchaseOrderRef = refNum;
        }
      }
      
      // Create master work order with SHORTAGE quantity
      const masterWOResult = await createMasterWorkOrder({
        productId,
        quantity: quantityToProduce, // ⭐ Use shortage, not full quantity
        dueDate: item.delivery_date || salesOrder.delivery_date || salesOrder.required_date,
        startDate: salesOrder.required_date || salesOrder.order_date,
        createdBy,
        customer: salesOrder.customer_name,
        sales_order_ref: salesOrder.order_number || salesOrder.so_no,
        purchase_order_ref: purchaseOrderRef
      });
      
      const masterWO = masterWOResult.data;
      const masterWOId = masterWO.master_wo_id;
      
      // Get process flow operations for this product
      const processFlowSteps = await routingModel.findByProductId(productId, true);
      
      // Create child work orders for each process flow operation
      const childWorkOrders = [];
      if (processFlowSteps && processFlowSteps.length > 0) {
        for (const step of processFlowSteps) {
          try {
            const childWOResult = await createChildWorkOrder({
              parent_wo_id: masterWOId,
              operation_type: step.operation,
              quantity: item.quantity,
              createdBy,
              customer: salesOrder.customer_name,
              sales_order_ref: salesOrder.order_number
            });
            childWorkOrders.push(childWOResult.data);
          } catch (childError) {
            logger.error({ 
              error: childError.message, 
              operation: step.operation,
              productId 
            }, 'Failed to create child work order');
            // Continue with other operations even if one fails
          }
        }
      }
      
      // Link master work order to sales order item
      const linkQuery = `
        INSERT INTO sales_order_work_order (
          sales_order_id, sales_order_item_id, work_order_id, quantity, created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      await client.query(linkQuery, [
        salesOrderId,
        item.item_id,
        masterWOId,
        item.quantity
      ]);
      
      workOrders.push({
        ...masterWO,
        item_code: item.item_code,
        item_name: item.item_name,
        sales_order_item_id: item.item_id,
        child_work_orders: childWorkOrders,
        child_count: childWorkOrders.length
      });
    }
    
    //Only update status if work orders were created
    if (workOrders.length > 0) {
      // Update sales order status to IN_PRODUCTION
      await client.query(
        `UPDATE sales_order SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE sales_order_id = $2`,
        ['IN_PRODUCTION', salesOrderId]
      );
      
      // Try to record status history (skip if table doesn't exist)
      try {
        await client.query(
          `INSERT INTO sales_order_status_history (
            sales_order_id, old_status, new_status, changed_by, change_reason, changed_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [salesOrderId, salesOrder.status, 'IN_PRODUCTION', createdBy, 'Converted to work orders']
        );
      } catch (historyError) {
        logger.warn({ error: historyError.message }, 'Could not record status history (table may not exist)');
      }
    }
    
    await client.query('COMMIT');
    
    logger.info({
      sales_order_id: salesOrderId,
      work_orders_created: workOrders.length,
      created_by: createdBy
    }, 'Sales order converted to work orders successfully');
    
    return {
      sales_order_id: salesOrderId,
      order_number: salesOrder.order_number,
      work_orders: workOrders,
      status: 'IN_PRODUCTION'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, salesOrderId }, 'Failed to convert sales order to work orders');
    throw error;
  } finally {
    client.release();
  }
};

// Get unique OEMs from product table
export const getOEMsFromProducts = async () => {
  try {
    const query = `
      SELECT DISTINCT 
        o.oem_id,
        o.oem_name
      FROM product p
      JOIN oem o ON p.oem_id = o.oem_id
      WHERE p.category = 'FINISHED_GOOD'
      ORDER BY o.oem_name
    `;
    
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get OEMs from products');
    throw error;
  }
};

// Get product codes by OEM ID
export const getProductCodesByOEM = async (oemId) => {
  try {
    const query = `
      SELECT 
        p.product_id,
        p.product_code,
        p.part_name,
        p.description,
        p.standard_cost,
        u.code as uom_code,
        u.name as uom_name,
        m.model_name,
        o.oem_name
      FROM product p
      LEFT JOIN oem o ON p.oem_id = o.oem_id
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN uom u ON p.uom_id = u.uom_id
      WHERE p.oem_id = $1 AND p.category = 'FINISHED_GOOD'
      ORDER BY p.product_code
    `;
    
    const result = await db.query(query, [oemId]);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message, oemId }, 'Failed to get product codes by OEM');
    throw error;
  }
};
