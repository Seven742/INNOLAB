import { query, queryOne, update, insert, logActivity } from '@/lib/db';
import { success, error } from '@/lib/api-helpers';
import { isCloudinaryConfigured } from '@/lib/storage';

export async function GET() {
  try {
    const rows = await query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });

    // Add system information
    settings.db_status = 'Connected (MySQL 8.0)';
    settings.storage_provider = isCloudinaryConfigured() ? 'Cloudinary (Cloud Active)' : 'Local File Storage';
    settings.cloudinary_active = isCloudinaryConfigured();
    settings.app_name = 'InnoLab Office & SME Inventory Management System';
    settings.app_version = '1.0.0 (Production Ready)';
    settings.location = 'Kampong Thom, Cambodia';

    return success(settings);
  } catch (err) {
    return error('Failed to fetch settings: ' + err.message);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      if (['db_status', 'app_name', 'app_version', 'location'].includes(key)) continue;
      
      const existing = await queryOne('SELECT id FROM settings WHERE setting_key = ?', [key]);
      if (existing) {
        await update('settings', { setting_value: String(value) }, 'setting_key = ?', [key]);
      } else {
        await insert('settings', { setting_key: key, setting_value: String(value), updated_by: 1 });
      }
    }

    await logActivity(1, 'updated', 'settings', 1, 'System Settings', 'Updated system preferences');

    return success({ message: 'Settings saved successfully' });
  } catch (err) {
    return error('Failed to update settings: ' + err.message);
  }
}

