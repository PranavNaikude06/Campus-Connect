import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizer_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_activated BOOLEAN DEFAULT FALSE,
        name VARCHAR(255),
        year VARCHAR(50),
        branch VARCHAR(100),
        committee VARCHAR(255),
        valid_until DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      );
    `);
    console.log('Successfully created organizer_credentials table');
    
    // Add division column to users table if it doesn't exist
    try {
      await pool.query('ALTER TABLE users ADD COLUMN division VARCHAR(10);');
      console.log('Successfully added division column to users table');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('division column already exists in users table');
      } else {
        throw err;
      }
    }
  } catch (e: any) {
    console.error(e);
  }
  process.exit();
}
run();
