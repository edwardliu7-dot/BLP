import { Pool } from 'pg';

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('NEON_DATABASE_URL (or DATABASE_URL) environment variable is required');
}

const isNeon = connectionString.includes('neon.tech');

export const pool = new Pool({
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
});
