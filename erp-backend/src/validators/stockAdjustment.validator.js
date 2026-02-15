// src/validators/stockAdjustment.validator.js
import Joi from 'joi';

const adjustStockSchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  quantity: Joi.number().positive().required(),
  adjustment_type: Joi.string().valid('INCREASE', 'DECREASE', 'SET').required(),
  reason: Joi.string().trim().min(1).required(),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  reference: Joi.string().trim().allow(null)
}).custom((value, helpers) => {
  // Either product_id or material_id must be provided, but not both
  if (!value.product_id && !value.material_id) {
    return helpers.error('custom.eitherProductOrMaterial');
  }
  if (value.product_id && value.material_id) {
    return helpers.error('custom.bothProductAndMaterial');
  }
  return value;
}).messages({
  'custom.eitherProductOrMaterial': 'Either product_id or material_id must be provided',
  'custom.bothProductAndMaterial': 'Cannot provide both product_id and material_id'
});

const stockAdjustmentHistorySchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

const stockLevelsSchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  low_stock_threshold: Joi.number().positive().allow(null)
});

const stockMovementSchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null)
});

export const validateStockAdjustment = (payload) => adjustStockSchema.validate(payload, { abortEarly: false });
export const validateStockAdjustmentHistory = (payload) => stockAdjustmentHistorySchema.validate(payload, { abortEarly: false });
export const validateStockLevels = (payload) => stockLevelsSchema.validate(payload, { abortEarly: false });
export const validateStockMovement = (payload) => stockMovementSchema.validate(payload, { abortEarly: false });
