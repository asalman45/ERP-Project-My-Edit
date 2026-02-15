// src/controllers/api/inventory/finished-goods.controller.js
import { PrismaClient, Prisma } from '@prisma/client';
import inventoryService from '../../../services/inventory.service.js';
import { logger } from '../../../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Finished Goods API Controller
 * Handles finished goods production and inventory management
 */

/**
 * POST /api/inventory/finished-goods
 * Receive finished goods from production
 */
export const receiveFinishedGoods = async (req, res) => {
  try {
    const {
      product_id,
      quantity,
      location_id,
      wo_id,
      batch_no,
      unit_cost,
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    if (!product_id || !quantity || !location_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: product_id, quantity, location_id'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Finished goods quantity must be positive'
      });
    }

    // Business Logic: Receive Finished Goods
    const result = await inventoryService.receiveFinishedGoods(product_id, quantity, location_id, {
      woId: wo_id,
      batchNo: batch_no,
      unitCost: unit_cost,
      createdBy: created_by
    });

    logger.info({
      product_id,
      quantity,
      location_id,
      wo_id,
      inventory_id: result.inventory.inventory_id
    }, 'Finished goods received successfully');

    return res.status(200).json({
      success: true,
      message: 'Finished goods received successfully',
      data: {
        inventory: result.inventory,
        transaction: result.transaction,
        new_quantity: result.newQuantity
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Failed to receive finished goods');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to receive finished goods'
    });
    // Auto-allocation & planned production status updates (non-critical)
    if (wo_id) {
      try {
        // Allocate to linked sales order item if present
        const soLink = await prisma.sales_order_work_order.findFirst({
          where: { work_order_id: wo_id },
        });

        if (soLink?.sales_order_item_id) {
          const item = await prisma.sales_order_item.findUnique({
            where: { soi_id: soLink.sales_order_item_id },
            select: {
              soi_id: true,
              quantity: true,
              qty_ordered: true,
              qty_allocated_from_stock: true,
            },
          });

          if (item) {
            const orderedQty = Number(item.quantity ?? item.qty_ordered ?? 0);
            const alreadyAllocated = Number(item.qty_allocated_from_stock ?? 0);
            const remainingToAllocate = Math.max(0, orderedQty - alreadyAllocated);
            const qtyToAllocate = Math.min(Number(quantity), remainingToAllocate);

            if (qtyToAllocate > 0) {
              await prisma.$executeRaw`
                UPDATE sales_order_item
                SET qty_allocated_from_stock = COALESCE(qty_allocated_from_stock, 0) + ${qtyToAllocate},
                    qty_to_produce = GREATEST(0, COALESCE(qty_to_produce, ${orderedQty}) - ${qtyToAllocate})
                WHERE soi_id = ${item.soi_id}
              `;
            }
          }
        }

        // Update planned production status if the work order originated from a plan
        const planLink = await prisma.$queryRaw`
          SELECT 
            pp.planned_production_id,
            pp.status
          FROM work_order wo
          INNER JOIN planned_production pp ON wo.sales_order_ref = pp.plan_number
          WHERE wo.wo_id = ${wo_id}
          LIMIT 1
        `;

        if (Array.isArray(planLink) && planLink.length > 0) {
          const plan = planLink[0];
          if (plan?.planned_production_id && plan.status !== 'COMPLETED') {
            await prisma.$executeRaw`
              UPDATE planned_production
              SET status = 'COMPLETED',
                  end_date = CURRENT_DATE,
                  updated_at = CURRENT_TIMESTAMP
              WHERE planned_production_id = ${plan.planned_production_id}
            `;
          }
        }
      } catch (postProcessError) {
        logger.warn({
          error: postProcessError.message,
          work_order_id: wo_id,
        }, 'Finished goods received but post-processing failed');
      }
    }

  }
};

/**
 * POST /api/inventory/finished-goods/bulk
 * Bulk receive finished goods from production
 */
