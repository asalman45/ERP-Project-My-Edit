// src/validators/product.validator.js
import Joi from 'joi';

const createSchema = Joi.object({
  product_code: Joi.string().trim().min(1).required(),
  part_name: Joi.string().trim().min(1).required(),
  oem_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  model_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  standard_cost: Joi.number().precision(2).positive().allow(null),
  category: Joi.string().valid('RAW_MATERIAL','SEMI_FINISHED','FINISHED_GOOD').optional()
});

export const validateProductCreate = (payload) => createSchema.validate(payload, { abortEarly: false });
