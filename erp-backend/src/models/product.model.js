// src/models/product.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT p.*, o.oem_name, u.code as uom_code, u.name as uom_name,
            ARRAY_AGG(DISTINCT pm.model_id::text) FILTER (WHERE pm.model_id IS NOT NULL) as model_ids,
            ARRAY_AGG(DISTINCT m.model_name) FILTER (WHERE m.model_name IS NOT NULL) as model_names
     FROM product p
     LEFT JOIN oem o ON p.oem_id = o.oem_id
     LEFT JOIN uom u ON p.uom_id = u.uom_id
     LEFT JOIN product_model pm ON p.product_id = pm.product_id
     LEFT JOIN model m ON pm.model_id = m.model_id
     GROUP BY p.product_id, o.oem_name, u.code, u.name
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (productId) => {
  const res = await db.query(
    `SELECT p.*, o.oem_name, u.code as uom_code, u.name as uom_name,
            ARRAY_AGG(DISTINCT pm.model_id::text) FILTER (WHERE pm.model_id IS NOT NULL) as model_ids,
            ARRAY_AGG(DISTINCT m.model_name) FILTER (WHERE m.model_name IS NOT NULL) as model_names
     FROM product p
     LEFT JOIN oem o ON p.oem_id = o.oem_id
     LEFT JOIN uom u ON p.uom_id = u.uom_id
     LEFT JOIN product_model pm ON p.product_id = pm.product_id
     LEFT JOIN model m ON pm.model_id = m.model_id
     WHERE p.product_id = $1
     GROUP BY p.product_id, o.oem_name, u.code, u.name`,
    [productId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const {
      product_code, part_name, oem_id, model_id, model_ids, uom_id, standard_cost, category, image_url, hs_code, empcl_no
    } = payload;
    
    // Determine the array of model ids
    let modelsToLink = [];
    if (model_ids && Array.isArray(model_ids)) modelsToLink = model_ids;
    else if (model_id) modelsToLink = [model_id];

    // Maintain backward compatibility for queries directly using model_id column
    const primaryModelId = modelsToLink.length > 0 ? modelsToLink[0] : null;

    const res = await client.query(
      `INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, standard_cost, category, image_url, hs_code, empcl_no)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [product_code, part_name, oem_id, primaryModelId, uom_id, standard_cost, category, image_url || null, hs_code || null, empcl_no || null]
    );

    const newProduct = res.rows[0];

    // Link multiple models
    for (const mId of modelsToLink) {
      await client.query(
        `INSERT INTO product_model (product_id, model_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [newProduct.product_id, mId]
      );
    }

    await client.query('COMMIT');
    return newProduct;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const update = async (productId, payload) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { model_ids, ...productPayload } = payload;
    let res = { rows: [await findById(productId)] }; // default if no basic product fields updated
    
    const keys = Object.keys(productPayload).filter(k => k !== 'model_id' || productPayload[k] !== undefined);
    
    if (keys.length > 0) {
      // If model_ids array provided, ensure primary model_id matches the first item
      if (model_ids && Array.isArray(model_ids) && model_ids.length > 0) {
        productPayload.model_id = model_ids[0];
        if(!keys.includes('model_id')) keys.push('model_id');
      }

      const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
      const values = [productId, ...keys.map(k => productPayload[k])];

      res = await client.query(
        `UPDATE product SET ${setParts} WHERE product_id = $1 RETURNING *`,
        values
      );
    }

    // Update product_model junction
    if (model_ids && Array.isArray(model_ids)) {
      await client.query(`DELETE FROM product_model WHERE product_id = $1`, [productId]);
      for (const mId of model_ids) {
        await client.query(
          `INSERT INTO product_model (product_id, model_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [productId, mId]
        );
      }
    }

    await client.query('COMMIT');
    return await findById(productId); // Return full product with models aggregated
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const remove = async (productId) => {
  await db.query('DELETE FROM product WHERE product_id = $1', [productId]);
  return true;
};
