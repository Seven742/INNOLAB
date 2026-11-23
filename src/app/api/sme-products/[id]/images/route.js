import { query, queryOne, insert, remove } from '@/lib/db';
import { success, created, error, notFound, badRequest } from '@/lib/api-helpers';
import { deleteImage } from '@/lib/storage';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const images = await query(
      'SELECT * FROM sme_product_images WHERE sme_product_id = ? ORDER BY is_primary DESC, created_at DESC',
      [id]
    );
    return success(images);
  } catch (err) {
    return error('Failed to fetch SME images: ' + err.message);
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { image_url, image_public_id, caption, is_primary } = body;

    if (!image_url) return badRequest('image_url is required');

    // If marked primary, unset other primaries
    if (is_primary) {
      const { update } = await import('@/lib/db');
      await update('sme_product_images', { is_primary: false }, 'sme_product_id = ?', [id]);
    }

    const res = await insert('sme_product_images', {
      sme_product_id: parseInt(id),
      image_url,
      image_public_id: image_public_id || null,
      caption: caption || null,
      is_primary: Boolean(is_primary),
    });

    return created({
      id: res.insertId,
      sme_product_id: parseInt(id),
      image_url,
      image_public_id,
      caption,
      is_primary: Boolean(is_primary),
    });
  } catch (err) {
    return error('Failed to save SME image: ' + err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) return badRequest('imageId query parameter is required');

    const image = await queryOne('SELECT * FROM sme_product_images WHERE id = ?', [imageId]);
    if (!image) return notFound('Image not found');

    // Delete from storage
    if (image.image_public_id || image.image_url) {
      await deleteImage(image.image_public_id, image.image_url);
    }

    await remove('sme_product_images', 'id = ?', [imageId]);
    return success({ message: 'Image deleted successfully' });
  } catch (err) {
    return error('Failed to delete image: ' + err.message);
  }
}

