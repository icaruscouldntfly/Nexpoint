-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  strength TEXT NOT NULL,
  stock INTEGER NOT NULL,
  multipleOf INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('In Stock', 'Low Stock', 'Out of Stock'))
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderNumber TEXT UNIQUE NOT NULL,
  customerName TEXT NOT NULL,
  storeName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  items TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
