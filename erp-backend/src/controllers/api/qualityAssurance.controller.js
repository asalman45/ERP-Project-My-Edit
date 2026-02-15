// src/controllers/api/qualityAssurance.controller.js
import { PrismaClient } from '@prisma/client';
import inventoryService from '../../services/inventory.service.js';
import { logger } from '../../utils/logger.js';
import db from '../../utils/db.js';
import { createMasterWorkOrder } from '../../services/hierarchicalWorkOrderService.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Import location helper from inventory service
let getOrCreateLocation, QA_CODE, FINISHED_GOODS_CODE;

// Lazy import to avoid circular dependency
const initLocationHelpers = async () => {
  if (!getOrCreateLocation) {
    try {
      // Import the named exports directly
      const inventoryModule = await import('../../services/inventory.service.js');
      getOrCreateLocation = inventoryModule.getOrCreateLocation;
      QA_CODE = inventoryModule.QA_CODE;
      FINISHED_GOODS_CODE = inventoryModule.FINISHED_GOODS_CODE;
      
      if (!getOrCreateLocation || !QA_CODE) {
        throw new Error(`Missing exports: getOrCreateLocation=${!!getOrCreateLocation}, QA_CODE=${!!QA_CODE}`);
      }
      
      logger.info({
        getOrCreateLocation: typeof getOrCreateLocation,
        QA_CODE,
        FINISHED_GOODS_CODE,
        message: 'Location helpers initialized successfully'
      }, 'Location helpers initialized');
    } catch (importError) {
      // Try to get module exports for debugging (but don't fail if this also fails)
      try {
        const moduleCheck = await import('../../services/inventory.service.js');
        logger.error({
          error: importError.message,
          stack: importError.stack,
          moduleExports: Object.keys(moduleCheck).join(', '),
          hasGetOrCreateLocation: 'getOrCreateLocation' in moduleCheck,
          hasQA_CODE: 'QA_CODE' in moduleCheck
        }, 'Failed to import location helpers');
      } catch (checkError) {
        logger.error({
          error: importError.message,
          stack: importError.stack,
          checkError: checkError.message
        }, 'Failed to import location helpers (and failed to check module exports)');
      }
      throw importError;
    }
  }
};

/**
 * GET /api/inventory/by-location-type
 * Get inventory by location type (e.g., QA)
 */
