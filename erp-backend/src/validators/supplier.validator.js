// src/validators/supplier.validator.js
import Joi from 'joi';

const createSchema = Joi.object({
  code: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  contact: Joi.string().trim().allow(null, ''),
  phone: Joi.string().trim().allow(null, ''),
  email: Joi.string().email().allow(null, ''),
  address: Joi.string().trim().allow(null, ''),
  lead_time_days: Joi.number().integer().min(0).allow(null, ''),
  // Tax registration
  ntn: Joi.string().trim().allow(null, ''),
  strn: Joi.string().trim().allow(null, ''),
  // Bank details
  bank_name: Joi.string().trim().allow(null, ''),
  bank_branch: Joi.string().trim().allow(null, ''),
  bank_account: Joi.string().trim().allow(null, ''),
  bank_iban: Joi.string().trim().allow(null, ''),
  bank_account_title: Joi.string().trim().allow(null, ''),
  bank_account_type: Joi.string().trim().valid('Current', 'Saving', '').allow(null, ''),
});

export const validateSupplierCreate = (payload) =>
  createSchema.validate(payload, { abortEarly: false, stripUnknown: false });
