// src/services/workOrderIntegration.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import auditTrailService from './auditTrail.service.js';

const prisma = new PrismaClient();

/**
 * Work Order Integration Service
 * Handles BOM explosion, material reservation, and production planning
 */

/**
 * Explode BOM (Bill of Materials) for a work order
 */
export const explodeBOM = async (workOrderId) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { wo_id: workOrderId },
      include: {
        wo_items: {
          include: {
            product: {
              include: {
                bom: {
                  include: {
                    material: true,
                    uom: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const materialRequirements = [];
    const explodedItems = new Map(); // To aggregate materials

    // Process each work order item
    for (const woItem of workOrder.wo_items) {
      const product = woItem.product;
      const orderQuantity = woItem.quantity;

      // Process BOM items for this product
      for (const bomItem of product.bom) {
        const materialId = bomItem.material_id;
        const requiredQuantity = bomItem.quantity * orderQuantity;

        if (explodedItems.has(materialId)) {
          // Aggregate quantities for the same material
          explodedItems.set(materialId, {
            ...explodedItems.get(materialId),
            required_quantity: explodedItems.get(materialId).required_quantity + requiredQuantity
          });
        } else {
          explodedItems.set(materialId, {
            material_id: materialId,
            material_name: bomItem.material.name,
            material_code: bomItem.material.material_code,
            required_quantity: requiredQuantity,
            unit_of_measure: bomItem.uom?.name || 'EA',
            bom_level: 1,
            parent_product: product.part_name
          });
        }
      }
    }

    const explodedBOM = Array.from(explodedItems.values());

    // Calculate availability and reservations
    const bomWithAvailability = await Promise.all(
      explodedBOM.map(async (item) => {
        const currentStock = await getCurrentMaterialStock(item.material_id);
        const availableQuantity = currentStock.quantity || 0;
        const reservedQuantity = await getReservedQuantity(item.material_id);
        const netAvailable = availableQuantity - reservedQuantity;
        const shortage = Math.max(0, item.required_quantity - netAvailable);

        return {
          ...item,
          current_stock: availableQuantity,
          reserved_quantity: reservedQuantity,
          net_available: netAvailable,
          shortage: shortage,
          can_fulfill: shortage === 0,
          fulfillment_percentage: netAvailable > 0 ? 
            Math.min(100, (netAvailable / item.required_quantity) * 100) : 0
        };
      })
    );

    const totalShortage = bomWithAvailability.reduce((sum, item) => sum + item.shortage, 0);
    const canStartProduction = totalShortage === 0;

    logger.info({
      work_order_id: workOrderId,
      total_materials: bomWithAvailability.length,
      total_shortage: totalShortage,
      can_start: canStartProduction
    }, 'BOM exploded successfully');

    return {
      work_order_id: workOrderId,
      exploded_bom: bomWithAvailability,
      summary: {
        total_materials: bomWithAvailability.length,
        total_required_quantity: explodedBOM.reduce((sum, item) => sum + item.required_quantity, 0),
        total_shortage: totalShortage,
        can_start_production: canStartProduction,
        fulfillment_percentage: bomWithAvailability.length > 0 ? 
          bomWithAvailability.reduce((sum, item) => sum + item.fulfillment_percentage, 0) / bomWithAvailability.length : 0
      }
    };
  } catch (error) {
    logger.error({ error: error.message, work_order_id: workOrderId }, 'Failed to explode BOM');
    throw error;
  }
};

/**
 * Reserve materials for work order
 */
export const reserveMaterials = async (workOrderId, reservationData) => {
  try {
    const { material_reservations, created_by = 'system' } = reservationData;

    const reservations = await prisma.$transaction(async (tx) => {
      const createdReservations = [];

      for (const reservation of material_reservations) {
        const { material_id, quantity, priority = 'NORMAL' } = reservation;

        // Check if we have enough available stock
        const currentStock = await getCurrentMaterialStock(material_id);
        const reservedQuantity = await getReservedQuantity(material_id);
        const availableQuantity = (currentStock.quantity || 0) - reservedQuantity;

        if (availableQuantity < quantity) {
          throw new Error(`Insufficient stock for material ${material_id}. Available: ${availableQuantity}, Required: ${quantity}`);
        }

        // Create reservation
        const materialReservation = await tx.materialReservation.create({
          data: {
            work_order_id: workOrderId,
            material_id,
            quantity,
            priority,
            status: 'RESERVED',
            created_by,
            reserved_at: new Date()
          }
        });

        createdReservations.push(materialReservation);

        // Log the reservation
        await auditTrailService.logInventoryChange(
          material_id,
          'MATERIAL_RESERVED',
          { reserved_quantity: 0 },
          { reserved_quantity: quantity, work_order_id: workOrderId },
          created_by,
          { reservation_id: materialReservation.reservation_id }
        );
      }

      return createdReservations;
    });

    logger.info({
      work_order_id: workOrderId,
      reservations_count: reservations.length,
      total_quantity: reservations.reduce((sum, r) => sum + r.quantity, 0)
    }, 'Materials reserved successfully');

    return reservations;
  } catch (error) {
    logger.error({ error: error.message, work_order_id: workOrderId }, 'Failed to reserve materials');
    throw error;
  }
};

/**
 * Release material reservations
 */
export const releaseReservations = async (workOrderId, releaseData) => {
  try {
    const { created_by = 'system' } = releaseData;

    const releasedReservations = await prisma.$transaction(async (tx) => {
      // Find all reservations for this work order
      const reservations = await tx.materialReservation.findMany({
        where: {
          work_order_id: workOrderId,
          status: 'RESERVED'
        }
      });

      const released = [];

      for (const reservation of reservations) {
        // Update reservation status
        const updatedReservation = await tx.materialReservation.update({
          where: { reservation_id: reservation.reservation_id },
          data: {
            status: 'RELEASED',
            released_at: new Date(),
            released_by: created_by
          }
        });

        released.push(updatedReservation);

        // Log the release
        await auditTrailService.logInventoryChange(
          reservation.material_id,
          'MATERIAL_RESERVATION_RELEASED',
          { reserved_quantity: reservation.quantity },
          { reserved_quantity: 0, work_order_id: workOrderId },
          created_by,
          { reservation_id: reservation.reservation_id }
        );
      }

      return released;
    });

    logger.info({
      work_order_id: workOrderId,
      released_count: releasedReservations.length
    }, 'Material reservations released successfully');

    return releasedReservations;
  } catch (error) {
    logger.error({ error: error.message, work_order_id: workOrderId }, 'Failed to release reservations');
    throw error;
  }
};

/**
 * Consume reserved materials for production
 */
export const consumeReservedMaterials = async (workOrderId, consumptionData) => {
  try {
    const { material_consumptions, created_by = 'system' } = consumptionData;

    const consumptions = await prisma.$transaction(async (tx) => {
      const createdConsumptions = [];

      for (const consumption of material_consumptions) {
        const { material_id, quantity } = consumption;

        // Find the reservation
        const reservation = await tx.materialReservation.findFirst({
          where: {
            work_order_id: workOrderId,
            material_id,
            status: 'RESERVED'
          }
        });

        if (!reservation) {
          throw new Error(`No reservation found for material ${material_id} in work order ${workOrderId}`);
        }

        if (reservation.quantity < quantity) {
          throw new Error(`Insufficient reserved quantity for material ${material_id}. Reserved: ${reservation.quantity}, Consuming: ${quantity}`);
        }

        // Update inventory (reduce stock)
        const currentInventory = await tx.inventory.findFirst({
          where: { material_id }
        });

        if (!currentInventory) {
          throw new Error(`Inventory not found for material ${material_id}`);
        }

        const newQuantity = currentInventory.quantity - quantity;
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock for material ${material_id}. Available: ${currentInventory.quantity}, Required: ${quantity}`);
        }

        // Update inventory
        await tx.inventory.update({
          where: { inventory_id: currentInventory.inventory_id },
          data: { 
            quantity: newQuantity,
            updated_at: new Date()
          }
        });

        // Create consumption record
        const materialConsumption = await tx.materialConsumption.create({
          data: {
            work_order_id: workOrderId,
            material_id,
            quantity,
            consumed_at: new Date(),
            created_by
          }
        });

        // Update reservation
        const remainingReserved = reservation.quantity - quantity;
        await tx.materialReservation.update({
          where: { reservation_id: reservation.reservation_id },
          data: {
            quantity: remainingReserved,
            status: remainingReserved === 0 ? 'CONSUMED' : 'PARTIALLY_CONSUMED'
          }
        });

        // Create inventory transaction
        await tx.inventoryTxn.create({
          data: {
            inventory_id: currentInventory.inventory_id,
            material_id,
            wo_id: workOrderId,
            txn_type: 'ISSUE',
            quantity: -quantity,
            location_id: currentInventory.location_id,
            reference: `WO-${workOrderId}`,
            created_by
          }
        });

        createdConsumptions.push(materialConsumption);

        // Log the consumption
        await auditTrailService.logInventoryChange(
          material_id,
          'MATERIAL_CONSUMED',
          { quantity: currentInventory.quantity },
          { quantity: newQuantity, work_order_id: workOrderId },
          created_by,
          { consumption_id: materialConsumption.consumption_id }
        );
      }

      return createdConsumptions;
    });

    logger.info({
      work_order_id: workOrderId,
      consumptions_count: consumptions.length,
      total_consumed: consumptions.reduce((sum, c) => sum + c.quantity, 0)
    }, 'Materials consumed successfully');

    return consumptions;
  } catch (error) {
    logger.error({ error: error.message, work_order_id: workOrderId }, 'Failed to consume materials');
    throw error;
  }
};

/**
 * Get work order material status
 */
export const getWorkOrderMaterialStatus = async (workOrderId) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { wo_id: workOrderId },
      include: {
        materialReservations: {
          include: {
            material: true
          }
        },
        materialConsumptions: {
          include: {
            material: true
          }
        }
      }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Calculate summary
    const totalReserved = workOrder.materialReservations.reduce((sum, r) => sum + r.quantity, 0);
    const totalConsumed = workOrder.materialConsumptions.reduce((sum, c) => sum + c.quantity, 0);
    const remainingReserved = totalReserved - totalConsumed;

    return {
      work_order_id: workOrderId,
      summary: {
        total_reserved: totalReserved,
        total_consumed: totalConsumed,
        remaining_reserved: remainingReserved,
        reservation_count: workOrder.materialReservations.length,
        consumption_count: workOrder.materialConsumptions.length
      },
      reservations: workOrder.materialReservations,
      consumptions: workOrder.materialConsumptions
    };
  } catch (error) {
    logger.error({ error: error.message, work_order_id: workOrderId }, 'Failed to get work order material status');
    throw error;
  }
};

/**
 * Helper function to get current material stock
 */
const getCurrentMaterialStock = async (materialId) => {
  const inventory = await prisma.inventory.findFirst({
    where: { material_id: materialId }
  });
  return inventory || { quantity: 0 };
};

/**
 * Helper function to get reserved quantity
 */
const getReservedQuantity = async (materialId) => {
  const reservations = await prisma.materialReservation.findMany({
    where: {
      material_id: materialId,
      status: { in: ['RESERVED', 'PARTIALLY_CONSUMED'] }
    }
  });
  return reservations.reduce((sum, r) => sum + r.quantity, 0);
};

export default {
  explodeBOM,
  reserveMaterials,
  releaseReservations,
  consumeReservedMaterials,
  getWorkOrderMaterialStatus
};
