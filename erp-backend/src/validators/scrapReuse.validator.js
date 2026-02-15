// src/validators/scrapReuse.validator.js
import Joi from 'joi';

const reuseScrapSchema = Joi.object({
  scrap_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  quantity_to_reuse: Joi.number().positive().required(),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  reference: Joi.string().trim().allow(null)
});

const scrapReuseHistorySchema = Joi.object({
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0)
});

const scrapSavingsSchema = Joi.object({
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
});

export const validateReuseScrap = (payload) => reuseScrapSchema.validate(payload, { abortEarly: false });
export const validateScrapReuseHistory = (payload) => scrapReuseHistorySchema.validate(payload, { abortEarly: false });
export const validateScrapSavings = (payload) => scrapSavingsSchema.validate(payload, { abortEarly: false });
