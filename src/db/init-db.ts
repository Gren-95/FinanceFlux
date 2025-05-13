import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function initDatabase() {
  const db = await open({
    filename: path.join(process.cwd(), 'financeflux.db'),
    driver: sqlite3.Database
  });

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      failed_attempts INTEGER DEFAULT 0,
      last_failed_attempt INTEGER,
      locked_until INTEGER
    );
  `);

  return db;
}

// Run this script directly if called from command line
if (require.main === module) {
  initDatabase()
    .then(() => console.log('Database initialized successfully'))
    .catch(err => console.error('Database initialization failed:', err));
}
