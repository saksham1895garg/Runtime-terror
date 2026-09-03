import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const schemaPath = path.resolve(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const rlsPath = path.resolve(__dirname, '../supabase/migrations/002_rls_policies.sql');

    console.log('Running 001_initial_schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Successfully ran 001_initial_schema.sql');

    console.log('Running 002_rls_policies.sql...');
    const rlsSql = fs.readFileSync(rlsPath, 'utf8');
    await client.query(rlsSql);
    console.log('Successfully ran 002_rls_policies.sql');

    console.log('All migrations executed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
