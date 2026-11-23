// scripts/setup-db.js
// Initialize database schema and realistic InnoLab sample data

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.endsWith('\r')) val = val.slice(0, -1);
      env[match[1]] = val;
    }
  });
}

const config = {
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '3306'),
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
};

const dbName = env.DB_NAME || 'iis';

async function init() {
  console.log(`🌿 Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);
  const conn = await mysql.createConnection(config);

  try {
    console.log(`📁 Ensuring database \`${dbName}\` exists...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);

    console.log('📦 Creating database tables...');

    // 1. Users
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
        avatar_url VARCHAR(500),
        phone VARCHAR(20),
        department VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Categories
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        parent_id INT,
        color VARCHAR(7) DEFAULT '#367A43',
        item_count INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 3. Suppliers
    await conn.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(150),
        phone VARCHAR(30),
        address TEXT,
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 4. Inventory items
    await conn.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        category_id INT,
        description TEXT,
        image_url VARCHAR(500),
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
        min_stock_level INT NOT NULL DEFAULT 0,
        location VARCHAR(150),
        purchase_price DECIMAL(12,2),
        supplier_id INT,
        purchase_date DATE,
        status ENUM('in_stock', 'low_stock', 'out_of_stock', 'discontinued') NOT NULL DEFAULT 'in_stock',
        created_by INT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_item_code (item_code),
        INDEX idx_category (category_id),
        INDEX idx_status (status)
      )
    `);

    // 5. Stock In
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stock_in (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        received_date DATE NOT NULL,
        supplier_id INT,
        received_by INT,
        reference_no VARCHAR(50),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_item (item_id),
        INDEX idx_date (received_date)
      )
    `);

    // 6. Stock Out
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stock_out (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        reason VARCHAR(200),
        department VARCHAR(100),
        recipient VARCHAR(150),
        out_date DATE NOT NULL,
        recorded_by INT,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_item (item_id),
        INDEX idx_date (out_date)
      )
    `);

    // 7. Borrows
    await conn.query(`
      CREATE TABLE IF NOT EXISTS borrows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        borrower_name VARCHAR(150) NOT NULL,
        borrower_department VARCHAR(100),
        borrower_contact VARCHAR(50),
        borrow_date DATE NOT NULL,
        expected_return_date DATE NOT NULL,
        actual_return_date DATE,
        status ENUM('borrowed', 'returned', 'overdue') NOT NULL DEFAULT 'borrowed',
        condition_on_return VARCHAR(200),
        notes TEXT,
        recorded_by INT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_borrow_date (borrow_date)
      )
    `);

    // 8. SME Products
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sme_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sme_name VARCHAR(200) NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100),
        quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(30) DEFAULT 'pcs',
        received_date DATE,
        sample_location VARCHAR(150),
        status ENUM('active', 'archived', 'returned', 'disposed') NOT NULL DEFAULT 'active',
        description TEXT,
        notes TEXT,
        recorded_by INT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 9. Activity Log
    await conn.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT,
        entity_name VARCHAR(200),
        details TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created (created_at)
      )
    `);

    // 10. Settings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        updated_by INT,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('✓ All 10 tables created or verified.');

    // Seed Data
    console.log('🌱 Seeding realistic InnoLab Kampong Thom sample data...');

    // Users
    const passwordHash = await bcrypt.hash('admin123', 10);
    await conn.query(`
      INSERT INTO users (id, full_name, email, password_hash, role, department, phone) VALUES
      (1, 'System Admin', 'admin@innolab.kh', ?, 'admin', 'Management', '+855 12 345 678'),
      (2, 'Chea Sothea', 'manager@innolab.kh', ?, 'manager', 'Operations', '+855 15 234 567'),
      (3, 'Chan Vanna', 'staff@innolab.kh', ?, 'staff', 'Inventory', '+855 88 987 654')
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash)
    `, [passwordHash, passwordHash, passwordHash]);

    // Categories
    const categories = [
      [1, 'Office Supplies', 'Pens, paper, notebooks, stationery and desk supplies', '#367A43'],
      [2, 'IT & Electronics', 'Laptops, monitors, webcams, accessories and networking devices', '#2563EB'],
      [3, 'Office Furniture', 'Ergonomic chairs, desks, file cabinets and shelving', '#7C3AED'],
      [4, 'Packaging & Labelling', 'Boxes, pouches, barcode labels, and eco-packaging materials', '#D99A28'],
      [5, 'SME Samples & Food Tech', 'SME product prototypes, agri-food samples, and display items', '#059669'],
      [6, 'Audio/Visual Equipment', 'Projectors, 4K cameras, tripods, wireless microphones', '#8B5CF6'],
      [7, 'Cleaning & Sanitation', 'Disinfectants, hand wash, paper towels, and maintenance gear', '#EC4899'],
      [8, 'Printing Consumables', 'EcoTank inks, toner cartridges, thermal label rolls', '#F59E0B']
    ];

    for (const cat of categories) {
      await conn.query(`
        INSERT INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), color = VALUES(color)
      `, cat);
    }

    // Suppliers
    const suppliers = [
      [1, 'Kampong Thom Stationery Mart', 'Keo Piseth', 'sales@ktstationery.kh', '+855 62 988 123', 'National Road 6, Kampong Thom', 'Primary stationery partner'],
      [2, 'Phnom Penh Tech Solutions Co.', 'Seng Bunthoeun', 'contact@pptech.kh', '+855 23 888 999', 'Russian Blvd, Phnom Penh', 'Authorized IT equipment vendor'],
      [3, 'Angkor Eco Packaging Ltd.', 'Nath Sokha', 'info@angkoreco.com', '+855 63 765 432', 'Siem Reap Ring Road', 'Biodegradable packaging supplier'],
      [4, 'Khmer Agro Innovation Hub', 'Dr. Meng Channa', 'hub@khmeragro.org', '+855 12 776 543', 'Stung Sen, Kampong Thom', 'SME incubator partner & sample distributor']
    ];

    for (const sup of suppliers) {
      await conn.query(`
        INSERT INTO suppliers (id, name, contact_person, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), contact_person = VALUES(contact_person)
      `, sup);
    }

    // Inventory Items
    const items = [
      [1, 'INV-1001', 'A4 Double A Copy Paper 80gsm', 1, 'Premium copy paper for office printing & documentation', 45, 'reams', 10, 'Cabinet A-1, Storage Rm', 4.50, 1, '2026-10-15', 'in_stock', 1],
      [2, 'INV-1002', 'Epson EcoTank 003 Black Ink', 8, 'Original Epson black refill ink for L3110 / L3210', 4, 'bottles', 8, 'Supply Shelf B-2', 9.50, 2, '2026-09-20', 'low_stock', 1],
      [3, 'INV-1003', 'Dell Latitude 5430 Laptop i7 16GB', 2, 'Staff & training laptop with Windows 11 Pro', 6, 'units', 2, 'IT Secure Cabinet', 850.00, 2, '2026-08-10', 'in_stock', 1],
      [4, 'INV-1004', 'Logitech C920 Pro HD Webcam', 6, 'Full HD 1080p webcam for hybrid workshops & video calls', 5, 'units', 2, 'Media Closet M-1', 75.00, 2, '2026-08-15', 'in_stock', 1],
      [5, 'INV-1005', 'Epson EB-E01 XGA 3LCD Projector', 6, '3300 Lumens classroom projector for SME pitch sessions', 3, 'units', 1, 'Meeting Hall Tech Room', 380.00, 2, '2026-07-01', 'in_stock', 1],
      [6, 'INV-1006', 'Kraft Paper Stand-up Pouches 250g', 4, 'Eco-friendly food packaging sample pouches for local SMEs', 520, 'pcs', 100, 'Packaging Bay P-3', 0.25, 3, '2026-11-01', 'in_stock', 1],
      [7, 'INV-1007', 'Biodegradable PLA Containers 500ml', 4, 'Compostable clear food grade containers for demo testing', 180, 'pcs', 50, 'Packaging Bay P-2', 0.35, 3, '2026-11-05', 'in_stock', 1],
      [8, 'INV-1008', 'Pilot G2 Retractable Gel Pens 0.7mm', 1, 'Smooth writing black/blue pens for workshops (Pack of 12)', 18, 'boxes', 5, 'Supply Shelf A-3', 12.00, 1, '2026-10-10', 'in_stock', 1],
      [9, 'INV-1009', 'Ergonomic High-Back Task Chair', 3, 'Breathable mesh back with adjustable lumbar support', 12, 'pcs', 3, 'Co-working Hall', 120.00, 1, '2026-06-15', 'in_stock', 1],
      [10, 'INV-1010', 'Sony Alpha A6400 4K Mirrorless Camera', 6, '4K camera with 16-50mm lens for SME product photography', 2, 'units', 1, 'Media Closet M-1', 920.00, 2, '2026-09-01', 'in_stock', 1],
      [11, 'INV-1011', 'Wireless 2D Barcode Scanner Handheld', 2, 'Bluetooth QR/Barcode scanner for warehouse & POS training', 6, 'units', 2, 'IT Secure Cabinet', 45.00, 2, '2026-09-12', 'in_stock', 1],
      [12, 'INV-1012', 'Whiteboard Marker Set 4-Color', 1, 'Dry-erase whiteboard markers with eraser', 0, 'sets', 6, 'Supply Shelf A-2', 4.00, 1, '2026-08-20', 'out_of_stock', 1]
    ];

    for (const item of items) {
      await conn.query(`
        INSERT INTO inventory_items (id, item_code, name, category_id, description, quantity, unit, min_stock_level, location, purchase_price, supplier_id, purchase_date, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), quantity = VALUES(quantity), status = VALUES(status)
      `, item);
    }

    // Update category item counts
    await conn.query(`
      UPDATE categories c
      SET item_count = (SELECT COUNT(*) FROM inventory_items i WHERE i.category_id = c.id)
    `);

    // Stock In records (across past months)
    const stockInEntries = [
      [1, 1, 50, '2026-06-15', 1, 1, 'PO-2026-001', 'Initial bulk stock of copy paper'],
      [2, 3, 6, '2026-08-10', 2, 1, 'PO-2026-024', 'New Dell laptops for InnoLab staff'],
      [3, 6, 600, '2026-09-05', 3, 2, 'PO-2026-041', 'Eco pouches for SME packaging workshop'],
      [4, 2, 15, '2026-09-20', 2, 2, 'PO-2026-055', 'Epson printer ink bottles'],
      [5, 1, 30, '2026-10-15', 1, 1, 'PO-2026-070', 'Monthly paper restocking'],
      [6, 7, 200, '2026-11-05', 3, 3, 'PO-2026-088', 'Biodegradable PLA containers delivery'],
      [7, 8, 20, '2026-11-10', 1, 3, 'PO-2026-092', 'Pilot pens for training rooms']
    ];

    for (const si of stockInEntries) {
      await conn.query(`
        INSERT INTO stock_in (id, item_id, quantity, received_date, supplier_id, received_by, reference_no, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
      `, si);
    }

    // Stock Out records
    const stockOutEntries = [
      [1, 1, 5, 'Internal Training', 'Operations', 'Vanna', '2026-10-18', 1, 'Paper for entrepreneurship workshop'],
      [2, 6, 80, 'SME Trial Batch', 'Agri-Business SME', 'Mr. Sophat', '2026-11-02', 2, 'Sample packaging provided for honey trial'],
      [3, 2, 11, 'Printer Replenishment', 'Office Hall', 'Sothea', '2026-11-08', 3, 'Inks distributed to office printers'],
      [4, 7, 20, 'Product Tasting', 'Food Lab', 'Dara', '2026-11-12', 3, 'PLA containers for mango chip testing'],
      [5, 12, 6, 'Training Session', 'Education Team', 'Sopheap', '2026-11-15', 3, 'All whiteboard markers depleted']
    ];

    for (const so of stockOutEntries) {
      await conn.query(`
        INSERT INTO stock_out (id, item_id, quantity, reason, department, recipient, out_date, recorded_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
      `, so);
    }

    // Borrows
    const borrows = [
      [1, 3, 'Sokunthea Pich', 'SME Business Incubation', '+855 12 445 667', '2026-11-14', '2026-11-25', null, 'borrowed', null, 'Field survey with local cashew farmers', 1],
      [2, 10, 'Heng Visal', 'Media & Outreach', '+855 17 654 321', '2026-11-05', '2026-11-12', null, 'overdue', null, 'SME documentary video shoot in Prasat Sambor', 2],
      [3, 5, 'Khlok Rithy', 'Training Dept', '+855 70 112 233', '2026-11-01', '2026-11-03', '2026-11-03', 'returned', 'Good condition, remote included', 'Workshop presentation', 1],
      [4, 4, 'Ly Chanthou', 'Marketing Team', '+855 92 887 766', '2026-10-25', '2026-10-28', '2026-10-28', 'returned', 'All cables present', 'Zoom meeting with partner NGO', 2]
    ];

    for (const b of borrows) {
      await conn.query(`
        INSERT INTO borrows (id, item_id, borrower_name, borrower_department, borrower_contact, borrow_date, expected_return_date, actual_return_date, status, condition_on_return, notes, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE borrower_name = VALUES(borrower_name), status = VALUES(status)
      `, b);
    }

    // SME Products
    const smeProducts = [
      [1, 'Chey Cashew Enterprise', 'Roasted Kampong Thom Cashews 250g', 'Food & Agriculture', 24, 'jars', '2026-11-01', 'SME Showcase Shelf 1', 'active', 'Premium grade A roasted cashews, export quality test batch', 'Received for shelf-life testing', 1],
      [2, 'Prasat Organic Honey Coop', 'Raw Forest Wild Honey 500ml', 'Food & Agriculture', 16, 'bottles', '2026-10-20', 'SME Showcase Shelf 2', 'active', 'Harvested from Sambor Prei Kuk organic buffer zone', 'Packaging redesign candidate', 2],
      [3, 'Lotus Craft Cambodia', 'Handwoven Lotus Fiber Silk Scarf', 'Handicraft & Textiles', 8, 'pcs', '2026-09-15', 'Display Cabinet 3', 'active', '100% natural organic lotus root fibers, hand-dyed', 'Exhibition sample', 1],
      [4, 'Thom Tropical Dehydrated Fruits', 'Chewy Dried Mango Slices 100g', 'Food & Agriculture', 35, 'pouches', '2026-11-08', 'Food Lab Storage', 'active', 'Zero sugar added, solar dehydrated Keo Romeat mango', 'Moisture and vacuum test underway', 3],
      [5, 'Stung Sen Pottery Group', 'Terracotta Water Carafe Set', 'Craft & Home', 5, 'sets', '2026-08-10', 'Display Cabinet 1', 'archived', 'Natural clay cooling carafe with two cups', 'Sample display cycle completed', 2]
    ];

    for (const sp of smeProducts) {
      await conn.query(`
        INSERT INTO sme_products (id, sme_name, product_name, category, quantity, unit, received_date, sample_location, status, description, notes, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE sme_name = VALUES(sme_name), product_name = VALUES(product_name)
      `, sp);
    }

    // Activity Log
    const activities = [
      [1, 1, 'created', 'inventory', 1, 'A4 Double A Copy Paper 80gsm', 'Added 45 reams to storage'],
      [2, 2, 'stock_in', 'stock', 6, 'Kraft Paper Stand-up Pouches 250g', 'Received 600 pcs from Angkor Eco Packaging'],
      [3, 3, 'stock_out', 'stock', 2, 'Epson EcoTank 003 Black Ink', 'Dispatched 11 bottles to office printers'],
      [4, 1, 'borrowed', 'equipment', 3, 'Dell Latitude 5430 Laptop', 'Borrowed by Sokunthea Pich for field survey'],
      [5, 2, 'borrowed', 'equipment', 10, 'Sony Alpha A6400 Camera', 'Borrowed by Heng Visal (Now Overdue)'],
      [6, 3, 'created', 'sme_product', 1, 'Roasted Kampong Thom Cashews 250g', 'New SME product sample registered']
    ];

    for (const act of activities) {
      await conn.query(`
        INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, entity_name, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE action = VALUES(action)
      `, act);
    }

    // Settings
    const settings = [
      ['company_name', 'InnoLab Kampong Thom'],
      ['company_location', 'Kampong Thom, Cambodia'],
      ['company_phone', '+855 62 988 888'],
      ['low_stock_threshold', '10'],
      ['currency', 'USD'],
      ['date_format', 'YYYY-MM-DD'],
      ['items_per_page', '20']
    ];

    for (const [k, v] of settings) {
      await conn.query(`
        INSERT INTO settings (setting_key, setting_value, updated_by)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [k, v]);
    }

    // Verification
    console.log('\n📊 Database Verification:');
    const [counts] = await conn.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM categories) as categories_count,
        (SELECT COUNT(*) FROM suppliers) as suppliers_count,
        (SELECT COUNT(*) FROM inventory_items) as items_count,
        (SELECT COUNT(*) FROM stock_in) as stock_in_count,
        (SELECT COUNT(*) FROM stock_out) as stock_out_count,
        (SELECT COUNT(*) FROM borrows) as borrows_count,
        (SELECT COUNT(*) FROM sme_products) as sme_count
    `);
    console.log(counts[0]);

    console.log('\n✅ Database initialization and seeding completed successfully!');
    console.log('   Users created:');
    console.log('   - admin@innolab.kh / admin123 (Administrator)');
    console.log('   - manager@innolab.kh / admin123 (Manager)');
    console.log('   - staff@innolab.kh / admin123 (Staff)');

  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

init();
