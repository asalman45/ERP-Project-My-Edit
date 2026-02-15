// Planned Production Controller - Handles HTTP requests for planned production operations

import * as plannedProductionModel from '../models/plannedProduction.model.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new planned production
 * POST /api/planned-production
 */
export const createPlannedProduction = async (req, res) => {
  try {
    const planData = req.body;
    
    // Validate required fields
    if (!planData.product_id || !planData.quantity_planned || !planData.start_date) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, quantity planned, and start date are required'
      });
    }
    
    const plannedProduction = await plannedProductionModel.createPlannedProduction(planData);
    
    logger.info({
      planned_production_id: plannedProduction.planned_production_id,
      plan_number: plannedProduction.plan_number
    }, 'Planned production created via API');
    
    res.status(201).json({
      success: true,
      message: 'Planned production created successfully',
      data: plannedProduction
    });
    
  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'Failed to create planned production');
    res.status(500).json({
      success: false,
      message: 'Failed to create planned production',
      error: error.message
    });
  }
};

/**
 * Get all planned productions with optional filters
 * GET /api/planned-production
 */
export const getAllPlannedProductions = async (req, res) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status,
      product_id: req.query.product_id,
      start_date_from: req.query.start_date_from,
      start_date_to: req.query.start_date_to
    };
    
    const plannedProductions = await plannedProductionModel.getAllPlannedProductions(filters);
    
    res.json({
      success: true,
      data: plannedProductions,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        count: plannedProductions.length
      }
    });
    
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, query: req.query }, 'Failed to get planned productions');
    res.status(500).json({
      success: false,
      message: 'Failed to get planned productions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get planned production by ID
 * GET /api/planned-production/:id
 */
export const getPlannedProductionById = async (req, res) => {
  try {
    const { id } = req.params;
    const plannedProduction = await plannedProductionModel.getPlannedProductionById(id);
    
    if (!plannedProduction) {
      return res.status(404).json({
        success: false,
        message: 'Planned production not found'
      });
    }
    
    res.json({
      success: true,
      data: plannedProduction
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 
      'Failed to get planned production by ID');
    res.status(500).json({
      success: false,
      message: 'Failed to get planned production',
      error: error.message
    });
  }
};

/**
 * Update planned production
 * PATCH /api/planned-production/:id
 */
export const updatePlannedProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const plannedProduction = await plannedProductionModel.updatePlannedProduction(id, updateData);
    
    logger.info({ planned_production_id: id }, 'Planned production updated via API');
    
    res.json({
      success: true,
      message: 'Planned production updated successfully',
      data: plannedProduction
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id, body: req.body }, 
      'Failed to update planned production');
    res.status(500).json({
      success: false,
      message: 'Failed to update planned production',
      error: error.message
    });
  }
};

/**
 * Delete planned production
 * DELETE /api/planned-production/:id
 */
export const deletePlannedProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const plannedProduction = await plannedProductionModel.deletePlannedProduction(id);
    
    logger.info({ planned_production_id: id }, 'Planned production deleted via API');
    
    res.json({
      success: true,
      message: 'Planned production deleted successfully',
      data: plannedProduction
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 
      'Failed to delete planned production');
    
    const statusCode = error.message.includes('not found') ? 404 
                     : error.message.includes('Cannot delete') ? 400 
                     : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete planned production',
      error: error.message
    });
  }
};

/**
 * Run MRP planning for planned production
 * POST /api/planned-production/:id/run-mrp
 */
export const runMRPPlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { created_by } = req.body;
    
    const result = await plannedProductionModel.runMRPForPlannedProduction(
      id,
      created_by || 'system'
    );
    
    logger.info({ planned_production_id: id }, 'MRP planning completed via API');
    
    res.json({
      success: true,
      message: 'MRP planning completed successfully',
      data: result
    });
    
  } catch (error) {
    logger.error({ error: error.message, params: req.params }, 'Failed to run MRP planning');
    res.status(500).json({
      success: false,
      message: 'Failed to run MRP planning',
      error: error.message
    });
  }
};

/**
 * Convert planned production to work orders
 * POST /api/planned-production/:id/convert-to-work-orders
 */
export const convertToWorkOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { created_by = 'system' } = req.body;
    
    const result = await plannedProductionModel.convertPlannedProductionToWorkOrders(id, created_by);
    
    logger.info({
      planned_production_id: id,
      work_order_id: result.work_order.master_wo_id
    }, 'Planned production converted to work orders via API');
    
    res.json({
      success: true,
      message: 'Planned production converted to work orders successfully',
      data: result
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 
      'Failed to convert planned production to work orders');
    
    const statusCode = error.message.includes('not found') ? 404 
                     : error.message.includes('Cannot convert') ? 400 
                     : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to convert planned production to work orders',
      error: error.message
    });
  }
};

/**
 * Mark planned production as completed
 * POST /api/planned-production/:id/complete
 */
export const markCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const plannedProduction = await plannedProductionModel.markPlannedProductionCompleted(id);
    
    logger.info({ planned_production_id: id }, 'Planned production marked as completed via API');
    
    res.json({
      success: true,
      message: 'Planned production marked as completed',
      data: plannedProduction
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 
      'Failed to mark planned production as completed');
    res.status(500).json({
      success: false,
      message: 'Failed to mark planned production as completed',
      error: error.message
    });
  }
};

/**
 * Get material requirements for planned production
 * GET /api/planned-production/:id/material-requirements
 */
export const getMaterialRequirements = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequirements = await plannedProductionModel.getMaterialRequirements(id);
    
    res.json({
      success: true,
      data: materialRequirements
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 
      'Failed to get material requirements');
    res.status(500).json({
      success: false,
      message: 'Failed to get material requirements',
      error: error.message
    });
  }
};

export default {
  createPlannedProduction,
  getAllPlannedProductions,
  getPlannedProductionById,
  updatePlannedProduction,
  deletePlannedProduction,
  convertToWorkOrders,
  markCompleted,
  getMaterialRequirements
};

