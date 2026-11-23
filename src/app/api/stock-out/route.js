import { query, queryOne, insert, update, logActivity } from '@/lib/db';
import { success, created, error, badRequest, parsePagination, paginated } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(i.name LIKE ? OR i.item_code LIKE ? OR so.recipient LIKE ? OR so.department LIKE ? OR so.reason LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (startDate) {
      conditions.push('so.out_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('so.out_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM stock_out so
      JOIN inventory_items i ON i.id = so.item_id
      ${whereClause}
    `;
    const countRes = await queryOne(countSql, params);
    const total = countRes ? countRes.total : 0;

    const sql = `
      SELECT so.*, i.name as item_name, i.item_code, i.unit,
             u.full_name as recorder_name
      FROM stock_out so
      JOIN inventory_items i ON i.id = so.item_id
      LEFT JOIN users u ON u.id = so.recorded_by
      ${whereClause}
      ORDER BY so.out_date DESC, so.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query(sql, [...params, limit, offset]);
    return success(paginated(records, total, page, limit));
  } catch (err) {
    return error('Failed to fetch stock out records: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item_id, quantity, reason, department, recipient, out_date, notes } = body;

    if (!item_id) return badRequest('Item is required');
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return badRequest('Quantity must be greater than 0');

    const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [item_id]);
    if (!item) return badRequest('Item does not exist');

    // Prevent negative stock
    if (item.quantity < qty) {
      return badRequest(`Insufficient stock! Available: ${item.quantity} ${item.unit}, requested: ${qty} ${item.unit}`);
    }

    // 1. Record stock out
    const res = await insert('stock_out', {
      item_id: parseInt(item_id),
      quantity: qty,
      reason: reason || null,
      department: department || null,
      recipient: recipient || null,
      out_date: out_date || new Date().toISOString().split('T')[0],
      recorded_by: 1, // Admin user
      notes: notes || null,
    });

    // 2. Update item stock quantity
    const newQty = item.quantity - qty;
    let newStatus = item.status;
    if (newQty === 0) {
      newStatus = 'out_of_stock';
    } else if (newQty <= item.min_stock_level) {
      newStatus = 'low_stock';
    }

    await update('inventory_items', { quantity: newQty, status: newStatus }, 'id = ?', [item_id]);

    // 3. Log activity
    await logActivity(1, 'stock_out', 'stock', item_id, item.name, `Dispatched -${qty} ${item.unit} to ${recipient || department || 'Staff'}`);

    return created({
      id: res.insertId,
      item_id,
      quantity: qty,
      new_quantity: newQty,
      out_date,
    });
  } catch (err) {
    return error('Failed to process stock out: ' + err.message);
  }
}