export const getInventoryByLocationType = async (req, res) => {
  try {
    const { type } = req.query;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Location type is required'
      });
    }

    // Initialize location helpers
    try {
      await initLocationHelpers();
      
      if (!getOrCreateLocation || !QA_CODE) {
        logger.error({
          getOrCreateLocation: !!getOrCreateLocation,
          QA_CODE: !!QA_CODE,
          message: 'Location helpers not initialized properly'
        }, 'Location helpers initialization failed');
        
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize location helpers'
        });
      }
    } catch (initError) {
      logger.error({ error: initError.message, stack: initError.stack }, 'Error initializing location helpers');
      return res.status(500).json({
        success: false,
        error: `Failed to initialize location helpers: ${initError.message}`
      });
    }
    
    // Use fixed location code to get location ID
    let locationIds = [];
    
    if (type.toUpperCase() === 'QA') {
      try {
        const qaLocationId = await getOrCreateLocation(QA_CODE, 'Quality Assurance Section', 'QA');
        locationIds = [qaLocationId];
        
        logger.info({
          qaLocationCode: QA_CODE,
          qaLocationId,
          message: 'QA location retrieved/created successfully'
        }, 'QA location ready');
      } catch (qaError) {
        logger.error({ error: qaError.message, stack: qaError.stack }, 'Failed to get/create QA location');
        return res.status(500).json({
          success: false,
          error: `Failed to get/create QA location: ${qaError.message}`
        });
      }
    } else if (type.toUpperCase() === 'FINISHED_GOODS' || type.toUpperCase() === 'FINISHED-GOODS') {
      try {
        const { FINISHED_GOODS_CODE } = await import('../../services/inventory.service.js');
        const finishedGoodsLocationId = await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');
        locationIds = [finishedGoodsLocationId];
        
        logger.info({
          finishedGoodsCode: FINISHED_GOODS_CODE,
          finishedGoodsLocationId,
          message: 'Finished Goods location retrieved/created successfully'
        }, 'Finished Goods location ready');
      } catch (fgError) {
        logger.error({ error: fgError.message, stack: fgError.stack }, 'Failed to get/create Finished Goods location');
        return res.status(500).json({
          success: false,
          error: `Failed to get/create Finished Goods location: ${fgError.message}`
        });
      }
    } else {
      // Find locations matching the type for other types
      const locations = await prisma.location.findMany({
        where: {
          OR: [
            { type: type.toUpperCase() },
            { code: { contains: type.toUpperCase() } },
            { name: { contains: type, mode: 'insensitive' } }
          ]
        }
      });
      
      logger.info({
        type,
        locationsFound: locations.length,
        locationIds: locations.map(l => l.location_id),
        locationNames: locations.map(l => l.name)
      }, 'Location lookup');

      if (locations.length === 0) {
        logger.warn({ type }, 'No locations found');
        return res.status(200).json({
          success: true,
          data: [],
          message: `No ${type} location found. Products will appear here after work orders are completed.`
        });
      }
      
      locationIds = locations.map(l => l.location_id);
    }

    const includeAllStatuses = ['FINISHED_GOODS', 'FINISHED-GOODS'].includes(type.toUpperCase());

    // Get inventory at these locations
    const inventoryWhere = {
      location_id: { in: locationIds },
      product_id: { not: null }, // Only products, not materials
    };

    // For QA location, show ALL records (including quantity = 0 for history)
    // For other locations, only show quantity > 0
    if (type.toUpperCase() !== 'QA') {
      inventoryWhere.quantity = { gt: 0 };
    }

    if (!includeAllStatuses && type.toUpperCase() !== 'QA') {
      inventoryWhere.status = 'AVAILABLE';
    }

    const inventory = await prisma.inventory.findMany({
      where: inventoryWhere,
      include: {
        product: {
          include: {
            oem: true,
            model: true,
            uom: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { updated_at: 'desc' }
    });
    
    logger.info({
      type,
      locationIds,
      locationCodes: locationIds.map(id => 'will check'),
      inventoryCount: inventory.length,
      inventoryItems: inventory.map(i => ({
        inventory_id: i.inventory_id,
        product_id: i.product_id,
        product_name: i.product?.part_name,
        quantity: i.quantity,
        location_id: i.location_id,
        location_code: i.location?.code
      }))
    }, 'Found inventory at QA locations');
    
    // Also check by location code for debugging and fallback
    if (type.toUpperCase() === 'QA') {
      const qaLocation = await prisma.location.findUnique({
        where: { code: QA_CODE },
        include: {
          inventories: {
            where: {
              product_id: { not: null }
              // ✅ Removed quantity filter - show history too
            },
            include: {
              product: true
            }
          }
        }
      });
      
      logger.info({
        qaLocationCode: QA_CODE,
        qaLocationId: qaLocation?.location_id,
        qaLocationFound: !!qaLocation,
        locationIdsUsed: locationIds,
        locationIdsMatch: qaLocation ? locationIds.includes(qaLocation.location_id) : false,
        qaInventoryCount: qaLocation?.inventories?.length || 0,
        qaInventoryDetails: qaLocation?.inventories?.map(inv => ({
          inventory_id: inv.inventory_id,
          product_id: inv.product_id,
          product_name: inv.product?.part_name,
          quantity: inv.quantity,
          status: inv.status
        })) || []
      }, 'QA location debug info');
      
      // If we found inventory through the location relation, use it
      if (qaLocation && qaLocation.inventories && qaLocation.inventories.length > 0) {
        logger.info({
          foundViaRelation: true,
          count: qaLocation.inventories.length
        }, 'Found QA inventory via location relation');
        
        // Use the inventory from the relation (include history items)
        const inventoryFromRelation = await prisma.inventory.findMany({
          where: {
            inventory_id: { in: qaLocation.inventories.map(inv => inv.inventory_id) }
            // ✅ Removed quantity filter - show history too
          },
          include: {
            product: {
              include: {
                oem: true,
                model: true,
                uom: true
              }
            },
            location: true,
            uom: true
          },
          orderBy: { updated_at: 'desc' }
        });
        
        // Merge with existing inventory results (avoid duplicates)
        const existingIds = new Set(inventory.map(i => i.inventory_id));
        const newItems = inventoryFromRelation.filter(i => !existingIds.has(i.inventory_id));
        inventory.push(...newItems);
        
        logger.info({
          mergedCount: inventory.length,
          newItemsCount: newItems.length
        }, 'Merged QA inventory from relation');
      }
      
      // Additional diagnostic: Check all locations with QA in name/type
      const allQALocations = await prisma.location.findMany({
        where: {
          OR: [
            { code: { contains: 'QA', mode: 'insensitive' } },
            { name: { contains: 'QA', mode: 'insensitive' } },
            { type: { contains: 'QA', mode: 'insensitive' } }
          ]
        },
        include: {
          inventories: {
            where: {
              product_id: { not: null },
              status: 'AVAILABLE'
            }
          }
        }
      });
      
      logger.info({
        allQALocationsCount: allQALocations.length,
        allQALocationsDetails: allQALocations.map(loc => ({
          location_id: loc.location_id,
          code: loc.code,
          name: loc.name,
          type: loc.type,
          inventory_count: loc.inventories?.length || 0
        }))
      }, 'All QA-related locations found');
    }

    // For QA location, fetch rejection records to enrich history
    let qaRejectionsMap = new Map(); // Latest rejection per inventory
    let qaRejectionsByInventory = new Map(); // All rejections grouped by inventory_id
    let quantityBreakdownMap = new Map(); // Quantity breakdown per inventory
    
    if (type.toUpperCase() === 'QA') {
      const inventoryIds = inventory.map(i => i.inventory_id);
      if (inventoryIds.length > 0) {
        const qaRejections = await prisma.qARejection.findMany({
          where: {
            inventory_id: { in: inventoryIds }
          },
          include: {
            reworkWO: {
              select: {
                wo_no: true,
                wo_id: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        });

        // Group by inventory_id (latest rejection per inventory)
        qaRejections.forEach(rejection => {
          if (!qaRejectionsMap.has(rejection.inventory_id)) {
            qaRejectionsMap.set(rejection.inventory_id, rejection);
          }
          
          // Group all rejections by inventory_id
          if (!qaRejectionsByInventory.has(rejection.inventory_id)) {
            qaRejectionsByInventory.set(rejection.inventory_id, []);
          }
          qaRejectionsByInventory.get(rejection.inventory_id).push(rejection);
        });

        // Calculate quantity breakdown for history items (quantity = 0)
        const finishedGoodsLocationId = await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');
        const reworkLocationId = await getOrCreateLocation('REWORK-AREA', 'Rework Area', 'REWORK');
        
        for (const inv of inventory) {
          if (inv.quantity === 0) {
            const breakdown = {
              approved: 0,
              rejected: 0,
              by_disposition: {
                REWORK: 0,
                SCRAP: 0,
                DISPOSAL: 0
              }
            };

            // Get rejected quantities from QARejection records
            const rejections = qaRejectionsByInventory.get(inv.inventory_id) || [];
            let totalRejected = 0;
            
            for (const rej of rejections) {
              let qty = parseFloat(rej.quantity || 0);
              
              // ✅ FIX: If quantity is NULL (old record), skip for now (will check inventory later)
              if (!qty || qty === 0) {
                continue; // Skip this rejection, will check inventory later
              }
              
              totalRejected += qty;
              if (rej.disposition === 'REWORK') {
                breakdown.by_disposition.REWORK += qty;
              } else if (rej.disposition === 'SCRAP') {
                breakdown.by_disposition.SCRAP += qty;
              } else if (rej.disposition === 'DISPOSAL') {
                breakdown.by_disposition.DISPOSAL += qty;
              }
            }
            
            breakdown.rejected = totalRejected;

            // ✅ IMPROVED: Better approved quantity detection
            // Check for partial QA first
            const approvedTxn = await prisma.inventoryTxn.findFirst({
              where: {
                reference: { contains: `QA-PARTIAL-APPROVED-${inv.inventory_id}` },
                txn_type: 'TRANSFER',
                product_id: inv.product_id
              },
              orderBy: { created_at: 'desc' }
            });

            if (approvedTxn) {
              breakdown.approved = parseFloat(approvedTxn.quantity || 0);
            } else {
              // ✅ NEW: Check for full approval (old format)
              const fullApprovalTxn = await prisma.inventoryTxn.findFirst({
                where: {
                  inventory_id: inv.inventory_id,
                  txn_type: { in: ['TRANSFER', 'RECEIVE'] },
                  product_id: inv.product_id,
                  reference: { contains: 'QA-APPROVED' }
                },
                orderBy: { created_at: 'desc' }
              });
              
              if (fullApprovalTxn) {
                breakdown.approved = Math.abs(parseFloat(fullApprovalTxn.quantity || 0));
              } else {
                // Fallback: Check Finished Goods inventory created around same time
                const finishedGoodsInv = await prisma.inventory.findFirst({
                  where: {
                    product_id: inv.product_id,
                    location_id: finishedGoodsLocationId,
                    created_at: {
                      gte: new Date(inv.updated_at.getTime() - 3600000), // Within 1 hour (increased from 1 minute)
                      lte: new Date(inv.updated_at.getTime() + 3600000)
                    }
                  },
                  orderBy: { created_at: 'desc' }
                });
                
                if (finishedGoodsInv) {
                  breakdown.approved = parseFloat(finishedGoodsInv.quantity || 0);
                }
              }
            }

            // ✅ NEW: For old records without quantity in QARejection, check Rework Area and Scrap Inventory
            if (breakdown.rejected === 0 && rejections.length > 0) {
              // Check Rework Area inventory
              const reworkInv = await prisma.inventory.findFirst({
                where: {
                  product_id: inv.product_id,
                  location_id: reworkLocationId,
                  created_at: {
                    gte: new Date(inv.updated_at.getTime() - 3600000), // Within 1 hour
                    lte: new Date(inv.updated_at.getTime() + 3600000)
                  }
                },
                orderBy: { created_at: 'desc' }
              });
              
              if (reworkInv) {
                const reworkQty = parseFloat(reworkInv.quantity || 0);
                breakdown.rejected += reworkQty;
                breakdown.by_disposition.REWORK += reworkQty;
              }
              
              // Check Scrap Inventory (via scrap_inventory table)
              try {
                const scrapCheck = await prisma.$queryRaw`
                  SELECT SUM(weight_kg)::numeric as total_scrap
                  FROM scrap_inventory
                  WHERE reference LIKE ${`%QA-REJECTED-%${inv.inventory_id}%`}
                    AND created_at BETWEEN 
                      ${new Date(inv.updated_at.getTime() - 3600000)}::timestamp AND
                      ${new Date(inv.updated_at.getTime() + 3600000)}::timestamp
                `;
                
                if (scrapCheck && scrapCheck[0]?.total_scrap) {
                  const scrapQty = parseFloat(scrapCheck[0].total_scrap || 0);
                  breakdown.rejected += scrapQty;
                  breakdown.by_disposition.SCRAP += scrapQty;
                }
              } catch (scrapError) {
                // Ignore scrap check errors
                logger.warn({ error: scrapError.message }, 'Could not check scrap inventory');
              }
            }

            // ✅ NEW: Only set breakdown if we have some data
            if (breakdown.approved > 0 || breakdown.rejected > 0) {
              quantityBreakdownMap.set(inv.inventory_id, breakdown);
            }
          }
        }
      }
    }

    // Transform to match frontend expectations
    const transformed = inventory.map(item => {
      // Calculate QA status for QA location
      let qaStatus = 'PENDING'; // Default
      let disposition = null;
      let rejectionReason = null;
      let reworkWoNo = null;
      
      if (type.toUpperCase() === 'QA') {
        const qaRejection = qaRejectionsMap.get(item.inventory_id);
        
        if (item.quantity > 0) {
          qaStatus = 'PENDING'; // Still in QA, not yet approved/rejected
        } else if (item.quantity === 0) {
          // Check status and rejection records to determine if approved or rejected
          if (qaRejection) {
            qaStatus = 'REJECTED';
            disposition = qaRejection.disposition;
            rejectionReason = qaRejection.rejection_reason;
            reworkWoNo = qaRejection.reworkWO?.wo_no || null;
          } else if (item.status === 'QUARANTINE') {
            qaStatus = 'REJECTED'; // Moved to rejection/quarantine
          } else if (item.status === 'AVAILABLE') {
            qaStatus = 'APPROVED'; // Moved to finished goods (status remains AVAILABLE)
          } else {
            qaStatus = 'PENDING'; // Unknown status, keep as pending
          }
        }
      }

      return {
        inventory_id: item.inventory_id,
        product_id: item.product_id,
        product_code: item.product?.product_code || '',
        product_name: item.product?.part_name || '',
        quantity: item.quantity,
        location_id: item.location_id,
        location_name: item.location?.name || '',
        location_code: item.location?.code || '',
        // Include full product object with relations for OEM and Model
        product: item.product ? {
          product_id: item.product.product_id,
          product_code: item.product.product_code,
          part_name: item.product.part_name,
          oem: item.product.oem,
          model: item.product.model,
          uom: item.product.uom,
          standard_cost: item.product.standard_cost
        } : null,
        uom_code: item.uom?.code || item.product?.uom?.code || '',
        received_at: item.updated_at || item.created_at,
        status: item.status,
        qa_status: qaStatus, // Add QA status for frontend filtering
        // Rejection details (for history items)
        disposition: disposition,
        rejection_reason: rejectionReason,
        rework_wo_no: reworkWoNo,
        // Quantity breakdown (for history items with quantity = 0)
        quantity_breakdown: type.toUpperCase() === 'QA' && item.quantity === 0 
          ? quantityBreakdownMap.get(item.inventory_id) || null
          : null,
        // Try to find associated work order from inventory transactions
        wo_id: null,
        wo_no: null
      };
    });
    
    logger.info({
      transformedCount: transformed.length
    }, 'Transformed inventory items');

    // Enrich with work order info from transactions
    for (let item of transformed) {
      try {
        const txn = await prisma.inventoryTxn.findFirst({
          where: {
            inventory_id: item.inventory_id,
            txn_type: 'RECEIVE',
            wo_id: { not: null }
          },
          orderBy: { created_at: 'desc' },
          include: {
            workOrder: true
          }
        });
        
        if (txn && txn.workOrder) {
          item.wo_id = txn.wo_id;
          item.wo_no = txn.workOrder.wo_no;
        }
      } catch (err) {
        logger.warn({ error: err.message, inventoryId: item.inventory_id }, 'Failed to fetch work order for inventory item');
        // Ignore if can't find work order
      }
    }

    logger.info({
      type,
      totalInventoryFound: inventory.length,
      transformedCount: transformed.length,
      locationIds: locationIds,
      hasProducts: transformed.some(item => item.product_id)
    }, 'QA inventory fetch completed');
    
    const locationLabel = includeAllStatuses ? 'Finished Goods' : (type.toUpperCase() === 'QA' ? 'QA' : type);

    return res.status(200).json({
      success: true,
      data: transformed,
      message: transformed.length === 0 
        ? `No products in ${locationLabel} yet. Products will appear here after processing is completed.`
        : `Found ${transformed.length} product(s) in ${locationLabel}`
    });
    
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      type: req.query?.type
    }, 'Error in getInventoryByLocationType');
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inventory by location type'
    });
  }
};

