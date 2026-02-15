// src/validators/productionTracking.validator.js
import Joi from 'joi';

const recordMaterialUsageSchema = Joi.object({
  production_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  scrap_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  qty_issued: Joi.number().positive().required(),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
}).custom((value, helpers) => {
  // Either material_id or scrap_id must be provided, but not both
  if (!value.material_id && !value.scrap_id) {
    return helpers.error('custom.eitherMaterialOrScrap');
  }
  if (value.material_id && value.scrap_id) {
    return helpers.error('custom.bothMaterialAndScrap');
  }
  return value;
}).messages({
  'custom.eitherMaterialOrScrap': 'Either material_id or scrap_id must be provided',
  'custom.bothMaterialAndScrap': 'Cannot provide both material_id and scrap_id'
});

const updateProductionStepSchema = Joi.object({
  completed_qty: Joi.number().positive().allow(null),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED').allow(null),
  start_time: Joi.date().allow(null),
  end_time: Joi.date().allow(null),
  remarks: Joi.string().trim().allow(null)
});

const productionOrdersSchema = Joi.object({
  status: Joi.string().valid('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').allow(null),
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

const productionEfficiencySchema = Joi.object({
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
});

export const validateRecordMaterialUsage = (payload) => recordMaterialUsageSchema.validate(payload, { abortEarly: false });
export const validateUpdateProductionStep = (payload) => updateProductionStepSchema.validate(payload, { abortEarly: false });
export const validateProductionOrders = (payload) => productionOrdersSchema.validate(payload, { abortEarly: false });
export const validateProductionEfficiency = (payload) => productionEfficiencySchema.validate(payload, { abortEarly: false });
