// src/controllers/productionRecipe.controller.js
import * as productionRecipeModel from '../models/productionRecipe.model.js';
import { logger } from '../utils/logger.js';

/**
 * Production Recipe Controller
 * Handles production recipes, BOM, and routing operations
 */

export const createRecipe = async (req, res) => {
  try {
    const payload = req.body;

    // Validate required fields
    const requiredFields = ['part_number', 'part_description', 'model', 'recipe_name'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    const recipe = await productionRecipeModel.createRecipe(payload);

    logger.info({ recipe_id: recipe.recipe_id }, 'Production recipe created via API');

    return res.status(201).json({
      success: true,
      data: recipe,
      message: 'Production recipe created successfully'
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to create production recipe');

    return res.status(500).json({
      success: false,
      error: 'Failed to create production recipe',
      details: error.message
    });
  }
};

export const getAllRecipes = async (req, res) => {
  try {
    const filters = req.query;
    const recipes = await productionRecipeModel.getAllRecipes(filters);

    return res.status(200).json({
      success: true,
      data: recipes,
      count: recipes.length
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get production recipes');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve production recipes',
      details: error.message
    });
  }
};

export const getRecipeById = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const recipe = await productionRecipeModel.getRecipeById(recipe_id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Production recipe not found'
      });
    }

    // Get BOM items and routing steps
    const [bomItems, routingSteps] = await Promise.all([
      productionRecipeModel.getBomItems(recipe_id),
      productionRecipeModel.getRoutingSteps(recipe_id)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...recipe,
        bom_items: bomItems,
        routing_steps: routingSteps
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get production recipe by ID');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve production recipe',
      details: error.message
    });
  }
};

export const getRecipeByPartNumber = async (req, res) => {
  try {
    const { part_number } = req.params;
    const { version } = req.query;

    const recipe = await productionRecipeModel.getRecipeByPartNumber(part_number, version);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Production recipe not found for this part number'
      });
    }

    return res.status(200).json({
      success: true,
      data: recipe
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get production recipe by part number');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve production recipe',
      details: error.message
    });
  }
};

