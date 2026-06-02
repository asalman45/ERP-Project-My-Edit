// src/models/supplier.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT * FROM supplier
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (supplierId) => {
  const res = await db.query(
    'SELECT * FROM supplier WHERE supplier_id = $1',
    [supplierId]
  );
  return res.rows[0];
};

export const findByCode = async (supplierCode) => {
  const res = await db.query(
    'SELECT * FROM supplier WHERE code = $1',
    [supplierCode]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    code, name, contact, phone, email, address, lead_time_days,
    ntn, strn,
    bank_name, bank_branch, bank_account, bank_iban, bank_account_title, bank_account_type
  } = payload;

  const cleanString = (val) => {
    if (val === undefined || val === null) return null;
    const trimmed = String(val).trim();
    return trimmed === '' ? null : trimmed;
  };

  const res = await db.query(
    `INSERT INTO supplier (
       supplier_id, code, name, contact, phone, email, address, lead_time_days,
       ntn, strn,
       bank_name, bank_branch, bank_account, bank_iban, bank_account_title, bank_account_type
     ) VALUES (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7,
       $8, $9,
       $10, $11, $12, $13, $14, $15
     ) RETURNING *`,
    [
      code,
      name,
      cleanString(contact),
      cleanString(phone),
      cleanString(email),
      cleanString(address),
      lead_time_days ?? null,
      cleanString(ntn),
      cleanString(strn),
      cleanString(bank_name),
      cleanString(bank_branch),
      cleanString(bank_account),
      cleanString(bank_iban),
      cleanString(bank_account_title),
      cleanString(bank_account_type)
    ]
  );
  return res.rows[0];
};

export const update = async (supplierId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(supplierId);

  const nullableFields = [
    'contact', 'phone', 'email', 'address', 'ntn', 'strn',
    'bank_name', 'bank_branch', 'bank_account', 'bank_iban',
    'bank_account_title', 'bank_account_type'
  ];

  const updatedPayload = { ...payload };
  for (const k of keys) {
    if (nullableFields.includes(k) && (updatedPayload[k] === '' || updatedPayload[k] === null || updatedPayload[k] === undefined)) {
      updatedPayload[k] = null;
    } else if (typeof updatedPayload[k] === 'string') {
      updatedPayload[k] = updatedPayload[k].trim();
    }
  }

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [supplierId, ...keys.map(k => updatedPayload[k])];

  const res = await db.query(
    `UPDATE supplier SET ${setParts} WHERE supplier_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (supplierId) => {
  await db.query('DELETE FROM supplier WHERE supplier_id = $1', [supplierId]);
  return true;
};
