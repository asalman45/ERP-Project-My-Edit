// src/models/productionRecipe.model.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Production Recipe Model
 * Handles production recipes, BOM, and routing operations
 */

export const createRecipe = async (payload) => {
  const {
    part_number,
    part_description,
    model,
    recipe_name,
    version = '1.0',
    created_by
  } = payload;

  const query = `
    INSERT INTO production_recipe (
      part_number, part_description, model, recipe_name, version, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [part_number, part_description, model, recipe_name, version, created_by];

  try {
    const result = await db.query(query, values);
    logger.info({ recipe_id: result.rows[0].recipe_id }, 'Production recipe created');
    return result.rows[0];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create production recipe');
    throw error;
  }
};

export const getAllRecipes = async (filters = {}) => {
  let query = `
    SELECT 
      pr.*,
      COUNT(bi.bom_id) as bom_items_count,
      COUNT(pr_route.routing_id) as routing_steps_count
    FROM production_recipe pr
    LEFT JOIN bom_item bi ON pr.recipe_id = bi.recipe_id
    LEFT JOIN production_routing pr_route ON pr.recipe_id = pr_route.recipe_id
  `;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (filters.part_number) {
    conditions.push(`pr.part_number ILIKE $${paramIndex}`);
    values.push(`%${filters.part_number}%`);
    paramIndex++;
  }

  if (filters.model) {
    conditions.push(`pr.model = $${paramIndex}`);
    values.push(filters.model);
    paramIndex++;
  }

  if (filters.is_active !== undefined) {
    conditions.push(`pr.is_active = $${paramIndex}`);
    values.push(filters.is_active);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    GROUP BY pr.recipe_id
    ORDER BY pr.part_number, pr.version DESC
  `;

  if (filters.limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(filters.limit);
    paramIndex++;
  }

  if (filters.offset) {
    query += ` OFFSET $${paramIndex}`;
    values.push(filters.offset);
  }

  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get production recipes');
    throw error;
  }
};

export const getRecipeById = async (recipe_id) => {
  const query = `
    SELECT pr.*, 
           COUNT(bi.bom_id) as bom_items_count,
           COUNT(pr_route.routing_id) as routing_steps_count
    FROM production_recipe pr
    LEFT JOIN bom_item bi ON pr.recipe_id = bi.recipe_id
    LEFT JOIN production_routing pr_route ON pr.recipe_id = pr_route.recipe_id
    WHERE pr.recipe_id = $1
    GROUP BY pr.recipe_id
  `;

  try {
    const result = await db.query(query, [recipe_id]);
    return result.rows[0];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recipe by ID');
    throw error;
  }
};

export const getRecipeByPartNumber = async (part_number, version = null) => {
  let query = `
    SELECT pr.*
    FROM production_recipe pr
    WHERE pr.part_number = $1 AND pr.is_active = true
  `;

  const values = [part_number];

  if (version) {
    query += ` AND pr.version = $2`;
    values.push(version);
  } else {
    query += ` ORDER BY pr.version DESC LIMIT 1`;
  }

  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recipe by part number');
    throw error;
  }
};

