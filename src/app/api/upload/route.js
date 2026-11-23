import { uploadImage, isCloudinaryConfigured } from '@/lib/storage';
import { success, error, badRequest } from '@/lib/api-helpers';

export const runtime = 'nodejs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET() {
  const configured = isCloudinaryConfigured();
  return success({
    provider: configured ? 'cloudinary' : 'local',
    cloudinaryConfigured: configured,
    message: configured
      ? 'Cloudinary permanent cloud storage is active and ready'
      : 'Cloudinary credentials not set in .env.local; running on local disk storage fallback',
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'inventory';

    if (!file || typeof file === 'string') {
      return badRequest('No image file provided');
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest('Invalid file format. Allowed types: JPG, PNG, WebP');
    }

    if (file.size > MAX_SIZE) {
      return badRequest('File size exceeds the 5MB limit');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImage(buffer, file.name, folder);

    return success({
      success: true,
      url: result.url,
      publicId: result.publicId,
      provider: result.provider,
      filename: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error('Upload API error:', err);
    return error('Image upload failed: ' + err.message);
  }
}
