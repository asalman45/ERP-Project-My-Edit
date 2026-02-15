// src/validators/material.validator.js
import Joi from 'joi';

const createSchema = Joi.object({
  material_code: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  category: Joi.string().valid('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD').default('RAW_MATERIAL'),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null)
});

export const validateMaterialCreate = (payload) => createSchema.validate(payload, { abortEarly: false });
