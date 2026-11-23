import { query, queryOne, update, remove, logActivity } from '@/lib/db';
import { success, error, notFound } from '@/lib/api-helpers';
import { deleteImage } from '@/lib/storage';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const item = await queryOne(`
      SELECT i.*, c.name as category_name, c.color as category_color, s.name as supplier_name, s.phone as supplier_phone
      FROM inventory_items i
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN suppliers s ON s.id = i.supplier_id
      WHERE i.id = ?
    `, [id]);

    if (!item) return notFound('Item not found');
    return success(item);
  } catch (err) {
    return error('Failed to fetch item: ' + err.message);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!existing) return notFound('Item not found');

    const qty = body.quantity !== undefined ? parseInt(body.quantity) : existing.quantity;
    const minQty = body.min_stock_level !== undefined ? parseInt(body.min_stock_level) : existing.min_stock_level;

    let status = body.status || existing.status;
    if (body.quantity !== undefined || body.min_stock_level !== undefined) {
      if (qty === 0) status = 'out_of_stock';
      else if (qty <= minQty) status = 'low_stock';
      else if (status !== 'discontinued') status = 'in_stock';
    }

    // If new image is uploaded and differs from existing, cleanup previous image safely
    if (body.image_url !== undefined && body.image_url !== existing.image_url && existing.image_url) {
      try {
        await deleteImage(existing.image_public_id, existing.image_url);
      } catch (e) {
        console.error('Cleanup old image error:', e);
      }
    }

    let finalImageUrl = body.image_url !== undefined ? body.image_url : existing.image_url;
    const finalPublicId = body.image_public_id !== undefined ? body.image_public_id : existing.image_public_id;
    if ((!finalImageUrl || !finalImageUrl.trim()) && finalPublicId && !finalPublicId.startsWith('local:')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dd3lwxggh';
      finalImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${finalPublicId}`;
    }

    const updatedData = {
      name: body.name !== undefined ? body.name.trim() : existing.name,
      category_id: body.category_id !== undefined ? (body.category_id ? parseInt(body.category_id) : null) : existing.category_id,
      description: body.description !== undefined ? body.description : existing.description,
      image_url: finalImageUrl,
      image_public_id: finalPublicId,
      quantity: qty,
      unit: body.unit !== undefined ? body.unit : existing.unit,
      min_stock_level: minQty,
      location: body.location !== undefined ? body.location : existing.location,
      purchase_price: body.purchase_price !== undefined ? (body.purchase_price ? parseFloat(body.purchase_price) : null) : existing.purchase_price,
      supplier_id: body.supplier_id !== undefined ? (body.supplier_id ? parseInt(body.supplier_id) : null) : existing.supplier_id,
      purchase_date: body.purchase_date !== undefined ? body.purchase_date : existing.purchase_date,
      status,
    };

    await update('inventory_items', updatedData, 'id = ?', [id]);

    if (existing.category_id) {
      await query(`UPDATE categories SET item_count = (SELECT COUNT(*) FROM inventory_items WHERE category_id = ?) WHERE id = ?`, [existing.category_id, existing.category_id]);
    }
    if (updatedData.category_id && updatedData.category_id !== existing.category_id) {
      await query(`UPDATE categories SET item_count = (SELECT COUNT(*) FROM inventory_items WHERE category_id = ?) WHERE id = ?`, [updatedData.category_id, updatedData.category_id]);
    }

    await logActivity(1, 'updated', 'inventory', id, updatedData.name, `Updated inventory details for ${existing.item_code}`);

    return success({ id, ...updatedData });
  } catch (err) {
    return error('Failed to update item: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await queryOne('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!existing) return notFound('Item not found');

    // Clean up image from storage
    if (existing.image_url || existing.image_public_id) {
      try {
        await deleteImage(existing.image_public_id, existing.image_url);
      } catch (e) {
        console.error('Delete image error:', e);
      }
    }

    await remove('inventory_items', 'id = ?', [id]);

    if (existing.category_id) {
      await query(`UPDATE categories SET item_count = (SELECT COUNT(*) FROM inventory_items WHERE category_id = ?) WHERE id = ?`, [existing.category_id, existing.category_id]);
    }

    await logActivity(1, 'deleted', 'inventory', id, existing.name, `Deleted item ${existing.item_code}`);

    return success({ message: 'Item deleted successfully' });
  } catch (err) {
    return error('Failed to delete item: ' + err.message);
  }
}
