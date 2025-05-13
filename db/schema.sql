-- Schema for FinanceFlux database
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  transaction_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL, -- 'monthly', 'weekly', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  target_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Insert test user for development/testing
INSERT OR IGNORE INTO users (email, name, password_hash, password_salt)
VALUES (
  'test@example.com', 
  'Test User', 
  '7a9c1085d17841ff98775b16aad51c92ff2a9b7acb0ab82202b867773530f5402735da27ef5e74fe7ae8a7536c76a1e17933f0d555b28413c51c911c97f797d7', 
  '0123456789abcdef'
);

-- Insert some sample transactions for the test user
INSERT OR IGNORE INTO transactions (user_id, amount, description, category, transaction_date)
VALUES
  (1, -85.42, 'Grocery Store', 'Food', '2025-05-01 12:30:00'),
  (1, 2450.00, 'Salary Deposit', 'Income', '2025-05-05 09:00:00'),
  (1, -125.30, 'Electric Bill', 'Utilities', '2025-05-08 15:45:00');

-- Insert some sample budgets for the test user
INSERT OR IGNORE INTO budgets (user_id, category, amount, period)
VALUES
  (1, 'Food', 400.00, 'monthly'),
  (1, 'Transportation', 250.00, 'monthly'),
  (1, 'Entertainment', 200.00, 'monthly');

-- Insert some sample savings goals for the test user
INSERT OR IGNORE INTO savings_goals (user_id, name, target_amount, current_amount, target_date)
VALUES
  (1, 'Vacation', 2000.00, 900.00, '2025-12-31 00:00:00'),
  (1, 'New Computer', 1500.00, 1125.00, '2025-08-15 00:00:00');
