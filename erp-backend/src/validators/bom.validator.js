// src/validators/bom.validator.js
import Joi from 'joi';

const addMaterialSchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  material_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  quantity: Joi.number().positive().required()
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().positive().required()
});

export const validateAddMaterial = (payload) => addMaterialSchema.validate(payload, { abortEarly: false });
export const validateUpdateQuantity = (payload) => updateQuantitySchema.validate(payload, { abortEarly: false });
