import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Load environment variables directly from .env.local if not already in memory
 * This ensures credentials added while the server is running are immediately detected.
 */
function loadEnvIfMissing() {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return;
  }

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          const val = match[2].trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key] && val) {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (e) {
    console.warn('[Storage] Could not parse .env.local fallback:', e.message);
  }
}

/**
 * Check and configure Cloudinary dynamically
 * Supports both CLOUDINARY_URL and separate environment variables
 */
export function getCloudinaryClient() {
  loadEnvIfMissing();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

  if (cloudinaryUrl) {
    cloudinary.config({
      secure: true,
    });
    return cloudinary;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return cloudinary;
  }

  return null;
}

export function isCloudinaryConfigured() {
  loadEnvIfMissing();
  return Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET)
  );
}

/**
 * Upload an image buffer permanently
 * Uses Cloudinary if configured in .env.local, otherwise falls back to public/uploads/
 * @param {Buffer} buffer - image binary buffer
 * @param {string} originalName - filename
 * @param {string} folder - subfolder (e.g. 'inventory', 'sme', 'avatars')
 * @returns {Promise<{ url: string, publicId: string, provider: 'cloudinary' | 'local', format?: string, width?: number, height?: number }>}
 */
export async function uploadImage(buffer, originalName = 'image.jpg', folder = 'inventory') {
  const client = getCloudinaryClient();

  if (client) {
    return new Promise((resolve, reject) => {
      const uploadStream = client.uploader.upload_stream(
        {
          folder: `innolab/${folder}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('[Storage] Cloudinary upload error:', error);
            return reject(error);
          }
          console.log(`[Storage] ✓ Image stored permanently in Cloudinary: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            provider: 'cloudinary',
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Fallback: Local storage in public/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const fileName = `${cleanBase}_${timestamp}_${random}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  const relativeUrl = `/uploads/${folder}/${fileName}`;
  const publicId = `local:${folder}/${fileName}`;

  console.log(`[Storage] Stored image locally: ${relativeUrl}`);

  return {
    url: relativeUrl,
    publicId,
    provider: 'local',
  };
}

/**
 * Delete an image permanently from Cloudinary or local disk
 * @param {string} publicId
 * @param {string} url
 */
export async function deleteImage(publicId, url) {
  if (!publicId && !url) return false;

  const client = getCloudinaryClient();

  // Cloudinary deletion
  if (client && publicId && !publicId.startsWith('local:')) {
    try {
      await client.uploader.destroy(publicId);
      console.log(`[Storage] ✓ Deleted Cloudinary image: ${publicId}`);
      return true;
    } catch (err) {
      console.error('[Storage] Cloudinary deletion error:', err);
      return false;
    }
  }

  // Local file deletion
  let relativePath = url;
  if (publicId && publicId.startsWith('local:')) {
    relativePath = `/uploads/${publicId.replace('local:', '')}`;
  }

  if (relativePath && relativePath.startsWith('/uploads/')) {
    try {
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        console.log(`[Storage] Deleted local file: ${relativePath}`);
        return true;
      }
    } catch (err) {
      console.error('[Storage] Local file deletion error:', err);
      return false;
    }
  }

  return false;
}
