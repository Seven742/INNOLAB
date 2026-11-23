import { deleteImage } from '@/lib/storage';
import { success, error, badRequest } from '@/lib/api-helpers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { publicId, url } = body;

    if (!publicId && !url) {
      return badRequest('publicId or url required');
    }

    const deleted = await deleteImage(publicId, url);
    return success({ success: true, deleted });
  } catch (err) {
    console.error('Delete image API error:', err);
    return error('Failed to delete image: ' + err.message);
  }
}

