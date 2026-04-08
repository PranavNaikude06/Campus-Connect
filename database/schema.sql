CREATE DATABASE IF NOT EXISTS campus_connect;
USE campus_connect;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('student', 'organizer', 'admin') DEFAULT 'student',
  class VARCHAR(50),
  division VARCHAR(10),
  year VARCHAR(20),
  mobile_no VARCHAR(20),
  tuf_id VARCHAR(50) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  event_date DATE,
  seats INT DEFAULT 0,
  organizer_id INT,
  is_paid TINYINT(1) NOT NULL DEFAULT 0,
  amount VARCHAR(255) DEFAULT NULL,
  qr_image LONGTEXT DEFAULT NULL,
  whatsapp_link VARCHAR(500) DEFAULT NULL,
  team_size_min INT DEFAULT 1,
  team_size_max INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT,
  user_id INT,
  payment_ss LONGTEXT DEFAULT NULL,
  payment_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
  team_name VARCHAR(255) DEFAULT NULL,
  team_members JSON DEFAULT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

-- ===== MIGRATION (for existing databases) =====
-- Run these ALTER statements once if the events table already exists without these columns:
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS amount VARCHAR(255) DEFAULT NULL;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS qr_image LONGTEXT DEFAULT NULL;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS whatsapp_link VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS team_size_min INT DEFAULT 1;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS team_size_max INT DEFAULT 1;
-- ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending';
