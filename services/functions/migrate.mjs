import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to apply PostgreSQL migrations.');
}

const migrationPath = join(dirname(fileURLToPath(import.meta.url)), 'migrations', '001_create_calculations.sql');
const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(await readFile(migrationPath, 'utf8'));
  console.log('Applied 001_create_calculations.sql');
} finally {
  await client.end();
}
