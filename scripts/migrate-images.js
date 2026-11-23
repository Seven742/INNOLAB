// scripts/migrate-images.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.endsWith('\r')) val = val.slice(0, -1);
    env[match[1]] = val;
  }
});

async function migrate() {
  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT || '3306'),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'iis'
  });

  console.log('🔄 Running image schema migration...');

  // Helper to safely add column if not exists
  const addColumnIfNotExists = async (table, colDef) => {
    const colName = colDef.split(' ')[0];
    const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [colName]);
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colDef}`);
      console.log(`✓ Added column ${colName} to ${table}`);
    } else {
      console.log(`- Column ${colName} already exists in ${table}`);
    }
  };

  // 1. inventory_items
  await addColumnIfNotExists('inventory_items', 'image_public_id VARCHAR(255) NULL AFTER image_url');

  // 2. sme_products
  await addColumnIfNotExists('sme_products', 'image_public_id VARCHAR(255) NULL AFTER image_url');

  // 3. users
  await addColumnIfNotExists('users', 'image_public_id VARCHAR(255) NULL AFTER avatar_url');

  // 4. suppliers
  await addColumnIfNotExists('suppliers', 'image_url VARCHAR(500) NULL AFTER address');
  await addColumnIfNotExists('suppliers', 'image_public_id VARCHAR(255) NULL AFTER image_url');

  // 5. Create sme_product_images table for multi-image support
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sme_product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sme_product_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      image_public_id VARCHAR(255) NULL,
      caption VARCHAR(255) NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sme_product_id) REFERENCES sme_products(id) ON DELETE CASCADE,
      INDEX idx_sme_product (sme_product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ Verified table sme_product_images');

  console.log('✅ Image migration complete!');
  await conn.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});

