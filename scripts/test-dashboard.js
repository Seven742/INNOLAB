const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.endsWith('\r')) val = val.slice(0, -1);
    process.env[match[1]] = val;
  }
});
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [totalItems] = await conn.query('SELECT COUNT(*) as count FROM inventory_items');
  const [cat] = await conn.query('SELECT COUNT(*) as count FROM categories');
  const [low] = await conn.query('SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= min_stock_level AND quantity > 0');
  const [outStock] = await conn.query('SELECT COUNT(*) as count FROM inventory_items WHERE quantity = 0');
  const [borrowed] = await conn.query("SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed'");
  const [overdue] = await conn.query("SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed' AND expected_return_date < CURDATE()");
  const [stockInMonth] = await conn.query('SELECT COALESCE(SUM(quantity), 0) as total FROM stock_in WHERE MONTH(received_date) = MONTH(CURDATE()) AND YEAR(received_date) = YEAR(CURDATE())');
  const [stockOutMonth] = await conn.query('SELECT COALESCE(SUM(quantity), 0) as total FROM stock_out WHERE MONTH(out_date) = MONTH(CURDATE()) AND YEAR(out_date) = YEAR(CURDATE())');

  const [categoryBreakdown] = await conn.query(`
    SELECT c.name, c.color, COUNT(i.id) as item_count, COALESCE(SUM(i.quantity), 0) as total_quantity
    FROM categories c
    LEFT JOIN inventory_items i ON i.category_id = c.id
    GROUP BY c.id, c.name, c.color
    ORDER BY total_quantity DESC
  `);

  const [stockMovement] = await conn.query(`
    SELECT 
      months.month_name,
      months.month_num,
      COALESCE(si.total_in, 0) as stock_in,
      COALESCE(so.total_out, 0) as stock_out
    FROM (
      SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%b') as month_name,
             DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m') as month_key,
             n as month_num
      FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) nums
    ) months
    LEFT JOIN (
      SELECT DATE_FORMAT(received_date, '%Y-%m') as month_key, SUM(quantity) as total_in
      FROM stock_in
      WHERE received_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month_key
    ) si ON si.month_key = months.month_key
    LEFT JOIN (
      SELECT DATE_FORMAT(out_date, '%Y-%m') as month_key, SUM(quantity) as total_out
      FROM stock_out
      WHERE out_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month_key
    ) so ON so.month_key = months.month_key
    ORDER BY months.month_num DESC
  `);

  console.log('✓ All dashboard queries executed successfully:');
  console.log('Stock movement (', stockMovement.length, 'months):', stockMovement);
  console.log('Category breakdown (', categoryBreakdown.length, 'cats)');
  console.log('Stats:', {
    totalItems: totalItems[0].count,
    categories: cat[0].count,
    lowStock: low[0].count,
    outStock: outStock[0].count,
    borrowed: borrowed[0].count,
    overdue: overdue[0].count,
    stockInMonth: stockInMonth[0].total,
    stockOutMonth: stockOutMonth[0].total,
  });

  await conn.end();
}

run().catch(e => {
  console.error('Error running test-dashboard:', e);
  process.exit(1);
});

