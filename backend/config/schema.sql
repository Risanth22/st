-- Smart Store Manager Database Schema

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '{}'
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  gstin VARCHAR(20),
  outstanding_dues DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  category_id INTEGER REFERENCES categories(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 18,
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  unit VARCHAR(50) DEFAULT 'pcs',
  expiry_date DATE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Products (many-to-many)
CREATE TABLE IF NOT EXISTS supplier_products (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  product_id INTEGER REFERENCES products(id),
  supplier_price DECIMAL(10,2),
  UNIQUE(supplier_id, product_id)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status VARCHAR(30) DEFAULT 'pending', -- pending, received, cancelled
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  ordered_by INTEGER REFERENCES users(id),
  ordered_at TIMESTAMP DEFAULT NOW(),
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS po_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Bills (Sales)
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_mode VARCHAR(30) DEFAULT 'cash', -- cash, upi, card
  payment_status VARCHAR(30) DEFAULT 'paid',
  cashier_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bill Items
CREATE TABLE IF NOT EXISTS bill_items (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(200),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL
);

-- Expiry Alerts
CREATE TABLE IF NOT EXISTS expiry_alerts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  alert_type VARCHAR(20), -- expired, critical, warning
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reorder Alerts
CREATE TABLE IF NOT EXISTS reorder_alerts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  current_stock INTEGER,
  reorder_level INTEGER,
  notified BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Config
CREATE TABLE IF NOT EXISTS notification_config (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  whatsapp_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_number VARCHAR(20),
  daily_summary_time VARCHAR(10) DEFAULT '21:00',
  low_stock_alert BOOLEAN DEFAULT true,
  expiry_alert BOOLEAN DEFAULT true,
  sales_summary BOOLEAN DEFAULT true
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- Seed Roles
INSERT INTO roles (name, permissions) VALUES
('owner', '{"all": true}'),
('manager', '{"products": true, "suppliers": true, "reports": true, "inventory": true}'),
('cashier', '{"billing": true}')
ON CONFLICT (name) DO NOTHING;

-- Seed Default Owner (password: Admin@123)
INSERT INTO users (name, email, password, role_id, phone) VALUES
('Store Owner', 'owner@store.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, '+919876543210')
ON CONFLICT (email) DO NOTHING;

-- Seed Categories
INSERT INTO categories (name, description) VALUES
('Grocery', 'Daily grocery items'),
('Dairy', 'Milk, curd, cheese etc'),
('Beverages', 'Drinks and beverages'),
('Snacks', 'Chips, biscuits, namkeen'),
('Personal Care', 'Soap, shampoo, toothpaste'),
('Household', 'Cleaning and household items'),
('Frozen Foods', 'Frozen and refrigerated items'),
('Bakery', 'Bread, cakes, buns')
ON CONFLICT (name) DO NOTHING;

-- Seed Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, gstin) VALUES
('Metro Cash & Carry', 'Ramesh Kumar', '+919811000001', 'ramesh@metro.com', '07AABCM1234A1Z5'),
('HUL Distributor', 'Suresh Shah', '+919811000002', 'suresh@hul.com', '07AABCH5678B1Z3'),
('Amul Dairy', 'Priya Patel', '+919811000003', 'priya@amul.com', '24AAAAA0000A1Z5'),
('Parle Biscuits', 'Ankit Jain', '+919811000004', 'ankit@parle.com', '27AAACB2345C1Z1')
ON CONFLICT DO NOTHING;

-- Seed Products
INSERT INTO products (name, sku, barcode, category_id, supplier_id, purchase_price, selling_price, tax_percent, stock_quantity, reorder_level, unit) VALUES
('Aashirvaad Atta 5kg', 'GR001', '8901063111111', 1, 1, 220, 265, 0, 45, 10, 'bag'),
('Tata Salt 1kg', 'GR002', '8901234567890', 1, 1, 18, 24, 0, 120, 20, 'pack'),
('Amul Butter 500g', 'DA001', '8901234000001', 2, 3, 230, 275, 12, 30, 8, 'pack'),
('Amul Milk 1L', 'DA002', '8901234000002', 2, 3, 58, 68, 0, 60, 15, 'litre'),
('Coca Cola 2L', 'BV001', '8901234111001', 3, 1, 68, 90, 28, 40, 12, 'bottle'),
('Parle-G Biscuits 200g', 'SN001', '8901719100005', 4, 4, 22, 30, 18, 200, 30, 'pack'),
('Lays Classic 26g', 'SN002', '8901234222001', 4, 1, 18, 25, 18, 85, 20, 'pack'),
('Colgate Max Fresh 150g', 'PC001', '8901234333001', 5, 2, 65, 85, 18, 55, 10, 'tube'),
('Dettol Soap 75g', 'PC002', '8901234444001', 5, 2, 32, 45, 18, 70, 15, 'bar'),
('Surf Excel 1kg', 'HH001', '8901234555001', 6, 2, 105, 135, 18, 35, 8, 'pack'),
('Bread Brown 400g', 'BK001', '8901234666001', 8, 1, 32, 45, 0, 25, 5, 'pack'),
('Maggi Noodles 70g', 'SN003', '8901234777001', 4, 1, 12, 18, 18, 150, 25, 'pack')
ON CONFLICT (sku) DO NOTHING;
