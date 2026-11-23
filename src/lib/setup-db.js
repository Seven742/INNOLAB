// Database setup script
// Run: node src/lib/setup-db.js

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'innolab_inventory';

async function setup() {
  console.log('🌿 InnoLab Inventory - Database Setup\n');

  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${DB_NAME}\``);
    console.log(`✓ Database "${DB_NAME}" ready`);

    // Users table
    await connection.query(`
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
    console.log('✓ users table');

    // Categories table
    await connection.query(`
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
    console.log('✓ categories table');

    // Suppliers table
    await connection.query(`
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
    console.log('✓ suppliers table');

    // Inventory items table
    await connection.query(`
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
    console.log('✓ inventory_items table');

    // Stock in table
    await connection.query(`
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
    console.log('✓ stock_in table');

    // Stock out table
    await connection.query(`
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
    console.log('✓ stock_out table');

    // Borrows table
    await connection.query(`
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
    console.log('✓ borrows table');

    // SME products table
    await connection.query(`
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
        mfg_date DATE,
        expiry_date DATE,
        status ENUM('active', 'archived', 'returned', 'disposed', 'expired') NOT NULL DEFAULT 'active',
        description TEXT,
        notes TEXT,
        recorded_by INT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ sme_products table');

    // Activity log table
    await connection.query(`
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
    console.log('✓ activity_log table');

    // Settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        updated_by INT,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ settings table');

    // Seed default admin
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);

    await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role) 
      VALUES ('System Admin', 'admin@innolab.kh', ?, 'admin')
    `, [hash]);
    console.log('✓ Default admin user (admin@innolab.kh / admin123)');

    // Seed categories
    await connection.query(`
      INSERT IGNORE INTO categories (name, description, color) VALUES
      ('Office Supplies', 'Pens, paper, stationery, and other daily office supplies', '#367A43'),
      ('Electronics', 'Laptops, monitors, keyboards, and other electronic equipment', '#2563EB'),
      ('Furniture', 'Desks, chairs, shelves, and other office furniture', '#7C3AED'),
      ('Packaging Materials', 'Boxes, bags, labels, and packaging supplies', '#D99A28'),
      ('SME Samples', 'Product samples received from SMEs', '#059669'),
      ('Cleaning Supplies', 'Cleaning products and sanitation materials', '#EC4899'),
      ('Printing Materials', 'Ink, toner, and printing paper', '#F59E0B'),
      ('Kitchen Supplies', 'Utensils, coffee, and kitchen consumables', '#EF4444')
    `);
    console.log('✓ Default categories');

    // Seed settings
    await connection.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
      ('company_name', 'InnoLab Kampong Thom'),
      ('low_stock_threshold', '10'),
      ('currency', 'USD'),
      ('date_format', 'YYYY-MM-DD'),
      ('items_per_page', '20')
    `);
    console.log('✓ Default settings');

    console.log('\n✅ Database setup complete!');
    console.log('   Login: admin@innolab.kh / admin123\n');

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setup();

