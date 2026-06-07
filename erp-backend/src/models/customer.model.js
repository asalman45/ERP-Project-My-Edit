// src/models/customer.model.js
import db from '../utils/db.js';

const cleanString = (val) => {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
};

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0, search = '' } = opts;
  const searchParam = search ? `%${search}%` : null;

  if (searchParam) {
    const res = await db.query(
      `SELECT * FROM customer
       WHERE (name ILIKE $3 OR company_name ILIKE $3 OR customer_code ILIKE $3
           OR email ILIKE $3 OR city ILIKE $3 OR ntn ILIKE $3 OR strn ILIKE $3)
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, searchParam]
    );
    return res.rows;
  }

  const res = await db.query(
    `SELECT * FROM customer ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (customerId) => {
  const res = await db.query(
    'SELECT * FROM customer WHERE customer_id = $1',
    [customerId]
  );
  return res.rows[0];
};

export const findByCode = async (customerCode) => {
  const res = await db.query(
    'SELECT * FROM customer WHERE customer_code = $1 OR code = $1',
    [customerCode]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    customer_code, name, company_name, contact_person, address,
    billing_address, shipping_address, city, state, postal_code,
    country, phone, mobile, email, tax_id, ntn, strn,
    payment_terms, credit_limit
  } = payload;

  const res = await db.query(
    `INSERT INTO customer (
       customer_id, customer_code, code, name, company_name, contact_person,
       address, billing_address, shipping_address, city, state, postal_code,
       country, phone, mobile, email, tax_id, ntn, strn, payment_terms, credit_limit
     ) VALUES (
       gen_random_uuid(), $1, $1, $2, $3, $4,
       $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15, $16, $17, $18, $19
     ) RETURNING *`,
    [
      cleanString(customer_code),
      cleanString(name),
      cleanString(company_name),
      cleanString(contact_person),
      cleanString(address),
      cleanString(billing_address),
      cleanString(shipping_address),
      cleanString(city),
      cleanString(state),
      cleanString(postal_code),
      cleanString(country) || 'Pakistan',
      cleanString(phone),
      cleanString(mobile),
      cleanString(email),
      cleanString(tax_id),
      cleanString(ntn),
      cleanString(strn),
      cleanString(payment_terms) || 'NET 30',
      credit_limit ? parseFloat(credit_limit) : null
    ]
  );
  return res.rows[0];
};

export const update = async (customerId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(customerId);

  const nullableFields = [
    'company_name', 'contact_person', 'address', 'billing_address',
    'shipping_address', 'city', 'state', 'postal_code', 'phone',
    'mobile', 'email', 'tax_id', 'ntn', 'strn'
  ];

  const setClauses = [];
  const values = [];

  keys.forEach((key, i) => {
    let val = payload[key];
    if (nullableFields.includes(key) && (val === '' || val === undefined)) {
      val = null;
    }
    setClauses.push(`${key} = $${i + 1}`);
    values.push(val);
  });

  values.push(customerId);
  const res = await db.query(
    `UPDATE customer SET ${setClauses.join(', ')} WHERE customer_id = $${values.length} RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (customerId) => {
  await db.query('DELETE FROM customer WHERE customer_id = $1', [customerId]);
};
