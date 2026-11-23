import { queryOne, update, remove, logActivity } from '@/lib/db';
import { success, error, notFound, badRequest } from '@/lib/api-helpers';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await queryOne('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) return notFound('Supplier not found');

    const updated = {
      name: body.name !== undefined ? body.name.trim() : existing.name,
      contact_person: body.contact_person !== undefined ? body.contact_person : existing.contact_person,
      email: body.email !== undefined ? body.email : existing.email,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      address: body.address !== undefined ? body.address : existing.address,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active,
    };

    await update('suppliers', updated, 'id = ?', [id]);
    await logActivity(1, 'updated', 'supplier', id, updated.name, 'Updated supplier information');

    return success({ id, ...updated });
  } catch (err) {
    return error('Failed to update supplier: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await queryOne('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) return notFound('Supplier not found');

    const itemCount = await queryOne('SELECT COUNT(*) as count FROM inventory_items WHERE supplier_id = ?', [id]);
    if (itemCount && itemCount.count > 0) {
      return badRequest(`Cannot delete supplier: ${itemCount.count} inventory items are linked to it.`);
    }

    await remove('suppliers', 'id = ?', [id]);
    await logActivity(1, 'deleted', 'supplier', id, existing.name, 'Deleted supplier');

    return success({ message: 'Supplier deleted successfully' });
  } catch (err) {
    return error('Failed to delete supplier: ' + err.message);
  }
}

