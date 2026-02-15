// src/controllers/workOrderIntegration.controller.js
import workOrderIntegrationService from '../services/workOrderIntegration.service.js';
import { logger } from '../utils/logger.js';

/**
 * Work Order Integration Controller
 * Handles BOM explosion, material reservation, and production planning
 */

/**
 * POST /api/work-orders/:workOrderId/explode-bom
 * Explode BOM for a work order
 */
export const explodeBOM = async (req, res) => {
  try {
    const { workOrderId } = req.params;

    const bomExplosion = await workOrderIntegrationService.explodeBOM(workOrderId);

    logger.info({ 
      work_order_id: workOrderId,
      materials_count: bomExplosion.exploded_bom.length,
      can_start: bomExplosion.summary.can_start_production
    }, 'BOM exploded successfully');

    return res.status(200).json({
      success: true,
      data: bomExplosion,
      message: 'BOM exploded successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, work_order_id: req.params.workOrderId }, 'Failed to explode BOM');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to explode BOM'
    });
  }
};

/**
 * POST /api/work-orders/:workOrderId/reserve-materials
 * Reserve materials for work order
 */
export const reserveMaterials = async (req, res) => {
  try {
    const { workOrderId } = req.params;
    const { material_reservations, created_by = req.user?.id || 'system' } = req.body;

    if (!material_reservations || !Array.isArray(material_reservations)) {
      return res.status(400).json({
        success: false,
        error: 'material_reservations array is required'
      });
    }

    const reservations = await workOrderIntegrationService.reserveMaterials(workOrderId, {
      material_reservations,
      created_by
    });

    logger.info({ 
      work_order_id: workOrderId,
      reservations_count: reservations.length
    }, 'Materials reserved successfully');

    return res.status(201).json({
      success: true,
      data: reservations,
      message: 'Materials reserved successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, work_order_id: req.params.workOrderId }, 'Failed to reserve materials');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reserve materials'
    });
  }
};

/**
 * POST /api/work-orders/:workOrderId/release-reservations
 * Release material reservations
 */
export const releaseReservations = async (req, res) => {
  try {
    const { workOrderId } = req.params;
    const { created_by = req.user?.id || 'system' } = req.body;

    const releasedReservations = await workOrderIntegrationService.releaseReservations(workOrderId, {
      created_by
    });

    logger.info({ 
      work_order_id: workOrderId,
      released_count: releasedReservations.length
    }, 'Material reservations released successfully');

    return res.status(200).json({
      success: true,
      data: releasedReservations,
      message: 'Material reservations released successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, work_order_id: req.params.workOrderId }, 'Failed to release reservations');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to release reservations'
    });
  }
};

/**
 * POST /api/work-orders/:workOrderId/consume-materials
 * Consume reserved materials for production
 */
export const consumeMaterials = async (req, res) => {
  try {
    const { workOrderId } = req.params;
    const { material_consumptions, created_by = req.user?.id || 'system' } = req.body;

    if (!material_consumptions || !Array.isArray(material_consumptions)) {
      return res.status(400).json({
        success: false,
        error: 'material_consumptions array is required'
      });
    }

    const consumptions = await workOrderIntegrationService.consumeReservedMaterials(workOrderId, {
      material_consumptions,
      created_by
    });

    logger.info({ 
      work_order_id: workOrderId,
      consumptions_count: consumptions.length
    }, 'Materials consumed successfully');

    return res.status(200).json({
      success: true,
      data: consumptions,
      message: 'Materials consumed successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, work_order_id: req.params.workOrderId }, 'Failed to consume materials');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to consume materials'
    });
  }
};

/**
 * GET /api/work-orders/:workOrderId/material-status
 * Get work order material status
 */
export const getMaterialStatus = async (req, res) => {
  try {
    const { workOrderId } = req.params;

    const materialStatus = await workOrderIntegrationService.getWorkOrderMaterialStatus(workOrderId);

    logger.info({ work_order_id: workOrderId }, 'Material status retrieved');

    return res.status(200).json({
      success: true,
      data: materialStatus
    });
  } catch (error) {
    logger.error({ error: error.message, work_order_id: req.params.workOrderId }, 'Failed to get material status');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve material status'
    });
  }
};
