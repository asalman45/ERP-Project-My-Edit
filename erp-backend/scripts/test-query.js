import * as productModel from '../src/models/product.model.js';
import db from '../src/utils/db.js';

async function test() {
  try {
    console.log('Testing findAll...');
    const result = await productModel.findAll({ limit: 1 });
    console.log('Success! Products:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed!', err);
  } finally {
    process.exit(0);
  }
}

test();
