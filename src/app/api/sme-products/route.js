import { query, queryOne, insert, update, logActivity } from '@/lib/db';
import { success, created, error, badRequest, parsePagination, paginated } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const expiryStatus = searchParams.get('expiryStatus') || '';

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(sp.sme_name LIKE ? OR sp.product_name LIKE ? OR sp.category LIKE ? OR sp.sample_location LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      conditions.push('sp.status = ?');
      params.push(status);
    }

    if (expiryStatus === 'expired') {
      conditions.push('(sp.expiry_date < CURDATE() OR sp.status = "expired")');
    } else if (expiryStatus === 'expiring_soon') {
      conditions.push('(sp.expiry_date >= CURDATE() AND sp.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND sp.status != "expired")');
    } else if (expiryStatus === 'good') {
      conditions.push('(sp.expiry_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) OR sp.expiry_date IS NULL)');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await queryOne(`SELECT COUNT(*) as total FROM sme_products sp ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const sql = `
      SELECT sp.*, u.full_name as recorded_by_name,
        (SELECT COUNT(*) FROM sme_product_images spi WHERE spi.sme_product_id = sp.id) as additional_images_count
      FROM sme_products sp
      LEFT JOIN users u ON u.id = sp.recorded_by
      ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query(sql, [...params, limit, offset]);
    return success(paginated(records, total, page, limit));
  } catch (err) {
    return error('Failed to fetch SME products: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sme_name, product_name, category, quantity = 0, unit = 'pcs', received_date, sample_location, mfg_date, expiry_date, status = 'active', description, notes, image_url, image_public_id } = body;

    if (!sme_name || !sme_name.trim()) return badRequest('SME / Business name is required');
    if (!product_name || !product_name.trim()) return badRequest('Product name is required');

    let finalImageUrl = image_url;
    if ((!finalImageUrl || !finalImageUrl.trim()) && image_public_id && !image_public_id.startsWith('local:')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dd3lwxggh';
      finalImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${image_public_id}`;
    }

    const res = await insert('sme_products', {
      sme_name: sme_name.trim(),
      product_name: product_name.trim(),
      category: category || 'Food & Agriculture',
      quantity: parseInt(quantity) || 0,
      unit: unit || 'pcs',
      received_date: received_date || new Date().toISOString().split('T')[0],
      sample_location: sample_location || 'Showcase Shelf',
      mfg_date: mfg_date || null,
      expiry_date: expiry_date || null,
      status: status || 'active',
      description: description || null,
      notes: notes || null,
      image_url: finalImageUrl || null,
      image_public_id: image_public_id || null,
      recorded_by: 1,
    });

    await logActivity(1, 'created', 'sme_product', res.insertId, product_name.trim(), `Registered SME product from ${sme_name.trim()}`);

    return created({ id: res.insertId, sme_name, product_name, image_url: finalImageUrl, image_public_id });
  } catch (err) {
    return error('Failed to create SME product: ' + err.message);
  }
}
