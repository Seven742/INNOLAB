import { query, queryOne, insert, update, remove, logActivity } from '@/lib/db';
import { success, created, error, badRequest, notFound } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('all') === 'true') {
      const sups = await query('SELECT id, name, contact_person, phone, email, is_active FROM suppliers ORDER BY name ASC');
      return success(sups);
    }

    const search = searchParams.get('search') || '';
    let sql = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM inventory_items i WHERE i.supplier_id = s.id) as item_count
      FROM suppliers s
    `;
    const params = [];
    if (search) {
      sql += ' WHERE s.name LIKE ? OR s.contact_person LIKE ? OR s.phone LIKE ? OR s.email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY s.name ASC';

    const suppliers = await query(sql, params);
    return success(suppliers);
  } catch (err) {
    return error('Failed to fetch suppliers: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, contact_person, email, phone, address, notes } = body;

    if (!name || !name.trim()) return badRequest('Supplier name is required');

    const res = await insert('suppliers', {
      name: name.trim(),
      contact_person: contact_person || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
      is_active: true,
    });

    await logActivity(1, 'created', 'supplier', res.insertId, name.trim(), 'Registered new supplier');

    return created({ id: res.insertId, name: name.trim() });
  } catch (err) {
    return error('Failed to create supplier: ' + err.message);
  }
}

