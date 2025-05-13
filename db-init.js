// Database initialization script
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function initializeDatabase() {
  // Ensure db directory exists
  const dbDir = path.join(__dirname, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'fluxfinance.sqlite');
  const schemaPath = path.join(dbDir, 'schema.sql');
  
  try {
    // Open database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    console.log(`Database opened at ${dbPath}`);
    
    // Check if schema file exists
    if (fs.existsSync(schemaPath)) {
      // Read schema SQL file
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      
      // Execute schema SQL
      console.log('Applying database schema...');
      await db.exec(schemaSql);
      console.log('Schema applied successfully');
      
      // Verify test user exists
      const testUser = await db.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
      if (testUser) {
        console.log('Test user exists in the database');
      } else {
        console.log('Warning: Test user not found in the database');
      }
      
      await db.close();
      console.log('Database initialized successfully');
      return true;
    } else {
      console.error(`Schema file not found at ${schemaPath}`);
      await db.close();
      return false;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then((success) => {
      if (success) {
        console.log('Database setup completed');
      } else {
        console.error('Database setup failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error during database setup:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;
