import { query, queryOne, update, remove, logActivity } from '@/lib/db';
import { success, error, notFound, badRequest } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cat = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!cat) return notFound('Category not found');
    return success(cat);
  } catch (err) {
    return error('Failed to fetch category: ' + err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    const existing = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) return notFound('Category not found');

    if (name && name.trim() !== existing.name) {
      const duplicate = await queryOne('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
      if (duplicate) return badRequest('Category name already in use');
    }

    const updated = {
      name: name !== undefined ? name.trim() : existing.name,
      description: description !== undefined ? description : existing.description,
      color: color !== undefined ? color : existing.color,
    };

    await update('categories', updated, 'id = ?', [id]);
    await logActivity(1, 'updated', 'category', id, updated.name, 'Updated category details');

    return success({ id, ...updated });
  } catch (err) {
    return error('Failed to update category: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) return notFound('Category not found');

    // Check if items reference this category
    const itemCount = await queryOne('SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?', [id]);
    if (itemCount && itemCount.count > 0) {
      return badRequest(`Cannot delete category: ${itemCount.count} items are assigned to it. Reassign or delete them first.`);
    }

    await remove('categories', 'id = ?', [id]);
    await logActivity(1, 'deleted', 'category', id, existing.name, 'Deleted category');

    return success({ message: 'Category deleted successfully' });
  } catch (err) {
    return error('Failed to delete category: ' + err.message);
  }
}