export const addBomItem = async (req, res) => {
  try {
    const { recipe_id } = req.params;
    const bomItem = req.body;

    // Validate required fields
    const requiredFields = ['part_number', 'part_description', 'quantity_required'];
    for (const field of requiredFields) {
      if (!bomItem[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    const newBomItem = await productionRecipeModel.addBomItem(recipe_id, bomItem);

    logger.info({ bom_id: newBomItem.bom_id }, 'BOM item added via API');

    return res.status(201).json({
      success: true,
      data: newBomItem,
      message: 'BOM item added successfully'
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to add BOM item');

    return res.status(500).json({
      success: false,
      error: 'Failed to add BOM item',
      details: error.message
    });
  }
};

export const getBomItems = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const bomItems = await productionRecipeModel.getBomItems(recipe_id);

    return res.status(200).json({
      success: true,
      data: bomItems
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get BOM items');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve BOM items',
      details: error.message
    });
  }
};

export const addRoutingStep = async (req, res) => {
  try {
    const { recipe_id } = req.params;
    const routingStep = req.body;

    // Validate required fields
    const requiredFields = ['operation_code', 'operation_name', 'operation_type', 'sequence_order'];
    for (const field of requiredFields) {
      if (!routingStep[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    const newRoutingStep = await productionRecipeModel.addRoutingStep(recipe_id, routingStep);

    logger.info({ routing_id: newRoutingStep.routing_id }, 'Routing step added via API');

    return res.status(201).json({
      success: true,
      data: newRoutingStep,
      message: 'Routing step added successfully'
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to add routing step');

    return res.status(500).json({
      success: false,
      error: 'Failed to add routing step',
      details: error.message
    });
  }
};

export const getRoutingSteps = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const routingSteps = await productionRecipeModel.getRoutingSteps(recipe_id);

    return res.status(200).json({
      success: true,
      data: routingSteps
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get routing steps');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve routing steps',
      details: error.message
    });
  }
};

export const getWorkCenters = async (req, res) => {
  try {
    const workCenters = await productionRecipeModel.getWorkCenters();

    return res.status(200).json({
      success: true,
      data: workCenters
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get work centers');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve work centers',
      details: error.message
    });
  }
};

export const getMachines = async (req, res) => {
  try {
    const { work_center_id } = req.query;
    const machines = await productionRecipeModel.getMachines(work_center_id);

    return res.status(200).json({
      success: true,
      data: machines
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get machines');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve machines',
      details: error.message
    });
  }
};

export const createSampleRecipe = async (req, res) => {
  try {
    const { part_number = '54410-EDG50', model = 'FMBJ' } = req.body;

    // Create sample recipe based on TANK S/A AIR specifications
    const recipeData = {
      part_number,
      part_description: 'TANK S/A AIR',
      model,
      recipe_name: `${part_number} Production Recipe`,
      created_by: 'System'
    };

    const recipe = await productionRecipeModel.createRecipe(recipeData);

    // Add BOM items based on the specifications
    const bomItems = [
      {
        part_number: 'S4411-EDE60',
        part_description: 'PLATE, MAIN',
        sub_assembly_name: 'Main',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 1,
        blank_thickness: 3.0,
        specification: 'THICKNESS 3.0',
        sequence_order: 1
      },
      {
        part_number: 'S4412-E0570',
        part_description: 'PLATE, END',
        sub_assembly_name: 'End Plate',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 2,
        blank_thickness: 3.0,
        specification: 'THICKNESS 3.0',
        sequence_order: 2
      },
      {
        part_number: 'S4480-2218F',
        part_description: 'BOSS',
        sub_assembly_name: 'Boss',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 1,
        specification: 'PT 1/2',
        sequence_order: 3
      },
      {
        part_number: 'S4480-1131F',
        part_description: 'BOSS',
        sub_assembly_name: 'Boss',
        manufacturing_facility: 'IN_HOUSE',
        quantity_required: 1,
        specification: 'M22x1.5',
        sequence_order: 4
      }
    ];

    // Add BOM items
    for (const bomItem of bomItems) {
      await productionRecipeModel.addBomItem(recipe.recipe_id, bomItem);
    }

    // Add routing steps based on process flow
    const routingSteps = [
      {
        operation_code: 'CUT001',
        operation_name: 'Cutting/Shearing',
        operation_type: 'PROCESS',
        sequence_order: 1,
        work_center: 'WC001',
        setup_time_minutes: 30,
        run_time_per_piece_minutes: 5
      },
      {
        operation_code: 'FORM001',
        operation_name: 'Forming/Bending',
        operation_type: 'PROCESS',
        sequence_order: 2,
        work_center: 'WC002',
        setup_time_minutes: 45,
        run_time_per_piece_minutes: 8
      },
      {
        operation_code: 'WELD001',
        operation_name: 'Welding - Tacking',
        operation_type: 'CRITICAL_PROCESS',
        sequence_order: 3,
        work_center: 'WC003',
        setup_time_minutes: 20,
        run_time_per_piece_minutes: 15
      },
      {
        operation_code: 'WELD002',
        operation_name: 'Welding - Main Seams',
        operation_type: 'CRITICAL_PROCESS',
        sequence_order: 4,
        work_center: 'WC003',
        setup_time_minutes: 30,
        run_time_per_piece_minutes: 25
      },
      {
        operation_code: 'INSP001',
        operation_name: 'Leakage Testing',
        operation_type: 'INSPECTION',
        sequence_order: 5,
        work_center: 'WC007',
        setup_time_minutes: 15,
        run_time_per_piece_minutes: 10,
        quality_check_required: true
      },
      {
        operation_code: 'PAINT001',
        operation_name: 'Painting',
        operation_type: 'PROCESS',
        sequence_order: 6,
        work_center: 'WC005',
        setup_time_minutes: 60,
        run_time_per_piece_minutes: 20
      },
      {
        operation_code: 'FINAL001',
        operation_name: 'Final Inspection',
        operation_type: 'INSPECTION',
        sequence_order: 7,
        work_center: 'WC007',
        setup_time_minutes: 10,
        run_time_per_piece_minutes: 5,
        quality_check_required: true
      }
    ];

    // Add routing steps
    for (const routingStep of routingSteps) {
      await productionRecipeModel.addRoutingStep(recipe.recipe_id, routingStep);
    }

    // Get complete recipe with BOM and routing
    const completeRecipe = await productionRecipeModel.getRecipeById(recipe.recipe_id);
    const [fetchedBomItems, fetchedRoutingSteps] = await Promise.all([
      productionRecipeModel.getBomItems(recipe.recipe_id),
      productionRecipeModel.getRoutingSteps(recipe.recipe_id)
    ]);

    logger.info({ recipe_id: recipe.recipe_id }, 'Sample recipe created');

    return res.status(201).json({
      success: true,
      data: {
        ...completeRecipe,
        bom_items: fetchedBomItems,
        routing_steps: fetchedRoutingSteps
      },
      message: 'Sample production recipe created successfully'
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to create sample recipe');

    return res.status(500).json({
      success: false,
      error: 'Failed to create sample recipe',
      details: error.message
    });
  }
};
