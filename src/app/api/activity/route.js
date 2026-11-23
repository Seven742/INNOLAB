import { query, queryOne } from '@/lib/db';
import { success, error, parsePagination, paginated } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const entityType = searchParams.get('entityType') || '';
    const action = searchParams.get('action') || '';

    const conditions = [];
    const params = [];

    if (entityType) {
      conditions.push('a.entity_type = ?');
      params.push(entityType);
    }

    if (action) {
      conditions.push('a.action = ?');
      params.push(action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await queryOne(`SELECT COUNT(*) as total FROM activity_log a ${whereClause}`, params);
    const total = countRes ? countRes.total : 0;

    const sql = `
      SELECT a.*, u.full_name as user_name, u.role as user_role
      FROM activity_log a
      LEFT JOIN users u ON u.id = a.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const activities = await query(sql, [...params, limit, offset]);
    return success(paginated(activities, total, page, limit));
  } catch (err) {
    return error('Failed to fetch activity logs: ' + err.message);
  }
}

