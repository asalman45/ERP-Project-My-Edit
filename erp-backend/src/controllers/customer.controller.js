// src/controllers/customer.controller.js
import * as customerModel from '../models/customer.model.js';
import { logger } from '../utils/logger.js';

export const listCustomers = async (req, res) => {
  const { limit = 100, offset = 0, search = '' } = req.query;
  const rows = await customerModel.findAll({
    limit: Number(limit),
    offset: Number(offset),
    search
  });
  return res.json({ data: rows });
};

export const getCustomer = async (req, res) => {
  const customer = await customerModel.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  return res.json({ data: customer });
};

export const createCustomer = async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  try {
    const customer = await customerModel.create(req.body);
    logger.info({ customer_id: customer.customer_id }, 'customer created');
    return res.status(201).json({ data: customer });
  } catch (err) {
    if (err.code === '23505') {
      const constraint = err.constraint || err.message || '';
      if (constraint.includes('code') || constraint.includes('customer_code')) {
        return res.status(409).json({
          error: `Customer code '${req.body.customer_code}' already exists. Please use a different customer code.`
        });
      }
      if (constraint.includes('ntn')) {
        return res.status(409).json({
          error: `NTN '${req.body.ntn}' is already registered to another customer.`
        });
      }
      if (constraint.includes('strn')) {
        return res.status(409).json({
          error: `STRN/GST '${req.body.strn}' is already registered to another customer.`
        });
      }
      return res.status(409).json({ error: 'Duplicate value detected. Please check customer code, NTN, or STRN.' });
    }
    logger.error({ err }, 'Failed to create customer');
    return res.status(500).json({ error: `Failed to create customer: ${err.message}` });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await customerModel.update(req.params.id, req.body);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    return res.json({ data: customer });
  } catch (err) {
    if (err.code === '23505') {
      const constraint = err.constraint || err.message || '';
      if (constraint.includes('code') || constraint.includes('customer_code')) {
        return res.status(409).json({
          error: `Customer code '${req.body.customer_code}' already exists. Please use a different customer code.`
        });
      }
      if (constraint.includes('ntn')) {
        return res.status(409).json({
          error: `NTN '${req.body.ntn}' is already registered to another customer.`
        });
      }
      if (constraint.includes('strn')) {
        return res.status(409).json({
          error: `STRN/GST '${req.body.strn}' is already registered to another customer.`
        });
      }
    }
    logger.error({ err, customer_id: req.params.id }, 'Failed to update customer');
    return res.status(500).json({ error: `Failed to update customer: ${err.message}` });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    await customerModel.remove(req.params.id);
    return res.status(204).send();
  } catch (err) {
    logger.error({ err, customer_id: req.params.id }, 'Failed to delete customer');
    return res.status(500).json({ error: `Failed to delete customer: ${err.message}` });
  }
};
