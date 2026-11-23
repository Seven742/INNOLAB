-- InnoLab Inventory Management System
-- Database Schema for MySQL

CREATE DATABASE IF NOT EXISTS innolab_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE innolab_inventory;

-- =====================================================
-- Users & Authentication
-- =====================================================
CREATE TABLE users (
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
);

-- =====================================================
-- Categories
-- =====================================================
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id INT,
  color VARCHAR(7) DEFAULT '#367A43',
  item_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- =====================================================
-- Suppliers
-- =====================================================
CREATE TABLE suppliers (
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
);

-- =====================================================
-- Inventory Items
-- =====================================================
CREATE TABLE inventory_items (
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
);

-- =====================================================
-- Stock In
-- =====================================================
CREATE TABLE stock_in (
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
);

-- =====================================================
-- Stock Out
-- =====================================================
CREATE TABLE stock_out (
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
);

-- =====================================================
-- Borrow & Return
-- =====================================================
CREATE TABLE borrows (
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
);

-- =====================================================
-- SME Products & Samples
-- =====================================================
CREATE TABLE sme_products (
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
);

-- =====================================================
-- Activity Log
-- =====================================================
CREATE TABLE activity_log (
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
);

-- =====================================================
-- Settings
-- =====================================================
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_by INT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- Seed Data
-- =====================================================

-- Default admin user (password: admin123)
INSERT INTO users (full_name, email, password_hash, role) VALUES
('System Admin', 'admin@innolab.kh', '$2b$10$placeholder_hash_replace_on_first_run', 'admin');

-- Default categories
INSERT INTO categories (name, description, color) VALUES
('Office Supplies', 'Pens, paper, stationery, and other daily office supplies', '#367A43'),
('Electronics', 'Laptops, monitors, keyboards, and other electronic equipment', '#2563EB'),
('Furniture', 'Desks, chairs, shelves, and other office furniture', '#7C3AED'),
('Packaging Materials', 'Boxes, bags, labels, and packaging supplies', '#D99A28'),
('SME Samples', 'Product samples received from SMEs', '#059669'),
('Cleaning Supplies', 'Cleaning products and sanitation materials', '#EC4899'),
('Printing Materials', 'Ink, toner, and printing paper', '#F59E0B'),
('Kitchen Supplies', 'Utensils, coffee, and kitchen consumables', '#EF4444');

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('company_name', 'InnoLab Kampong Thom'),
('low_stock_threshold', '10'),
('currency', 'USD'),
('date_format', 'YYYY-MM-DD'),
('items_per_page', '20');