export const bulkReceiveFinishedGoods = async (req, res) => {
  try {
    const {
      wo_id,
      products,
      location_id,
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    if (!wo_id || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wo_id, products (array)'
      });
    }

    if (!location_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: location_id'
      });
    }

    const results = [];
    const errors = [];

    // Process each product
    for (const product of products) {
      try {
        if (!product.product_id || !product.quantity) {
          errors.push({
            product_id: product.product_id,
            error: 'Missing product_id or quantity'
          });
          continue;
        }

        const result = await inventoryService.receiveFinishedGoods(
          product.product_id,
          product.quantity,
          location_id,
          {
            woId: wo_id,
            batchNo: product.batch_no,
            unitCost: product.unit_cost,
            createdBy: created_by
          }
        );

        results.push({
          product_id: product.product_id,
          success: true,
          result: result
        });

      } catch (error) {
        errors.push({
          product_id: product.product_id,
          error: error.message
        });
      }
    }

    logger.info({
      wo_id,
      products_count: products.length,
      successful: results.length,
      failed: errors.length
    }, 'Bulk finished goods receive completed');

    return res.status(200).json({
      success: true,
      message: `Bulk finished goods receive completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Bulk finished goods receive failed');

    return res.status(500).json({
      success: false,
      error: 'Failed to process bulk finished goods receive'
    });
  }
};

/**
 * GET /api/inventory/finished-goods
 * Get finished goods inventory
 */
export const getFinishedGoods = async (req, res) => {
  try {
    const { limit = 50, offset = 0, product_id, location_id } = req.query;

    // Build query conditions
    const whereClause = {
      product_id: { not: null }, // Only finished goods (products)
      status: 'AVAILABLE'
    };

    if (product_id) whereClause.product_id = product_id;
    if (location_id) whereClause.location_id = location_id;

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            oem: true,
            model: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { updated_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: inventory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: inventory.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get finished goods');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve finished goods'
    });
  }
};

/**
 * GET /api/inventory/finished-goods/history
 * Get finished goods receive history
 */
export const getFinishedGoodsHistory = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      product_id, 
      location_id, 
      wo_id, 
      start_date, 
      end_date, 
      txn_type 
    } = req.query;

    const validTxnTypes = ['RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN'];

    const whereClause = {
      product_id: { not: null }
    };

    if (txn_type) {
      const normalizedType = txn_type.toUpperCase();
      if (validTxnTypes.includes(normalizedType)) {
        whereClause.txn_type = normalizedType;
      }
    } else {
      whereClause.txn_type = { in: validTxnTypes };
    }

    if (product_id) whereClause.product_id = product_id;
    if (location_id) whereClause.location_id = location_id;
    if (wo_id) whereClause.wo_id = wo_id;
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) whereClause.created_at.gte = new Date(start_date);
      if (end_date) whereClause.created_at.lte = new Date(end_date);
    }

    const transactions = await prisma.inventoryTxn.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            oem: true,
            model: true
          }
        },
        location: true,
        workOrder: true,
        inventory: {
          select: {
            status: true,
            quantity: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const statusMap = {
      RECEIVE: 'Ready for Dispatch',
      ISSUE: 'Dispatched',
      TRANSFER: 'Transferred',
      RETURN: 'Returned',
      ADJUSTMENT: 'Adjusted'
    };

    const enriched = transactions.map((txn) => {
      const direction = txn.quantity >= 0 ? 'IN' : 'OUT';
      const absoluteQuantity = Math.abs(txn.quantity || 0);
      const status = statusMap[txn.txn_type] || txn.txn_type;

      return {
        ...txn,
        status,
        direction,
        absoluteQuantity,
        inventory_status: txn.inventory?.status || null,
        inventory_quantity: txn.inventory?.quantity ?? null
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: enriched.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get finished goods history');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve finished goods history'
    });
  }
};

/**
 * GET /api/inventory/finished-goods/dispatchable-balance
 * Returns per-product breakdown of available, reserved, dispatched quantities
 */
export const getFinishedGoodsDispatchableBalance = async (req, res) => {
  try {
    const { product_id } = req.query;

    const availableRows = product_id
      ? await prisma.$queryRaw`
      SELECT
        CAST(inv.product_id AS uuid) AS product_id,
        SUM(inv.quantity) AS available_quantity
      FROM inventory inv
      WHERE inv.status = 'AVAILABLE'
        AND inv.product_id IS NOT NULL
        AND inv.product_id = CAST(${product_id} AS uuid)
      GROUP BY inv.product_id
      `
      : await prisma.$queryRaw`
      SELECT
        CAST(inv.product_id AS uuid) AS product_id,
        SUM(inv.quantity) AS available_quantity
      FROM inventory inv
      WHERE inv.status = 'AVAILABLE'
        AND inv.product_id IS NOT NULL
      GROUP BY inv.product_id
    `;

    const reservedRows = product_id
      ? await prisma.$queryRaw`
      WITH allocated AS (
        SELECT
          CAST(soi.product_id AS uuid) AS product_id,
          SUM(COALESCE(soi.qty_allocated_from_stock, 0)) AS total_allocated
        FROM sales_order_item soi
        WHERE soi.product_id IS NOT NULL
          AND CAST(soi.product_id AS uuid) = CAST(${product_id} AS uuid)
        GROUP BY CAST(soi.product_id AS uuid)
      ),
      shipped AS (
        SELECT
          CAST(di.product_id AS uuid) AS product_id,
          SUM(COALESCE(di.qty, 0)) AS total_shipped
        FROM dispatch_item di
        WHERE di.product_id IS NOT NULL
          AND CAST(di.product_id AS uuid) = CAST(${product_id} AS uuid)
        GROUP BY CAST(di.product_id AS uuid)
      )
      SELECT
        COALESCE(a.product_id, s.product_id) AS product_id,
        COALESCE(a.total_allocated, 0) AS total_allocated,
        COALESCE(s.total_shipped, 0) AS total_shipped
      FROM allocated a
      FULL OUTER JOIN shipped s ON a.product_id = s.product_id
      WHERE COALESCE(a.product_id, s.product_id) IS NOT NULL
    `
      : await prisma.$queryRaw`
      WITH allocated AS (
        SELECT
          CAST(soi.product_id AS uuid) AS product_id,
          SUM(COALESCE(soi.qty_allocated_from_stock, 0)) AS total_allocated
        FROM sales_order_item soi
        WHERE soi.product_id IS NOT NULL
        GROUP BY CAST(soi.product_id AS uuid)
      ),
      shipped AS (
        SELECT
          CAST(di.product_id AS uuid) AS product_id,
          SUM(COALESCE(di.qty, 0)) AS total_shipped
        FROM dispatch_item di
        WHERE di.product_id IS NOT NULL
        GROUP BY CAST(di.product_id AS uuid)
      )
      SELECT
        COALESCE(a.product_id, s.product_id) AS product_id,
        COALESCE(a.total_allocated, 0) AS total_allocated,
        COALESCE(s.total_shipped, 0) AS total_shipped
      FROM allocated a
      FULL OUTER JOIN shipped s ON a.product_id = s.product_id
      WHERE COALESCE(a.product_id, s.product_id) IS NOT NULL
    `;

    const dispatchedRows = product_id
      ? await prisma.$queryRaw`
      SELECT
        di.product_id,
        SUM(COALESCE(di.qty, 0)) AS dispatched_quantity
      FROM dispatch_item di
      WHERE di.product_id IS NOT NULL
        AND CAST(di.product_id AS uuid) = CAST(${product_id} AS uuid)
      GROUP BY CAST(di.product_id AS uuid)
    `
      : await prisma.$queryRaw`
      SELECT
        CAST(di.product_id AS uuid) AS product_id,
        SUM(COALESCE(di.qty, 0)) AS dispatched_quantity
      FROM dispatch_item di
      WHERE di.product_id IS NOT NULL
      GROUP BY CAST(di.product_id AS uuid)
    `;

    const resultMap = new Map();

    const touchRecord = (productId) => {
      if (!productId) return null;
      // Normalize product_id to string for consistent map key matching
      const normalizedId = String(productId);
      if (!resultMap.has(normalizedId)) {
        resultMap.set(normalizedId, {
          product_id: normalizedId,
          product_code: null,
          product_name: null,
          available_quantity: 0,
          reserved_quantity: 0,
          dispatched_quantity: 0,
        });
      }
      return resultMap.get(normalizedId);
    };

    availableRows.forEach((row) => {
      const record = touchRecord(row.product_id);
      if (record) {
        record.available_quantity = Number(row.available_quantity || 0);
      }
    });

    reservedRows.forEach((row) => {
      const record = touchRecord(row.product_id);
      if (record) {
        const totalAllocated = Number(row.total_allocated || 0);
        const totalShipped = Number(row.total_shipped || 0);
        record.reserved_quantity = Math.max(0, totalAllocated - totalShipped);
        record.dispatched_quantity = totalShipped;
      }
    });

    dispatchedRows.forEach((row) => {
      const record = touchRecord(row.product_id);
      if (record) {
        // dispatched quantity might already be set from reservedRows; ensure max
        const shipped = Number(row.dispatched_quantity || 0);
        record.dispatched_quantity = Math.max(record.dispatched_quantity || 0, shipped);
      }
    });

    const productIds = Array.from(resultMap.keys());

    if (productIds.length > 0) {
      const productDetails = await prisma.product.findMany({
        where: {
          product_id: {
            in: productIds,
          },
        },
        select: {
          product_id: true,
          product_code: true,
          part_name: true,
        },
      });

      productDetails.forEach((product) => {
        // Normalize product_id to string for consistent map key matching
        const normalizedId = String(product.product_id);
        const record = resultMap.get(normalizedId);
        if (record) {
          record.product_code = product.product_code || null;
          record.product_name = product.part_name || null;
        }
      });
    }

    const responseData = Array.from(resultMap.values()).map((record) => ({
      ...record,
      product_id: String(record.product_id), // Ensure product_id is always a string for consistent matching
      ready_to_dispatch: Math.min(record.available_quantity, record.reserved_quantity || record.available_quantity),
    }));

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      query: req.query,
    }, 'Failed to compute dispatchable balance');

    return res.status(500).json({
      success: false,
      error: 'Failed to compute dispatchable balance',
    });
  }
};

/**
 * GET /api/inventory/finished-goods/export
 * Export finished goods data to CSV/Excel
 */
export const exportFinishedGoods = async (req, res) => {
  try {
    const { format = 'csv', product_id, location_id, start_date, end_date } = req.query;

    // Build query conditions
    const whereClause = {
      product_id: { not: null }, // Only finished goods (products)
      status: 'AVAILABLE'
    };

    if (product_id) whereClause.product_id = product_id;
    if (location_id) whereClause.location_id = location_id;

    // Get finished goods inventory data
    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            oem: true,
            model: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { updated_at: 'desc' }
    });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = 'Inventory ID,Product Code,Product Name,OEM,Model,Quantity,Location,Status,UOM,Unit Cost,Total Value,Received At\n';
      const csvRows = inventory.map(item => {
        const productName = item.product?.part_name || 'N/A';
        const productCode = item.product?.product_code || 'N/A';
        const oemName = item.product?.oem?.oem_name || 'N/A';
        const modelName = item.product?.model?.model_name || 'N/A';
        const locationName = item.location?.name || 'N/A';
        const uomCode = item.uom?.code || 'N/A';
        const unitCost = item.product?.standard_cost || 0;
        const totalValue = (item.quantity * unitCost).toFixed(2);
        const receivedAt = item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : 'N/A';

        return `"${item.inventory_id}","${productCode}","${productName}","${oemName}","${modelName}","${item.quantity}","${locationName}","${item.status}","${uomCode}","${unitCost}","${totalValue}","${receivedAt}"`;
      }).join('\n');

      const csvContent = csvHeaders + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="finished-goods-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    // For other formats, return JSON
    return res.status(200).json({
      success: true,
      data: inventory,
      count: inventory.length
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to export finished goods');

    return res.status(500).json({
      success: false,
      error: 'Failed to export finished goods'
    });
  }
};