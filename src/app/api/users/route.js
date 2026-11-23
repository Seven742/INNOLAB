import { query, queryOne, insert, update, remove, logActivity } from '@/lib/db';
import { success, created, error, badRequest, notFound } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await query(`
      SELECT id, full_name, email, role, phone, department, is_active, last_login, created_at
      FROM users
      ORDER BY created_at ASC
    `);
    return success(users);
  } catch (err) {
    return error('Failed to fetch users: ' + err.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { full_name, email, password, role = 'staff', department, phone } = body;

    if (!full_name || !full_name.trim()) return badRequest('Full name is required');
    if (!email || !email.trim()) return badRequest('Email is required');
    if (!password || password.length < 6) return badRequest('Password must be at least 6 characters');

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing) return badRequest('Email already registered');

    const password_hash = await bcrypt.hash(password, 10);

    const res = await insert('users', {
      full_name: full_name.trim(),
      email: email.trim(),
      password_hash,
      role: role || 'staff',
      department: department || null,
      phone: phone || null,
      is_active: true,
    });

    await logActivity(1, 'created', 'user', res.insertId, full_name.trim(), `Created new user with role ${role}`);

    return created({
      id: res.insertId,
      full_name: full_name.trim(),
      email: email.trim(),
      role,
      department,
      phone,
      is_active: true,
    });
  } catch (err) {
    return error('Failed to create user: ' + err.message);
  }
}

