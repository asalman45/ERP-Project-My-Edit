// src/validators/wastage.validator.js
import Joi from 'joi';

const createWastageSchema = Joi.object({
  wo_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  step_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  quantity: Joi.number().positive().required(),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  reason: Joi.string().trim().allow(null)
});

const updateWastageSchema = Joi.object({
  quantity: Joi.number().positive().allow(null),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  reason: Joi.string().trim().allow(null)
});

const wastageSummarySchema = Joi.object({
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  wo_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
});

export const validateWastageCreate = (payload) => createWastageSchema.validate(payload, { abortEarly: false });
export const validateWastageUpdate = (payload) => updateWastageSchema.validate(payload, { abortEarly: false });
export const validateWastageSummary = (payload) => wastageSummarySchema.validate(payload, { abortEarly: false });
