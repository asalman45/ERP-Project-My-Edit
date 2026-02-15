// src/validators/scrap.validator.js
import Joi from 'joi';

const createScrapSchema = Joi.object({
  blank_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  width_mm: Joi.number().positive().allow(null),
  length_mm: Joi.number().positive().allow(null),
  thickness_mm: Joi.number().positive().allow(null),
  weight_kg: Joi.number().positive().required(),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  status: Joi.string().valid('AVAILABLE', 'CONSUMED', 'SOLD', 'QUARANTINED').default('AVAILABLE'),
  reference: Joi.string().trim().allow(null),
  consumed_by_po: Joi.string().trim().allow(null)
});

const createScrapTransactionSchema = Joi.object({
  scrap_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  txn_type: Joi.string().valid('GENERATED', 'REUSED', 'ADJUSTED', 'CONSUMED', 'SOLD').required(),
  qty_used: Joi.number().positive().allow(null),
  weight_kg: Joi.number().positive().allow(null),
  reference: Joi.string().trim().allow(null),
  created_by: Joi.string().trim().allow(null)
});

const updateScrapStatusSchema = Joi.object({
  status: Joi.string().valid('AVAILABLE', 'CONSUMED', 'SOLD', 'QUARANTINED').required()
});

export const validateScrapCreate = (payload) => createScrapSchema.validate(payload, { abortEarly: false });
export const validateScrapTransactionCreate = (payload) => createScrapTransactionSchema.validate(payload, { abortEarly: false });
export const validateScrapStatusUpdate = (payload) => updateScrapStatusSchema.validate(payload, { abortEarly: false });
