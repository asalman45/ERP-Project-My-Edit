// src/validators/purchase_order.validator.js
import Joi from 'joi';

const createPOSchema = Joi.object({
  po_no: Joi.string().trim().min(1).required(),
  supplier_id: Joi.string().trim().min(1).required(), // Allow any string, not just UUID
  order_date: Joi.date().default(() => new Date()),
  expected_date: Joi.date().allow(null),
  status: Joi.string().valid('OPEN', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED').default('OPEN'),
  created_by: Joi.string().trim().allow(null)
});

const createPOItemSchema = Joi.object({
  po_id: Joi.string().guid({ version: 'uuidv4' }).required(),
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  quantity: Joi.number().positive().required(),
  unit_price: Joi.number().positive().allow(null)
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED').required()
});

export const validatePOCreate = (payload) => createPOSchema.validate(payload, { abortEarly: false });
export const validatePOItemCreate = (payload) => createPOItemSchema.validate(payload, { abortEarly: false });
export const validateStatusUpdate = (payload) => updateStatusSchema.validate(payload, { abortEarly: false });
