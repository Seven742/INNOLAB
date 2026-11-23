import { queryOne, update, remove, logActivity } from '@/lib/db';
import { success, error, notFound, badRequest } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) return notFound('User not found');

    const updated = {
      full_name: body.full_name !== undefined ? body.full_name.trim() : existing.full_name,
      role: body.role !== undefined ? body.role : existing.role,
      department: body.department !== undefined ? body.department : existing.department,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active,
    };

    if (body.password && body.password.trim().length >= 6) {
      updated.password_hash = await bcrypt.hash(body.password.trim(), 10);
    }

    await update('users', updated, 'id = ?', [id]);
    await logActivity(1, 'updated', 'user', id, updated.full_name, `Updated user details`);

    delete updated.password_hash;
    return success({ id, ...updated });
  } catch (err) {
    return error('Failed to update user: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (parseInt(id) === 1) return badRequest('Cannot deactivate main administrator account');

    await update('users', { is_active: false }, 'id = ?', [id]);
    await logActivity(1, 'deactivated', 'user', id, `User #${id}`, `Deactivated user account`);

    return success({ message: 'User deactivated successfully' });
  } catch (err) {
    return error('Failed to deactivate user: ' + err.message);
  }
}

