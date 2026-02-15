// src/validators/reports.validator.js
import Joi from 'joi';

const commonReportFilters = {
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
};

const wastageReportSchema = Joi.object({
  ...commonReportFilters,
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  wo_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
});

const scrapReportSchema = Joi.object({
  ...commonReportFilters,
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  status: Joi.string().valid('AVAILABLE', 'CONSUMED', 'SOLD', 'QUARANTINED').allow(null)
});

const inventoryReportSchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  low_stock_only: Joi.boolean().default(false)
});

const productionReportSchema = Joi.object({
  ...commonReportFilters,
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  status: Joi.string().valid('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').allow(null)
});

const costAnalysisReportSchema = Joi.object({
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
});

export const validateWastageReport = (payload) => wastageReportSchema.validate(payload, { abortEarly: false });
export const validateScrapReport = (payload) => scrapReportSchema.validate(payload, { abortEarly: false });
export const validateInventoryReport = (payload) => inventoryReportSchema.validate(payload, { abortEarly: false });
export const validateProductionReport = (payload) => productionReportSchema.validate(payload, { abortEarly: false });
export const validateCostAnalysisReport = (payload) => costAnalysisReportSchema.validate(payload, { abortEarly: false });
