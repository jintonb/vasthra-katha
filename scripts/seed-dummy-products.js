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
  } catch (err) {
    console.log('Notice: .env.local reading note:', err.message);
  }
}

const fabrics = ['Pure Kanchipuram Silk', 'Traditional Banarasi Brocade', 'Ethereal Organza Silk', 'Classic Organic Linen', 'Premium Chanderi Cotton'];
const colors = ['Crimson Red', 'Royal Blue', 'Emerald Green', 'Mustard Yellow', 'Deep Purple', 'Magenta Pink', 'Teal Blue', 'Peach Orange', 'Golden Zari'];
const occasions = ['Bridal Wear', 'Festive Celebration', 'Wedding Ceremony', 'Casual Elegance', 'Evening Atelier'];
const works = ['Hand-woven Gold Zari embroidery', 'Intricate floral buttis with silver zari border', 'Handcrafted thread embroidery with gold motifs', 'Kalamkari hand-painted prints with heritage weave', 'Minimalist copper zari border with delicate motifs'];

async function seedDummyProducts() {
  await loadEnvLocal();
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!dbUrl) {
    console.error('Error: Please configure DATABASE_URL in your .env.local file first.');
    process.exit(1);
  }

  console.log('Connecting to Neon database to insert 50 dummy sarees...');
  const sql = neon(dbUrl);

  try {
    // 1. Get current serial counter
    let lastSerial = 1008;
    const metaRows = await sql.query('SELECT value FROM metadata WHERE key = $1', ['last_product_serial']);
    if (metaRows.length > 0) {
      lastSerial = parseInt(metaRows[0].value, 10);
    } else {
      const prodRows = await sql.query('SELECT code FROM products');
      const serials = prodRows
        .map(r => {
          const match = String(r.code).match(/(?:VK|HOT)-(\d+)/i);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter(Boolean);
      if (serials.length > 0) {
        lastSerial = Math.max(...serials);
      }
    }

    console.log(`Last product code serial identified: ${lastSerial}`);

    // 2. Generate 50 dummy sarees
    console.log('Generating dummy sarees...');
    const dummySarees = [];
    for (let i = 1; i <= 50; i++) {
      const serial = lastSerial + i;
      const code = `HOT-${serial}`;
      const fabric = fabrics[Math.floor(Math.random() * fabrics.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const occasion = occasions[Math.floor(Math.random() * occasions.length)];
      const work = works[Math.floor(Math.random() * works.length)];
      
      // Determine category mapping based on fabric
      let category = 'silk-sarees';
      if (fabric.includes('Banarasi')) category = 'banarasi';
      else if (fabric.includes('Organza')) category = 'organza';
      else if (fabric.includes('Linen')) category = 'linen-classics';

      const price = 4500 + Math.floor(Math.random() * 25000);
      const name = `${color} ${fabric.split(' ').slice(1).join(' ')}`;

      // Dummy premium placeholder image URLs (using Unsplash creative commons URLs)
      const thumbnailId = 1500 + (serial % 30);
      const thumbnail = `https://images.unsplash.com/photo-${thumbnailId === 1500 ? '1610030469983-98e550d6193c' : '1583391733956-3750e0ff4e8b'}?w=500&q=80`;
      
      const images = [
        thumbnail,
        `https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&q=80`,
        `https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&q=80`
      ];

      dummySarees.push({
        code,
        name,
        category,
        price,
        fabric,
        color,
        work,
        border: 'Broad Contrast Zari Border',
        blouse_included: true,
        length: '5.5 meters + 0.8 meter blouse piece',
        weight: '650 grams',
        occasion,
        care: 'Dry clean only to maintain fabric sheen and gold embroidery.',
        description: `This exquisite ${color} saree is hand-woven using traditional weaving methods. Made of ${fabric}, it features ${work} and is ideal for ${occasion}. A true heritage heirloom draping masterpiece.`,
        thumbnail,
        images: JSON.stringify(images),
        videos: JSON.stringify([])
      });
    }

    // 3. Batch insert dummy sarees
    console.log(`Inserting ${dummySarees.length} sarees into database...`);
    for (const s of dummySarees) {
      await sql.query(`
        INSERT INTO products (
          code, name, category, price, fabric, color, work, border,
          blouse_included, length, weight, occasion, care, description,
          thumbnail, images, videos, is_published, is_featured, is_new_arrival
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        s.code,
        s.name,
        s.category,
        s.price,
        s.fabric,
        s.color,
        s.work,
        s.border,
        s.blouse_included,
        s.length,
        s.weight,
        s.occasion,
        s.care,
        s.description,
        s.thumbnail,
        s.images,
        s.videos,
        true, // is_published
        Math.random() > 0.7, // is_featured
        Math.random() > 0.5  // is_new_arrival
      ]);
    }

    // 4. Update product counter
    const finalSerial = lastSerial + dummySarees.length;
    await sql.query('INSERT INTO metadata (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [
      'last_product_serial',
      String(finalSerial)
    ]);

    console.log(`\n🎉 SUCCESS! Inserted 50 premium dummy sarees starting from HOT-${lastSerial + 1} to HOT-${finalSerial}.`);
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

seedDummyProducts();
