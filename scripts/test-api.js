const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.endsWith('\r')) val = val.slice(0, -1);
      process.env[match[1]] = val;
    }
  });
}

const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iis',
  });

  const [totalItems] = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
  const [totalCategories] = await pool.query('SELECT COUNT(*) as count FROM categories');
  const [lowStock] = await pool.query('SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= min_stock_level AND quantity > 0');
  const [borrowed] = await pool.query("SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed'");

  console.log('✓ Database queries succeeded:');
  console.log({
    totalItems: totalItems[0].count,
    totalCategories: totalCategories[0].count,
    lowStock: lowStock[0].count,
    borrowed: borrowed[0].count
  });

  await pool.end();
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

