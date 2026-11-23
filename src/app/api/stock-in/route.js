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
      conditions.push('(i.name LIKE ? OR i.item_code LIKE ? OR si.reference_no LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (startDate) {
      conditions.push('si.received_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('si.received_date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM stock_in si
      JOIN inventory_items i ON i.id = si.item_id
      ${whereClause}
    `;
    const countRes = await queryOne(countSql, params);
    const total = countRes ? countRes.total : 0;

    const sql = `
      SELECT si.*, i.name as item_name, i.item_code, i.unit,
             s.name as supplier_name, u.full_name as receiver_name
      FROM stock_in si
      JOIN inventory_items i ON i.id = si.item_id
      LEFT JOIN suppliers s ON s.id = si.supplier_id
      LEFT JOIN users u ON u.id = si.received_by
      ${whereClause}
      ORDER BY si.received_date DESC, si.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query(sql, [...params, limit, offset]);
    return success(paginated(records, total, page, limit));
  } catch (err) {
    return error('Failed to fetch stock in records: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item_id, quantity, received_date, supplier_id, reference_no, notes } = body;

    if (!item_id) return badRequest('Item is required');
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return badRequest('Quantity must be greater than 0');

    const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [item_id]);
    if (!item) return badRequest('Item does not exist');

    // 1. Record stock in
    const res = await insert('stock_in', {
      item_id: parseInt(item_id),
      quantity: qty,
      received_date: received_date || new Date().toISOString().split('T')[0],
      supplier_id: supplier_id ? parseInt(supplier_id) : item.supplier_id,
      received_by: 1, // Admin user
      reference_no: reference_no || null,
      notes: notes || null,
    });

    // 2. Update item stock quantity
    const newQty = item.quantity + qty;
    let newStatus = item.status;
    if (newQty > item.min_stock_level) {
      newStatus = 'in_stock';
    } else if (newQty > 0) {
      newStatus = 'low_stock';
    }

    await update('inventory_items', { quantity: newQty, status: newStatus }, 'id = ?', [item_id]);

    // 3. Log activity
    await logActivity(1, 'stock_in', 'stock', item_id, item.name, `Received +${qty} ${item.unit} (Ref: ${reference_no || 'N/A'})`);

    return created({
      id: res.insertId,
      item_id,
      quantity: qty,
      new_quantity: newQty,
      received_date,
    });
  } catch (err) {
    return error('Failed to process stock in: ' + err.message);
  }
}