/**
 * POST /api/quality-assurance/:inventoryId
 * Approve or reject product in QA
 */
export const updateQAStatus = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { 
      status, 
      notes,
      // New fields for comprehensive rejection workflow
      rejection_reason,
      disposition,
      root_cause,
      corrective_action,
      rejected_by
    } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be APPROVED or REJECTED'
      });
    }

    // For REJECTED status, rejection_reason is required
    if (status === 'REJECTED' && !rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required for rejected products'
      });
    }

    // For REJECTED status, disposition is required
    if (status === 'REJECTED' && !disposition) {
      return res.status(400).json({
        success: false,
        error: 'Disposition is required for rejected products. Please select REWORK, SCRAP, or DISPOSAL'
      });
    }

    // Validate disposition value
    if (status === 'REJECTED' && disposition && !['REWORK', 'SCRAP', 'DISPOSAL'].includes(disposition)) {
      return res.status(400).json({
        success: false,
        error: 'Disposition must be one of: REWORK, SCRAP, or DISPOSAL'
      });
    }

    // Get inventory record
    const inventory = await prisma.inventory.findUnique({
      where: { inventory_id: inventoryId },
      include: {
        product: true,
        location: true
      }
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }

    if (!inventory.product_id) {
      return res.status(400).json({
        success: false,
        error: 'This inventory item is not a finished product'
      });
    }

    // Validate quantity
    if (!inventory.quantity || inventory.quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot approve product with zero or invalid quantity (quantity: ${inventory.quantity}). Please check the work order output.`
      });
    }

    // Initialize location helpers
    await initLocationHelpers();
    
    // Check if it's at QA location using fixed location code
    const qaLocationId = await getOrCreateLocation(QA_CODE, 'Quality Assurance Section', 'QA');
    const isQALocation = inventory.location_id === qaLocationId ||
                         inventory.location?.code === QA_CODE ||
                         inventory.location?.type === 'QA' ||
                         inventory.location?.name?.toLowerCase().includes('quality assurance');

    if (!isQALocation) {
      return res.status(400).json({
        success: false,
        error: 'This product is not in QA section'
      });
    }

    if (status === 'APPROVED') {
      // Use fixed finished goods location
      const finishedGoodsLocationId = await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // 1. Update QA inventory record (set quantity to 0, keep status AVAILABLE for traceability)
        const qaInventory = await tx.inventory.update({
          where: { inventory_id: inventoryId },
          data: {
            quantity: 0, // Set to 0 since we're moving all quantity
            status: 'AVAILABLE', // Keep AVAILABLE status to indicate approved
            updated_at: new Date()
          }
        });

        // 2. Create transaction record for removal from QA
        await tx.inventoryTxn.create({
          data: {
            inventory_id: inventoryId,
            product_id: inventory.product_id,
            txn_type: 'TRANSFER',
            quantity: -inventory.quantity,
            location_id: inventory.location_id,
            reference: `QA-APPROVED-${inventoryId}`,
            created_by: 'system'
          }
        });

        // 3. Find or create inventory record at Finished Goods location
        let finishedGoodsInventory = await tx.inventory.findFirst({
          where: {
            product_id: inventory.product_id,
            location_id: finishedGoodsLocationId,
            status: 'AVAILABLE'
          }
        });

        if (!finishedGoodsInventory) {
          finishedGoodsInventory = await tx.inventory.create({
            data: {
              product_id: inventory.product_id,
              quantity: 0,
              location_id: finishedGoodsLocationId,
              status: 'AVAILABLE'
            }
          });
        }

        // 4. Add quantity to Finished Goods inventory
        await tx.inventory.update({
          where: { inventory_id: finishedGoodsInventory.inventory_id },
          data: {
            quantity: (finishedGoodsInventory.quantity || 0) + inventory.quantity,
            updated_at: new Date()
          }
        });

        // 5. Create transaction record for addition to Finished Goods
        await tx.inventoryTxn.create({
          data: {
            inventory_id: finishedGoodsInventory.inventory_id,
            product_id: inventory.product_id,
            txn_type: 'TRANSFER',
            quantity: inventory.quantity,
            location_id: finishedGoodsLocationId,
            reference: `QA-APPROVED-${inventoryId}`,
            created_by: 'system'
          }
        });

        logger.info({
          inventoryId,
          qaInventoryId: inventoryId,
          finishedGoodsInventoryId: finishedGoodsInventory.inventory_id,
          productId: inventory.product_id,
          quantity: inventory.quantity,
          fromLocation: inventory.location_id,
          toLocation: finishedGoodsLocationId
        }, 'Product transferred from QA to Finished Goods');
      });

      logger.info({
        inventoryId,
        productId: inventory.product_id,
        quantity: inventory.quantity,
        fromLocation: inventory.location_id,
        toLocation: finishedGoodsLocationId
      }, 'Product approved and moved to finished goods');

    } else {
      // REJECTED - Comprehensive rejection workflow
      const rejectionLocationId = await getOrCreateLocation('REWORK-AREA', 'Rework Area', 'REWORK');
      
      let reworkWoId = null;
      let scrapId = null;
      let disposalDate = null;

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // 1. Update QA inventory record (set quantity to 0, set status QUARANTINE for traceability)
        await tx.inventory.update({
          where: { inventory_id: inventoryId },
          data: {
            quantity: 0, // Set to 0 since we're moving all quantity
            status: 'QUARANTINE', // Set QUARANTINE status to indicate rejected
            updated_at: new Date()
          }
        });

        // 2. Handle disposition-specific actions
        if (disposition === 'REWORK') {
          // Find original work order that produced this inventory
          let originalWO = null;
          try {
            // Try to find via ProductionOrder
            const productionOrder = await tx.productionOrder.findFirst({
              where: {
                produced_inventory_id: inventoryId
              },
              include: {
                product: true
              }
            });

            // If not found via ProductionOrder, try via InventoryTxn (most recent RECEIVE transaction)
            // Finished goods are received via RECEIVE transaction, not ISSUE
            if (!productionOrder) {
              const inventoryTxn = await tx.inventoryTxn.findFirst({
                where: {
                  inventory_id: inventoryId,
                  txn_type: 'RECEIVE',  // ✅ Changed from ISSUE to RECEIVE
                  wo_id: { not: null }
                },
                include: {
                  workOrder: {
                    include: {
                      product: true
                    }
                  }
                },
                orderBy: {
                  created_at: 'desc'
                }
              });

              if (inventoryTxn?.workOrder) {
                originalWO = inventoryTxn.workOrder;
              }
            }
          } catch (woError) {
            logger.warn({ error: woError.message }, 'Could not find original work order');
          }

          // Create rework work order
          try {
            const reworkResult = await createMasterWorkOrder({
              productId: inventory.product_id,
              quantity: inventory.quantity,
              createdBy: rejected_by || 'system',
              customer: originalWO?.customer || null,
              sales_order_ref: originalWO?.sales_order_ref || null,
              purchase_order_ref: originalWO?.purchase_order_ref || null
            });
            reworkWoId = reworkResult.data.master_wo_id;
            
            // ✅ CREATE NEW INVENTORY RECORD IN REWORK AREA
            // This ensures rework items are visible and tracked
            await tx.inventory.create({
              data: {
                inventory_id: uuidv4(),
                product_id: inventory.product_id,
                location_id: rejectionLocationId,  // Rework Area location
                quantity: inventory.quantity,       // Keep actual quantity
                uom_id: inventory.uom_id,
                batch_no: inventory.batch_no,
                status: 'REWORK_PENDING',          // Clear status for rework items
                reference_wo_id: reworkWoId,       // Link to Rework WO for traceability
                created_at: new Date(),
                updated_at: new Date()
              }
            });
            
            logger.info({
              inventoryId,
              productId: inventory.product_id,
              quantity: inventory.quantity,
              reworkWoId,
              reworkWoNo: reworkResult.data.wo_no,
              reworkLocation: rejectionLocationId
            }, 'Rework work order created and inventory moved to rework area');
          } catch (reworkError) {
            logger.error({
              error: reworkError.message,
              inventoryId,
              productId: inventory.product_id
            }, 'Failed to create rework work order');
            throw new Error(`Failed to create rework work order: ${reworkError.message}`);
          }
        } else if (disposition === 'SCRAP') {
          // Transfer to scrap inventory
          try {
            // Get product details for scrap creation
            const product = await tx.product.findUnique({
              where: { product_id: inventory.product_id },
              include: { uom: true }
            });

            // Create scrap inventory entry using Prisma raw SQL
            // Note: ScrapInventory requires weight_kg, so we'll use quantity as weight proxy
            const scrapIdValue = uuidv4();
            const scrapResult = await tx.$queryRaw`
              INSERT INTO scrap_inventory (
                scrap_id, material_id, material_name, weight_kg,
                location_id, status, reference, created_by, unit
              ) VALUES (
                ${scrapIdValue}::uuid,
                NULL,
                ${product?.part_name || 'Rejected Product'},
                ${inventory.quantity},
                ${rejectionLocationId}::uuid,
                'AVAILABLE',
                ${`QA-REJECTED-${inventoryId}`},
                ${rejected_by || 'system'},
                ${product?.uom?.code || 'pcs'}
              )
              RETURNING scrap_id
            `;
            scrapId = scrapIdValue;
            
            logger.info({
              inventoryId,
              productId: inventory.product_id,
              quantity: inventory.quantity,
              scrapId
            }, 'Rejected product transferred to scrap inventory');
          } catch (scrapError) {
            logger.error({
              error: scrapError.message,
              inventoryId,
              productId: inventory.product_id
            }, 'Failed to transfer to scrap inventory');
            throw new Error(`Failed to transfer to scrap inventory: ${scrapError.message}`);
          }
        } else if (disposition === 'DISPOSAL') {
          // Record disposal date
          disposalDate = new Date();
          
          logger.info({
            inventoryId,
            productId: inventory.product_id,
            quantity: inventory.quantity,
            disposalDate
          }, 'Rejected product marked for disposal');
        }

        // 3. Create transaction record for removal from QA
        await tx.inventoryTxn.create({
          data: {
            inventory_id: inventoryId,
            product_id: inventory.product_id,
            txn_type: 'TRANSFER',
            quantity: -inventory.quantity,
            location_id: inventory.location_id,
            reference: `QA-REJECTED-${inventoryId}`,
            created_by: rejected_by || 'system'
          }
        });

        // 4. Find or create inventory record at Rejection location (only if not SCRAP)
        if (disposition !== 'SCRAP') {
          let rejectionInventory = await tx.inventory.findFirst({
            where: {
              product_id: inventory.product_id,
              location_id: rejectionLocationId,
              status: 'AVAILABLE'
            }
          });

          if (!rejectionInventory) {
            rejectionInventory = await tx.inventory.create({
              data: {
                product_id: inventory.product_id,
                quantity: 0,
                location_id: rejectionLocationId,
                status: 'AVAILABLE'
              }
            });
          }

          // Add quantity to Rejection inventory
          await tx.inventory.update({
            where: { inventory_id: rejectionInventory.inventory_id },
            data: {
              quantity: (rejectionInventory.quantity || 0) + inventory.quantity,
              updated_at: new Date()
            }
          });

          // Create transaction record for addition to Rejection
          await tx.inventoryTxn.create({
            data: {
              inventory_id: rejectionInventory.inventory_id,
              product_id: inventory.product_id,
              txn_type: 'TRANSFER',
              quantity: inventory.quantity,
              location_id: rejectionLocationId,
              reference: `QA-REJECTED-${inventoryId}`,
              created_by: rejected_by || 'system'
            }
          });
        }

        // 5. Create QA rejection record using Prisma raw SQL
        const rejectionId = uuidv4();
        await tx.$executeRaw`
          INSERT INTO qa_rejection (
            rejection_id, inventory_id, product_id, rejection_reason, disposition,
            rejected_by, rejected_at, root_cause, corrective_action,
            rework_wo_id, scrap_id, disposal_date, notes, created_at, updated_at
          ) VALUES (
            ${rejectionId}::uuid,
            ${inventoryId}::uuid,
            ${inventory.product_id}::uuid,
            ${rejection_reason},
            ${disposition},
            ${rejected_by || 'system'},
            ${new Date()}::timestamp,
            ${root_cause || null},
            ${corrective_action || null},
            ${reworkWoId || null}::uuid,
            ${scrapId || null}::uuid,
            ${disposalDate || null}::timestamp,
            ${notes || null},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;

        logger.info({
          inventoryId,
          rejectionInventoryId: disposition !== 'SCRAP' ? 'created' : null,
          productId: inventory.product_id,
          quantity: inventory.quantity,
          fromLocation: inventory.location_id,
          toLocation: rejectionLocationId,
          disposition,
          reworkWoId,
          scrapId,
          disposalDate,
          rejection_reason,
          root_cause,
          corrective_action
        }, 'Product rejected with comprehensive workflow');
      });

      logger.info({
        inventoryId,
        productId: inventory.product_id,
        quantity: inventory.quantity,
        disposition,
        reworkWoId,
        scrapId,
        disposalDate
      }, 'Product rejected and processed according to disposition');
    }

    return res.status(200).json({
      success: true,
      message: status === 'APPROVED' 
        ? 'Product approved and moved to finished goods' 
        : 'Product rejected and moved to quarantine',
      data: {
        inventoryId,
        status,
        notes
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      inventoryId: req.params.inventoryId,
      body: req.body,
      inventoryQuantity: inventory?.quantity
    }, 'Failed to update QA status');

    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to update QA status';
    if (error.message?.includes('cannot be zero')) {
      errorMessage = `Cannot process approval: product quantity is zero. This may indicate the inventory record is invalid. Please check the work order that created this product.`;
    } else if (error.message?.includes('Missing required parameters')) {
      errorMessage = `Invalid approval request: ${error.message}`;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

/**
 * Update QA status with partial quantities
 * POST /api/quality-assurance/:inventoryId/partial
 * 
 * Supports partial approval/rejection:
 * - Approve some quantity
 * - Reject remaining with multiple dispositions (REWORK, SCRAP, DISPOSAL)
 */
export const updateQAStatusPartial = async (req, res) => {
  const { inventoryId } = req.params;
  let inventory;

  try {
    const {
      approved_quantity = 0,
      rejections = [], // Array of {quantity, disposition, reason, root_cause, corrective_action}
      notes,
      rejected_by
    } = req.body;

    // Validate input
    if (!Array.isArray(rejections)) {
      return res.status(400).json({
        success: false,
        error: 'Rejections must be an array'
      });
    }

    // Get inventory record
    inventory = await prisma.inventory.findUnique({
      where: { inventory_id: inventoryId },
      include: {
        product: true,
        location: true
      }
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory record not found'
      });
    }

    if (!inventory.product_id) {
      return res.status(400).json({
        success: false,
        error: 'This inventory item is not a finished product'
      });
    }

    // Validate quantity
    if (!inventory.quantity || inventory.quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot process product with zero or invalid quantity (quantity: ${inventory.quantity})`
      });
    }

    // Calculate total quantity
    const total_rejected = rejections.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
    const total_quantity = parseFloat(approved_quantity) + total_rejected;

    // Validate quantities
    if (Math.abs(total_quantity - inventory.quantity) > 0.001) { // Allow small floating point differences
      return res.status(400).json({
        success: false,
        error: `Total quantity (${total_quantity}) must equal inventory quantity (${inventory.quantity})`
      });
    }

    if (approved_quantity < 0 || total_rejected < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantities cannot be negative'
      });
    }

    // Validate rejections
    for (const rejection of rejections) {
      if (!rejection.quantity || rejection.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Each rejection must have a valid quantity'
        });
      }

      if (!rejection.disposition || !['REWORK', 'SCRAP', 'DISPOSAL'].includes(rejection.disposition)) {
        return res.status(400).json({
          success: false,
          error: 'Each rejection must have a valid disposition (REWORK, SCRAP, or DISPOSAL)'
        });
      }

      if (!rejection.reason || !rejection.reason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Each rejection must have a reason'
        });
      }
    }

    // Initialize location helpers
    await initLocationHelpers();
    
    // Check if it's at QA location
    const qaLocationId = await getOrCreateLocation(QA_CODE, 'Quality Assurance Section', 'QA');
    const isQALocation = inventory.location_id === qaLocationId ||
                         inventory.location?.code === QA_CODE ||
                         inventory.location?.type === 'QA' ||
                         inventory.location?.name?.toLowerCase().includes('quality assurance');

    if (!isQALocation) {
      return res.status(400).json({
        success: false,
        error: 'This product is not in QA section'
      });
    }

    const finishedGoodsLocationId = await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');
    const rejectionLocationId = await getOrCreateLocation('REWORK-AREA', 'Rework Area', 'REWORK');

    // Process partial inspection in transaction
    const results = await prisma.$transaction(async (tx) => {
      const processResults = {
        approved: null,
        rejections: []
      };

      // 1. Set original QA inventory to 0
      await tx.inventory.update({
        where: { inventory_id: inventoryId },
        data: {
          quantity: 0,
          status: 'QUARANTINE',
          updated_at: new Date()
        }
      });

      // 2. Handle approved quantity
      if (approved_quantity > 0) {
        const approvedInventory = await tx.inventory.create({
          data: {
            inventory_id: uuidv4(),
            product: {
              connect: { product_id: inventory.product_id }
            },
            location: {
              connect: { location_id: finishedGoodsLocationId }
            },
            quantity: approved_quantity,
            ...(inventory.uom_id && {
              uom: {
                connect: { uom_id: inventory.uom_id }
              }
            }),
            batch_no: inventory.batch_no,
            status: 'AVAILABLE',
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        processResults.approved = {
          inventory_id: approvedInventory.inventory_id,
          quantity: approved_quantity,
          location: 'Finished Goods'
        };

        // ✅ Create InventoryTxn record for audit trail
        await tx.inventoryTxn.create({
          data: {
            inventory_id: approvedInventory.inventory_id,
            product_id: inventory.product_id,
            txn_type: 'TRANSFER',
            quantity: approved_quantity,
            location_id: finishedGoodsLocationId,
            reference: `QA-PARTIAL-APPROVED-${inventoryId}`,
            created_by: 'system'
          }
        });

        logger.info({
          inventoryId,
          productId: inventory.product_id,
          quantity: approved_quantity,
          toLocation: finishedGoodsLocationId
        }, 'Partial approval: moved to finished goods');
      }

      // 3. Handle each rejection
      for (const rejection of rejections) {
        const rejQty = parseFloat(rejection.quantity);

        // Create QA rejection record
        const qaRejection = await tx.qARejection.create({
          data: {
            rejection_id: uuidv4(),
            inventory_id: inventoryId,
            product_id: inventory.product_id,  // ✅ Added required field
            quantity: rejQty, // ✅ Store quantity for history tracking
            disposition: rejection.disposition,
            rejection_reason: rejection.reason,
            root_cause: rejection.root_cause || null,
            corrective_action: rejection.corrective_action || null,
            rejected_by: rejected_by || 'system',
            created_at: new Date()
          }
        });

        if (rejection.disposition === 'REWORK') {
          // Find original work order that produced this inventory
          let originalWO = null;
          try {
            // Try to find via ProductionOrder
            const productionOrder = await tx.productionOrder.findFirst({
              where: {
                produced_inventory_id: inventoryId
              },
              include: {
                product: true
              }
            });

            // If not found via ProductionOrder, try via InventoryTxn (most recent RECEIVE transaction)
            // Finished goods are received via RECEIVE transaction, not ISSUE
            if (!productionOrder) {
              const inventoryTxn = await tx.inventoryTxn.findFirst({
                where: {
                  inventory_id: inventoryId,
                  txn_type: 'RECEIVE',  // ✅ Changed from ISSUE to RECEIVE
                  wo_id: { not: null }
                },
                include: {
                  workOrder: {
                    include: {
                      product: true
                    }
                  }
                },
                orderBy: {
                  created_at: 'desc'
                }
              });

              if (inventoryTxn?.workOrder) {
                originalWO = inventoryTxn.workOrder;
              }
            }
          } catch (woError) {
            logger.warn({ error: woError.message }, 'Could not find original work order');
          }

          // Create rework work order with original WO info if available
          const reworkResult = await createMasterWorkOrder({
            productId: inventory.product_id,
            quantity: rejQty,
            createdBy: rejected_by || 'system',
            customer: originalWO?.customer || null,
            sales_order_ref: originalWO?.sales_order_ref || null,
            purchase_order_ref: originalWO?.purchase_order_ref || null
          });

          // Create inventory in rework area
          const reworkInventory = await tx.inventory.create({
            data: {
              inventory_id: uuidv4(),
              product: {
                connect: { product_id: inventory.product_id }
              },
              location: {
                connect: { location_id: rejectionLocationId }
              },
              quantity: rejQty,
              ...(inventory.uom_id && {
                uom: {
                  connect: { uom_id: inventory.uom_id }
                }
              }),
              batch_no: inventory.batch_no,
              status: 'REWORK_PENDING',
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          // Update QA rejection record with rework WO reference
          await tx.qARejection.update({
            where: { rejection_id: qaRejection.rejection_id },
            data: {
              rework_wo_id: reworkResult.data.master_wo_id
            }
          });

          // ✅ Create InventoryTxn record for audit trail
          await tx.inventoryTxn.create({
            data: {
              inventory_id: reworkInventory.inventory_id,
              product_id: inventory.product_id,
              txn_type: 'TRANSFER',
              quantity: rejQty,
              location_id: rejectionLocationId,
              reference: `QA-PARTIAL-REWORK-${inventoryId}`,
              created_by: 'system'
            }
          });

          processResults.rejections.push({
            disposition: 'REWORK',
            quantity: rejQty,
            wo_id: reworkResult.data.master_wo_id,
            wo_no: reworkResult.data.wo_no,
            inventory_id: reworkInventory.inventory_id
          });

        } else if (rejection.disposition === 'SCRAP') {
          // Get product details
          const product = await tx.product.findUnique({
            where: { product_id: inventory.product_id },
            include: { uom: true }
          });

          // Create scrap inventory entry
          const scrapIdValue = uuidv4();
          await tx.$queryRaw`
            INSERT INTO scrap_inventory (
              scrap_id, material_id, material_name, weight_kg,
              location_id, status, reference, created_by, unit
            ) VALUES (
              ${scrapIdValue}::uuid,
              NULL,
              ${product?.part_name || 'Rejected Product'},
              ${rejQty},
              ${rejectionLocationId}::uuid,
              'AVAILABLE',
              ${`QA-REJECTED-PARTIAL-${inventoryId}-${Date.now()}`},
              ${rejected_by || 'system'},
              ${product?.uom?.code || 'pcs'}
            )
          `;

          // ✅ Update QA rejection record with scrap_id reference
          await tx.qARejection.update({
            where: { rejection_id: qaRejection.rejection_id },
            data: {
              scrap_id: scrapIdValue
            }
          });

          processResults.rejections.push({
            disposition: 'SCRAP',
            quantity: rejQty,
            scrap_id: scrapIdValue
          });

        } else if (rejection.disposition === 'DISPOSAL') {
          processResults.rejections.push({
            disposition: 'DISPOSAL',
            quantity: rejQty,
            disposal_date: new Date()
          });
        }

        logger.info({
          inventoryId,
          productId: inventory.product_id,
          quantity: rejQty,
          disposition: rejection.disposition
        }, 'Partial rejection processed');
      }

      return processResults;
    });

    logger.info({
      inventoryId,
      productId: inventory.product_id,
      originalQuantity: inventory.quantity,
      approved: approved_quantity,
      rejected: total_rejected,
      results
    }, 'Partial QA inspection completed');

    return res.status(200).json({
      success: true,
      message: 'Partial QA inspection completed successfully',
      data: {
        inventoryId,
        original_quantity: inventory.quantity,
        approved_quantity,
        rejected_quantity: total_rejected,
        results
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      inventoryId: req.params.inventoryId,
      body: req.body,
      inventoryQuantity: inventory?.quantity
    }, 'Failed to process partial QA inspection');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process partial QA inspection'
    });
  }
};

/**
 * Export QA history (CSV/JSON)
 */
export const exportQAHistory = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    await initLocationHelpers();
    const qaLocation = await getOrCreateLocation(QA_CODE, 'QA Section', 'QA');

    const qaInventory = await prisma.inventory.findMany({
      where: {
        location_id: qaLocation.location_id,
        product_id: { not: null },
        quantity: 0  // ✅ Only history items (processed QA)
      },
      include: {
        product: {
          include: {
            oem: true,
            model: true,
            uom: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { updated_at: 'desc' }
    });

    // ✅ Remove duplicates based on inventory_id (keep the most recent one)
    const uniqueInventoryMap = new Map();
    qaInventory.forEach(item => {
      const existing = uniqueInventoryMap.get(item.inventory_id);
      if (!existing || new Date(item.updated_at) > new Date(existing.updated_at)) {
        uniqueInventoryMap.set(item.inventory_id, item);
      }
    });
    const uniqueQaInventory = Array.from(uniqueInventoryMap.values());

    const inventoryIds = uniqueQaInventory.map(i => i.inventory_id);
    const qaRejections = await prisma.qARejection.findMany({
      where: { inventory_id: { in: inventoryIds } },
      include: {
        reworkWO: {
          select: { wo_no: true }
        }
      }
    });

    const rejectionsByInventory = new Map();
    qaRejections.forEach(rej => {
      if (!rejectionsByInventory.has(rej.inventory_id)) {
        rejectionsByInventory.set(rej.inventory_id, []);
      }
      rejectionsByInventory.get(rej.inventory_id).push(rej);
    });

    // Get work orders from inventory transactions
    const inventoryTxns = await prisma.inventoryTxn.findMany({
      where: {
        inventory_id: { in: inventoryIds },
        txn_type: 'RECEIVE',
        wo_id: { not: null }
      },
      include: {
        workOrder: {
          select: { wo_no: true }
        }
      }
    });

    const woByInventory = new Map();
    inventoryTxns.forEach(txn => {
      if (txn.workOrder && !woByInventory.has(txn.inventory_id)) {
        woByInventory.set(txn.inventory_id, txn.workOrder.wo_no);
      }
    });

    // Get location IDs for breakdown calculation
    const finishedGoodsLocationId = await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');
    const reworkLocationId = await getOrCreateLocation('REWORK-AREA', 'Rework Area', 'REWORK');

    // Helper function to format date for Excel (DD/MM/YYYY)
    const formatDateForExcel = (dateValue) => {
      if (!dateValue) return '';
      try {
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return '';
      }
    };

    // Calculate breakdown for each item
    const exportData = await Promise.all(uniqueQaInventory.map(async (item) => {
      const rejections = rejectionsByInventory.get(item.inventory_id) || [];
      const breakdown = {
        approved: 0,
        rejected: 0,
        rework: 0,
        scrap: 0,
        disposal: 0
      };

      // Calculate rejected quantities from QARejection records
      for (const rej of rejections) {
        let qty = parseFloat(rej.quantity || 0);
        
        // If quantity is NULL (old record), skip for now (will check inventory later)
        if (!qty || qty === 0) {
          continue; // Skip this rejection, will check inventory later
        }
        
        breakdown.rejected += qty;
        if (rej.disposition === 'REWORK') breakdown.rework += qty;
        else if (rej.disposition === 'SCRAP') breakdown.scrap += qty;
        else if (rej.disposition === 'DISPOSAL') breakdown.disposal += qty;
      }

      // ✅ NEW: For old records without quantity in QARejection, check Rework Area and Scrap Inventory
      if (breakdown.rejected === 0 && rejections.length > 0) {
        // Check Rework Area inventory
        const reworkInv = await prisma.inventory.findFirst({
          where: {
            product_id: item.product_id,
            location_id: reworkLocationId,
            created_at: {
              gte: new Date(item.updated_at.getTime() - 3600000), // Within 1 hour
              lte: new Date(item.updated_at.getTime() + 3600000)
            }
          },
          orderBy: { created_at: 'desc' }
        });
        
        if (reworkInv) {
          const reworkQty = parseFloat(reworkInv.quantity || 0);
          breakdown.rejected += reworkQty;
          breakdown.rework += reworkQty;
        }
        
        // Check Scrap Inventory (via scrap_inventory table)
        try {
          const scrapCheck = await prisma.$queryRaw`
            SELECT SUM(weight_kg)::numeric as total_scrap
            FROM scrap_inventory
            WHERE reference LIKE ${`%QA-REJECTED-%${item.inventory_id}%`}
              AND created_at BETWEEN 
                ${new Date(item.updated_at.getTime() - 3600000)}::timestamp AND
                ${new Date(item.updated_at.getTime() + 3600000)}::timestamp
          `;
          
          if (scrapCheck && scrapCheck[0]?.total_scrap) {
            const scrapQty = parseFloat(scrapCheck[0].total_scrap || 0);
            breakdown.rejected += scrapQty;
            breakdown.scrap += scrapQty;
          }
        } catch (scrapError) {
          // Ignore scrap check errors
        }
      }

      // Calculate approved quantity from InventoryTxn records
      if (item.quantity === 0) {
        // Check for partial QA first
        const approvedTxn = await prisma.inventoryTxn.findFirst({
          where: {
            reference: { contains: `QA-PARTIAL-APPROVED-${item.inventory_id}` },
            txn_type: 'TRANSFER',
            product_id: item.product_id
          },
          orderBy: { created_at: 'desc' }
        });

        if (approvedTxn) {
          breakdown.approved = parseFloat(approvedTxn.quantity || 0);
        } else {
          // Check for full approval (old format)
          const fullApprovalTxn = await prisma.inventoryTxn.findFirst({
            where: {
              inventory_id: item.inventory_id,
              txn_type: { in: ['TRANSFER', 'RECEIVE'] },
              product_id: item.product_id,
              reference: { contains: 'QA-APPROVED' }
            },
            orderBy: { created_at: 'desc' }
          });
          
          if (fullApprovalTxn) {
            breakdown.approved = Math.abs(parseFloat(fullApprovalTxn.quantity || 0));
          } else {
            // Fallback: Check Finished Goods inventory created around same time
            const finishedGoodsInv = await prisma.inventory.findFirst({
              where: {
                product_id: item.product_id,
                location_id: finishedGoodsLocationId,
                created_at: {
                  gte: new Date(item.updated_at.getTime() - 3600000),
                  lte: new Date(item.updated_at.getTime() + 3600000)
                }
              },
              orderBy: { created_at: 'desc' }
            });
            
            if (finishedGoodsInv) {
              breakdown.approved = parseFloat(finishedGoodsInv.quantity || 0);
            }
          }
        }
      }

      let qaStatus = 'PENDING';
      if (item.quantity === 0) {
        if (rejections.length > 0) {
          qaStatus = 'REJECTED';
        } else if (item.status === 'AVAILABLE') {
          qaStatus = 'APPROVED';
        }
      }

      return {
        inventory_id: item.inventory_id,
        product_code: item.product?.product_code || '',
        product_name: item.product?.part_name || '',
        oem: item.product?.oem?.oem_name || '',
        model: item.product?.model?.model_name || '',
        quantity: item.quantity,
        quantity_approved: breakdown.approved,
        quantity_rejected: breakdown.rejected,
        quantity_rework: breakdown.rework,
        quantity_scrap: breakdown.scrap,
        quantity_disposal: breakdown.disposal,
        qa_status: qaStatus,
        disposition: rejections[0]?.disposition || '',
        rejection_reason: rejections[0]?.rejection_reason || '',
        rework_wo_no: rejections[0]?.reworkWO?.wo_no || '',
        wo_no: woByInventory.get(item.inventory_id) || '',
        uom_code: item.uom?.code || item.product?.uom?.code || '',
        received_at: formatDateForExcel(item.updated_at || item.created_at),
        created_at: formatDateForExcel(item.created_at)
      };
    }));

    // ✅ Final deduplication: Remove any remaining duplicates by inventory_id
    const finalExportData = [];
    const seenIds = new Set();
    for (const item of exportData) {
      if (!seenIds.has(item.inventory_id)) {
        seenIds.add(item.inventory_id);
        finalExportData.push(item);
      }
    }

    if (format === 'pdf') {
      let browser;
      try {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>QA History Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .company-header { text-align: center; margin-bottom: 20px; }
                .company-header h1 { color: #333; margin: 0; }
                .company-header p { color: #666; margin: 4px 0; }
                .meta { text-align: center; margin: 12px 0 18px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 20px; text-align: center; color: #666; font-size: 11px; }
              </style>
            </head>
            <body>
              <div class="company-header">
                <h1>Enterprising Manufacturing Co Pvt. Ltd.</h1>
                <p>Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900</p>
                <p>Tel: (+9221) 3507 5579 | (+92300) 9279500</p>
                <p>NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785</p>
              </div>
              <div class="meta">
                <h2>QA History Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()} &nbsp; | &nbsp; Total Records: ${finalExportData.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>OEM</th>
                    <th>Model</th>
                    <th>QA Status</th>
                    <th>Disposition</th>
                    <th>Approved</th>
                    <th>Rework</th>
                    <th>Scrap</th>
                    <th>Disposal</th>
                    <th>Work Order</th>
                    <th>Rework WO</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  ${finalExportData.map(item => `
                    <tr>
                      <td>${item.product_code || ''}</td>
                      <td>${item.product_name || ''}</td>
                      <td>${item.oem || ''}</td>
                      <td>${item.model || ''}</td>
                      <td>${item.qa_status || ''}</td>
                      <td>${item.disposition || ''}</td>
                      <td>${item.quantity_approved || 0}</td>
                      <td>${item.quantity_rework || 0}</td>
                      <td>${item.quantity_scrap || 0}</td>
                      <td>${item.quantity_disposal || 0}</td>
                      <td>${item.wo_no || ''}</td>
                      <td>${item.rework_wo_no || ''}</td>
                      <td>${item.received_at ? new Date(item.received_at).toLocaleDateString() : ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                This report was generated automatically by the ERP system.
              </div>
            </body>
          </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="qa-history-${new Date()
            .toISOString()
            .split('T')[0]}.pdf"`
        );
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
      } catch (pdfError) {
        logger.error({ error: pdfError }, 'Failed to generate QA history PDF');
        if (browser) {
          await browser.close();
        }
        return res.status(500).json({
          error: 'Failed to generate PDF',
          message: 'PDF generation failed. Please try again or use CSV export instead.',
        });
      }
    } else if (format === 'csv') {
      const headers = [
        'Inventory ID','Product Code','Product Name','OEM','Model','Quantity',
        'Approved Qty','Rejected Qty','Rework Qty','Scrap Qty','Disposal Qty',
        'QA Status','Disposition','Rejection Reason','Rework WO','Work Order',
        'UOM','Received At','Created At'
      ];

      const csvRows = finalExportData.map(item =>
        [
          item.inventory_id,
          item.product_code,
          item.product_name,
          item.oem,
          item.model,
          item.quantity,
          item.quantity_approved,
          item.quantity_rejected,
          item.quantity_rework,
          item.quantity_scrap,
          item.quantity_disposal,
          item.qa_status,
          item.disposition,
          (item.rejection_reason || '').replace(/"/g, '""'),
          item.rework_wo_no,
          item.wo_no,
          item.uom_code,
          item.received_at || '',
          item.created_at || ''
        ].map(field => `"${field}"`).join(',')
      );

      // Add company header information (centered by adding empty cells)
      const numColumns = headers.length;
      const emptyCells = Array(numColumns).fill('').map(c => `"${c}"`).join(',');
      // Center text by adding empty cells before (approximately half the columns)
      const centerPadding = Math.floor(numColumns / 2) - 1;
      const leftPadding = Array(centerPadding).fill('').map(c => `"${c}"`).join(',');
      const rightPadding = Array(numColumns - centerPadding - 1).fill('').map(c => `"${c}"`).join(',');
      
      // Company info with spacing for emphasis (using uppercase for bold effect)
      const companyHeader = `${leftPadding},"ENTERPRISING MANUFACTURING CO PVT. LTD.",${rightPadding}`;
      const companyInfo = `${leftPadding},"Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900",${rightPadding}`;
      const companyContact = `${leftPadding},"Tel: (+9221) 3507 5579 | (+92300) 9279500",${rightPadding}`;
      const companyTax = `${leftPadding},"NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785",${rightPadding}`;
      const reportTitle = `${leftPadding},"QA HISTORY REPORT",${rightPadding}`;
      const reportMeta = `${leftPadding},"Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${finalExportData.length}",${rightPadding}`;
      
      const csvContent = companyHeader + '\n' +
                        companyInfo + '\n' +
                        companyContact + '\n' +
                        companyTax + '\n' +
                        emptyCells + '\n' +
                        reportTitle + '\n' +
                        reportMeta + '\n' +
                        emptyCells + '\n' +
                        headers.join(',') + '\n' +
                        csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="qa-history-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    return res.status(200).json({
      success: true,
      data: finalExportData,
      count: finalExportData.length
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to export QA history');
    return res.status(500).json({
      success: false,
      error: 'Failed to export QA history',
      message: error.message
    });
  }
};

export default {
  getInventoryByLocationType,
  updateQAStatus,
  updateQAStatusPartial,
  exportQAHistory
};

