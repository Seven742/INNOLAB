import { query, queryOne, insert, update, logActivity } from '@/lib/db';
import { success, created, error, badRequest, parsePagination, paginated } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    if (searchParams.get('all') === 'true') {
      const items = await query(`
        SELECT id, item_code, name, quantity, unit, status, location, image_url, image_public_id
        FROM inventory_items
        ORDER BY name ASC
      `);
      return success(items);
    }

    const { page, limit, offset } = parsePagination(searchParams);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(i.name LIKE ? OR i.item_code LIKE ? OR i.location LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (categoryId) {
      conditions.push('i.category_id = ?');
      params.push(categoryId);
    }

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total 
      FROM inventory_items i
      ${whereClause}
    `;
    const countResult = await queryOne(countSql, params);
    const total = countResult ? countResult.total : 0;

    const validSortFields = ['name', 'item_code', 'quantity', 'created_at', 'status'];
    const safeSortBy = validSortFields.includes(sortBy) ? `i.${sortBy}` : 'i.created_at';

    const sql = `
      SELECT i.*, c.name as category_name, c.color as category_color, s.name as supplier_name
      FROM inventory_items i
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN suppliers s ON s.id = i.supplier_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const items = await query(sql, [...params, limit, offset]);

    return success(paginated(items, total, page, limit));
  } catch (err) {
    console.error('Inventory GET error:', err);
    return error('Failed to fetch inventory items: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category_id, quantity = 0, unit = 'pcs', min_stock_level = 0, location, purchase_price, supplier_id, purchase_date, description, image_url, image_public_id } = body;

    if (!name || !name.trim()) {
      return badRequest('Item name is required');
    }

    let item_code = body.item_code?.trim();
    if (!item_code) {
      const lastItem = await queryOne('SELECT id FROM inventory_items ORDER BY id DESC LIMIT 1');
      const nextNum = (lastItem ? lastItem.id : 0) + 1001;
      item_code = `INV-${nextNum}`;
    }

    let status = 'in_stock';
    const qty = parseInt(quantity) || 0;
    const minQty = parseInt(min_stock_level) || 0;
    if (qty === 0) {
      status = 'out_of_stock';
    } else if (qty <= minQty) {
      status = 'low_stock';
    }

    let finalImageUrl = image_url;
    if ((!finalImageUrl || !finalImageUrl.trim()) && image_public_id && !image_public_id.startsWith('local:')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dd3lwxggh';
      finalImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${image_public_id}`;
    }

    const newItem = {
      item_code,
      name: name.trim(),
      category_id: category_id ? parseInt(category_id) : null,
      description: description || null,
      image_url: finalImageUrl || null,
      image_public_id: image_public_id || null,
      quantity: qty,
      unit: unit || 'pcs',
      min_stock_level: minQty,
      location: location || null,
      purchase_price: purchase_price ? parseFloat(purchase_price) : null,
      supplier_id: supplier_id ? parseInt(supplier_id) : null,
      purchase_date: purchase_date || null,
      status,
      created_by: 1,
    };

    const res = await insert('inventory_items', newItem);

    if (newItem.category_id) {
      await query(`
        UPDATE categories SET item_count = (
          SELECT COUNT(*) FROM inventory_items WHERE category_id = ?
        ) WHERE id = ?
      `, [newItem.category_id, newItem.category_id]);
    }

    await logActivity(1, 'created', 'inventory', res.insertId, newItem.name, `Created item ${newItem.item_code} with quantity ${newItem.quantity}`);

    return created({ id: res.insertId, ...newItem });
  } catch (err) {
    console.error('Inventory POST error:', err);
    return error('Failed to create inventory item: ' + err.message);
  }
}
