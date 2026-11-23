import { query, queryOne, insert, update, remove, logActivity } from '@/lib/db';
import { success, created, error, badRequest, notFound } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM inventory_items i WHERE i.category_id = c.id) as item_count,
        (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory_items i WHERE i.category_id = c.id) as total_quantity
      FROM categories c
    `;
    const params = [];

    if (search) {
      sql += ' WHERE c.name LIKE ? OR c.description LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.name ASC';

    const categories = await query(sql, params);
    return success(categories);
  } catch (err) {
    return error('Failed to fetch categories: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, color = '#367A43' } = body;

    if (!name || !name.trim()) {
      return badRequest('Category name is required');
    }

    const existing = await queryOne('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing) {
      return badRequest('Category name already exists');
    }

    const res = await insert('categories', {
      name: name.trim(),
      description: description || null,
      color: color || '#367A43',
      item_count: 0
    });

    await logActivity(1, 'created', 'category', res.insertId, name.trim(), 'Created new category');

    return created({ id: res.insertId, name: name.trim(), description, color });
  } catch (err) {
    return error('Failed to create category: ' + err.message);
  }
}