// BOM (Bill of Materials) Operations
export const addBomItem = async (recipe_id, payload) => {
  const {
    part_number,
    part_description,
    sub_assembly_name,
    manufacturing_facility = 'IN_HOUSE',
    quantity_required,
    unit_of_measure = 'PCS',
    blank_width,
    blank_length,
    blank_thickness,
    blank_weight,
    specification,
    sequence_order = 1,
    is_critical = false
  } = payload;

  const query = `
    INSERT INTO bom_item (
      recipe_id, part_number, part_description, sub_assembly_name,
      manufacturing_facility, quantity_required, unit_of_measure,
      blank_width, blank_length, blank_thickness, blank_weight,
      specification, sequence_order, is_critical
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  const values = [
    recipe_id, part_number, part_description, sub_assembly_name,
    manufacturing_facility, quantity_required, unit_of_measure,
    blank_width, blank_length, blank_thickness, blank_weight,
    specification, sequence_order, is_critical
  ];

  try {
    const result = await db.query(query, values);
    logger.info({ bom_id: result.rows[0].bom_id }, 'BOM item added');
    return result.rows[0];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to add BOM item');
    throw error;
  }
};

export const getBomItems = async (recipe_id) => {
  const query = `
    SELECT 
      bi.*,
      bi.part_description as item_name,
      bi.part_number as item_code
    FROM bom_item bi
    WHERE bi.recipe_id = $1
    ORDER BY bi.sequence_order, bi.sub_assembly_name
  `;

  try {
    const result = await db.query(query, [recipe_id]);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get BOM items');
    throw error;
  }
};

// Production Routing Operations
export const addRoutingStep = async (recipe_id, payload) => {
  const {
    operation_code,
    operation_name,
    operation_type,
    sequence_order,
    work_center,
    setup_time_minutes = 0,
    run_time_per_piece_minutes = 0,
    machine_requirement,
    skill_level_required = 'MEDIUM',
    is_parallel = false,
    predecessor_operations = [],
    quality_check_required = false,
    inspection_criteria
  } = payload;

  const query = `
    INSERT INTO production_routing (
      recipe_id, operation_code, operation_name, operation_type,
      sequence_order, work_center, setup_time_minutes, run_time_per_piece_minutes,
      machine_requirement, skill_level_required, is_parallel,
      predecessor_operations, quality_check_required, inspection_criteria
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;

  const values = [
    recipe_id, operation_code, operation_name, operation_type,
    sequence_order, work_center, setup_time_minutes, run_time_per_piece_minutes,
    machine_requirement, skill_level_required, is_parallel,
    predecessor_operations, quality_check_required, inspection_criteria
  ];

  try {
    const result = await db.query(query, values);
    logger.info({ routing_id: result.rows[0].routing_id }, 'Routing step added');
    return result.rows[0];
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to add routing step');
    throw error;
  }
};

export const getRoutingSteps = async (recipe_id) => {
  const query = `
    SELECT 
      pr.*,
      wc.name as center_name,
      wc.description as center_type
    FROM production_routing pr
    LEFT JOIN work_center wc ON pr.work_center = wc.code
    WHERE pr.recipe_id = $1
    ORDER BY pr.sequence_order
  `;

  try {
    const result = await db.query(query, [recipe_id]);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get routing steps');
    throw error;
  }
};

export const createWorkOrderFromRecipe = async (recipe_id, workOrderData) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Get recipe details
    const recipeResult = await client.query(
      'SELECT * FROM production_recipe WHERE recipe_id = $1',
      [recipe_id]
    );

    if (recipeResult.rows.length === 0) {
      throw new Error('Recipe not found');
    }

    const recipe = recipeResult.rows[0];

    // Create work order
    const woData = {
      ...workOrderData,
      part_number: recipe.part_number,
      part_description: recipe.part_description,
      model: recipe.model
    };

    const woResult = await client.query(
      `      INSERT INTO manufacturing_work_order (
        wo_number, part_number, part_description, customer_name,
        customer_order_number, model, quantity_ordered, priority,
        start_date, due_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        woData.wo_number, woData.part_number, woData.part_description,
        woData.customer_name, woData.customer_order_number, woData.model,
        woData.quantity_ordered, woData.priority, woData.start_date,
        woData.due_date, woData.created_by
      ]
    );

    const workOrder = woResult.rows[0];

    // Get routing steps
    const routingResult = await client.query(
      'SELECT * FROM production_routing WHERE recipe_id = $1 ORDER BY sequence_order',
      [recipe_id]
    );

    // Create work order operations
    for (const routing of routingResult.rows) {
      await client.query(
        `INSERT INTO manufacturing_work_order_operation (
          wo_id, routing_id, operation_code, operation_name, sequence_order,
          quantity_planned, work_center
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          workOrder.wo_id, routing.routing_id, routing.operation_code,
          routing.operation_name, routing.sequence_order, woData.quantity_ordered,
          routing.work_center
        ]
      );
    }

    await client.query('COMMIT');
    logger.info({ wo_id: workOrder.wo_id }, 'Work order created from recipe');

    return workOrder;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message }, 'Failed to create work order from recipe');
    throw error;
  } finally {
    client.release();
  }
};

export const getWorkCenters = async () => {
  const query = `
    SELECT 
      wc.*,
      COUNT(m.machine_id) as machine_count,
      COUNT(CASE WHEN m.is_available = true THEN 1 END) as available_machines
    FROM work_center wc
    LEFT JOIN machine m ON wc.work_center_id = m.work_center_id
    WHERE wc.work_center_id IS NOT NULL
    GROUP BY wc.work_center_id
    ORDER BY wc.code
  `;

  try {
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get work centers');
    throw error;
  }
};

export const getMachines = async (work_center_id = null) => {
  let query = `
    SELECT 
      m.*,
      wc.name as center_name,
      wc.description as center_type
    FROM machine m
    LEFT JOIN work_center wc ON m.work_center_id = wc.work_center_id
    WHERE m.is_available = true
  `;

  const values = [];

  if (work_center_id) {
    query += ` AND m.work_center_id = $1`;
    values.push(work_center_id);
  }

  query += ` ORDER BY m.machine_code`;

  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get machines');
    throw error;
  }
};
