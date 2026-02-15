// src/validators/location.validator.js
import Joi from 'joi';

const createSchema = Joi.object({
  code: Joi.string().trim().min(1).required(),
  name: Joi.string().trim().min(1).required(),
  type: Joi.string().trim().allow(null)
});

export const validateLocationCreate = (payload) => createSchema.validate(payload, { abortEarly: false });
