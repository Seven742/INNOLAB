import { query, queryOne, insert, update, remove, logActivity } from '@/lib/db';
import { success, created, error, badRequest, parsePagination, paginated } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // First auto-update overdue status for any records past return date
    await query(`
      UPDATE borrows
      SET status = 'overdue'
      WHERE status = 'borrowed' AND expected_return_date < CURDATE()
    `);

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(i.name LIKE ? OR i.item_code LIKE ? OR b.borrower_name LIKE ? OR b.borrower_department LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total
      FROM borrows b
      JOIN inventory_items i ON i.id = b.item_id
      ${whereClause}
    `;
    const countRes = await queryOne(countSql, params);
    const total = countRes ? countRes.total : 0;

    const sql = `
      SELECT b.*, i.name as item_name, i.item_code, i.unit,
             u.full_name as recorded_by_name,
             DATEDIFF(CURDATE(), b.expected_return_date) as days_overdue
      FROM borrows b
      JOIN inventory_items i ON i.id = b.item_id
      LEFT JOIN users u ON u.id = b.recorded_by
      ${whereClause}
      ORDER BY 
        CASE WHEN b.status = 'overdue' THEN 1 WHEN b.status = 'borrowed' THEN 2 ELSE 3 END,
        b.borrow_date DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query(sql, [...params, limit, offset]);
    return success(paginated(records, total, page, limit));
  } catch (err) {
    return error('Failed to fetch borrow records: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item_id, borrower_name, borrower_department, borrower_contact, borrow_date, expected_return_date, notes } = body;

    if (!item_id) return badRequest('Equipment item is required');
    if (!borrower_name || !borrower_name.trim()) return badRequest('Borrower name is required');
    if (!expected_return_date) return badRequest('Expected return date is required');

    const item = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [item_id]);
    if (!item) return badRequest('Item not found');

    const res = await insert('borrows', {
      item_id: parseInt(item_id),
      borrower_name: borrower_name.trim(),
      borrower_department: borrower_department || null,
      borrower_contact: borrower_contact || null,
      borrow_date: borrow_date || new Date().toISOString().split('T')[0],
      expected_return_date,
      status: 'borrowed',
      recorded_by: 1,
      notes: notes || null,
    });

    await logActivity(1, 'borrowed', 'equipment', item_id, item.name, `Borrowed by ${borrower_name.trim()}`);

    return created({ id: res.insertId, item_id, borrower_name, status: 'borrowed' });
  } catch (err) {
    return error('Failed to create borrow record: ' + err.message);
  }
}

