// src/validators/inventory.validator.js
import Joi from 'joi';

const createInventorySchema = Joi.object({
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  quantity: Joi.number().positive().required(),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  batch_no: Joi.string().trim().allow(null),
  uom_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  status: Joi.string().valid('AVAILABLE', 'RESERVED', 'ISSUED', 'DAMAGED', 'QUARANTINE').default('AVAILABLE')
});

const createTxnSchema = Joi.object({
  inventory_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  material_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  wo_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  po_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  txn_type: Joi.string().valid('ISSUE', 'RECEIVE', 'TRANSFER', 'ADJUSTMENT', 'RETURN').required(),
  quantity: Joi.number().required(),
  location_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
  batch_no: Joi.string().trim().allow(null),
  reference: Joi.string().trim().allow(null),
  created_by: Joi.string().trim().allow(null)
});

export const validateInventoryCreate = (payload) => createInventorySchema.validate(payload, { abortEarly: false });
export const validateTxnCreate = (payload) => createTxnSchema.validate(payload, { abortEarly: false });
