import { queryOne, update, remove, logActivity } from '@/lib/db';
import { success, error, notFound } from '@/lib/api-helpers';
import { deleteImage } from '@/lib/storage';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await queryOne('SELECT * FROM sme_products WHERE id = ?', [id]);
    if (!existing) return notFound('SME product record not found');

    // Clean up old image if replaced
    if (body.image_url !== undefined && body.image_url !== existing.image_url && existing.image_url) {
      try {
        await deleteImage(existing.image_public_id, existing.image_url);
      } catch (e) {
        console.error('SME old image cleanup error:', e);
      }
    }

    let finalImageUrl = body.image_url !== undefined ? body.image_url : existing.image_url;
    const finalPublicId = body.image_public_id !== undefined ? body.image_public_id : existing.image_public_id;
    if ((!finalImageUrl || !finalImageUrl.trim()) && finalPublicId && !finalPublicId.startsWith('local:')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dd3lwxggh';
      finalImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${finalPublicId}`;
    }

    const updated = {
      sme_name: body.sme_name !== undefined ? body.sme_name.trim() : existing.sme_name,
      product_name: body.product_name !== undefined ? body.product_name.trim() : existing.product_name,
      category: body.category !== undefined ? body.category : existing.category,
      quantity: body.quantity !== undefined ? parseInt(body.quantity) : existing.quantity,
      unit: body.unit !== undefined ? body.unit : existing.unit,
      received_date: body.received_date !== undefined ? body.received_date : existing.received_date,
      sample_location: body.sample_location !== undefined ? body.sample_location : existing.sample_location,
      mfg_date: body.mfg_date !== undefined ? (body.mfg_date || null) : existing.mfg_date,
      expiry_date: body.expiry_date !== undefined ? (body.expiry_date || null) : existing.expiry_date,
      status: body.status !== undefined ? body.status : existing.status,
      description: body.description !== undefined ? body.description : existing.description,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      image_url: finalImageUrl,
      image_public_id: finalPublicId,
    };

    await update('sme_products', updated, 'id = ?', [id]);
    await logActivity(1, 'updated', 'sme_product', id, updated.product_name, `Updated SME product sample details`);

    return success({ id, ...updated });
  } catch (err) {
    return error('Failed to update SME product: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await queryOne('SELECT * FROM sme_products WHERE id = ?', [id]);
    if (!existing) return notFound('SME product record not found');

    // Delete primary image from storage
    if (existing.image_url || existing.image_public_id) {
      try {
        await deleteImage(existing.image_public_id, existing.image_url);
      } catch (e) {
        console.error('Delete SME image error:', e);
      }
    }

    await remove('sme_products', 'id = ?', [id]);
    await logActivity(1, 'deleted', 'sme_product', id, existing.product_name, `Deleted SME product sample`);

    return success({ message: 'SME product removed' });
  } catch (err) {
    return error('Failed to delete SME product: ' + err.message);
  }
}
