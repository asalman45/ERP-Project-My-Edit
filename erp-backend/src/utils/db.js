// src/utils/db.js
import pkg from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger.js';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
  user: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_pass123',
  database: process.env.DB_NAME || 'erp_db',
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected idle client error');
  process.exit(-1);
});

export default pool;
