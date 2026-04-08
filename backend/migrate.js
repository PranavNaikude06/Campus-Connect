require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_connect'
  });

  try {
    console.log('Adding payment_status column...');
    await connection.query("ALTER TABLE registrations ADD COLUMN payment_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending'");
    console.log('Column added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error:', error.message);
    }
  }

  process.exit();
}

run();
