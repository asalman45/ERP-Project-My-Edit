// src/validators/raw_material.validator.js
import Joi from 'joi';

const createSchema = Joi.object({
  material_code: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().allow('').optional(),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional()
});

const updateSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  description: Joi.string().trim().allow('').optional(),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null).optional()
});

export const validateRawMaterialCreate = (payload) => createSchema.validate(payload, { abortEarly: false });
export const validateRawMaterialUpdate = (payload) => updateSchema.validate(payload, { abortEarly: false });
