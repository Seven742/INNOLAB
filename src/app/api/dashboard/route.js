import { query, queryOne } from '@/lib/db';
import { success, error } from '@/lib/api-helpers';

export async function GET() {
  try {
    // Total items
    const totalItems = await queryOne('SELECT COUNT(*) as count FROM inventory_items');
    
    // Total categories
    const totalCategories = await queryOne('SELECT COUNT(*) as count FROM categories');
    
    // Low stock items (quantity <= min_stock_level but > 0)
    const lowStock = await queryOne(
      'SELECT COUNT(*) as count FROM inventory_items WHERE quantity <= min_stock_level AND quantity > 0'
    );
    
    // Out of stock
    const outOfStock = await queryOne(
      'SELECT COUNT(*) as count FROM inventory_items WHERE quantity = 0'
    );
    
    // Borrowed equipment
    const borrowed = await queryOne(
      "SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed'"
    );
    
    // Overdue equipment
    const overdue = await queryOne(
      "SELECT COUNT(*) as count FROM borrows WHERE status = 'borrowed' AND expected_return_date < CURDATE()"
    );
    
    // Stock in this month
    const stockInMonth = await queryOne(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM stock_in WHERE MONTH(received_date) = MONTH(CURDATE()) AND YEAR(received_date) = YEAR(CURDATE())'
    );
    
    // Stock out this month
    const stockOutMonth = await queryOne(
      'SELECT COALESCE(SUM(quantity), 0) as total FROM stock_out WHERE MONTH(out_date) = MONTH(CURDATE()) AND YEAR(out_date) = YEAR(CURDATE())'
    );

    // SME Product Expiry tracking
    const expiredSme = await queryOne(
      'SELECT COUNT(*) as count FROM sme_products WHERE status = "expired" OR (expiry_date IS NOT NULL AND expiry_date < CURDATE())'
    );
    const expiringSoonSme = await queryOne(
      'SELECT COUNT(*) as count FROM sme_products WHERE expiry_date IS NOT NULL AND expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status != "expired"'
    );
    
    // Category breakdown
    const categoryBreakdownRows = await query(`
      SELECT c.name, c.color, COUNT(i.id) as item_count, COALESCE(SUM(i.quantity), 0) as total_quantity
      FROM categories c
      LEFT JOIN inventory_items i ON i.category_id = c.id
      GROUP BY c.id, c.name, c.color
      ORDER BY total_quantity DESC
    `);
    
    const categoryBreakdown = categoryBreakdownRows.map(row => ({
      name: row.name,
      color: row.color,
      item_count: Number(row.item_count),
      total_quantity: Number(row.total_quantity),
    }));

    // Stock movement (last 6 months)
    const stockMovementRows = await query(`
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
    
    const stockMovement = stockMovementRows.map(row => ({
      month_name: row.month_name,
      stock_in: Number(row.stock_in),
      stock_out: Number(row.stock_out),
    }));

    // Recent activities
    const recentActivities = await query(`
      SELECT a.*, u.full_name as user_name
      FROM activity_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 8
    `);
    
    // Low stock alerts
    const lowStockItemsRows = await query(`
      SELECT i.id, i.item_code, i.name, i.quantity, i.min_stock_level, i.unit, c.name as category_name
      FROM inventory_items i
      LEFT JOIN categories c ON c.id = i.category_id
      WHERE i.quantity <= i.min_stock_level
      ORDER BY (i.quantity * 1.0 / GREATEST(i.min_stock_level, 1)) ASC
      LIMIT 8
    `);
    
    const lowStockItems = lowStockItemsRows.map(row => ({
      id: row.id,
      item_code: row.item_code,
      name: row.name,
      quantity: Number(row.quantity),
      min_stock_level: Number(row.min_stock_level),
      unit: row.unit,
      category_name: row.category_name,
    }));

    // Recently added items
    const recentItemsRows = await query(`
      SELECT i.id, i.item_code, i.name, i.quantity, i.unit, i.status, i.created_at, i.image_url,
             c.name as category_name
      FROM inventory_items i
      LEFT JOIN categories c ON c.id = i.category_id
      ORDER BY i.created_at DESC
      LIMIT 6
    `);
    
    const recentItems = recentItemsRows.map(row => ({
      id: row.id,
      item_code: row.item_code,
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.unit,
      status: row.status,
      created_at: row.created_at,
      image_url: row.image_url,
      category_name: row.category_name,
    }));

    return success({
      stats: {
        totalItems: Number(totalItems?.count || 0),
        totalCategories: Number(totalCategories?.count || 0),
        lowStockItems: Number(lowStock?.count || 0),
        outOfStockItems: Number(outOfStock?.count || 0),
        borrowedEquipment: Number(borrowed?.count || 0),
        overdueEquipment: Number(overdue?.count || 0),
        stockInMonth: Number(stockInMonth?.total || 0),
        stockOutMonth: Number(stockOutMonth?.total || 0),
        expiredSme: Number(expiredSme?.count || 0),
        expiringSoonSme: Number(expiringSoonSme?.count || 0),
      },
      categoryBreakdown,
      stockMovement,
      recentActivities,
      lowStockItems,
      recentItems,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return error('Failed to fetch dashboard data: ' + err.message);
  }
}
