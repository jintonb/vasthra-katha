import { neon } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import path from 'path';

async function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = await fs.readFile(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const val = valueParts.join('=').trim();
        process.env[key.trim()] = val;
      }
    }
  } catch (err) {}
}

async function listBanners() {
  await loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!dbUrl) {
    console.error('Error: Please configure DATABASE_URL in your .env.local file first.');
    process.exit(1);
  }

  const sql = neon(dbUrl);
  try {
    const rows = await sql.query('SELECT id, title, type, is_active FROM banners');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error fetching banners:', err);
  }
}

listBanners();
