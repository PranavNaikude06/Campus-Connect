import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_connect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/', (req, res) => {
  res.send('Campus Connect API is running');
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as val');
    res.json({ status: 'ok', db: 'connected', data: rows });
} catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.post('/api/students/register', async (req, res) => {
  const { eventId, name, email, className, division, year, mobile_no, tuf_id } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    // 0. Check if TUF ID is already taken by someone else
    if (tuf_id) {
      const [tufCheck]: any = await pool.query('SELECT email FROM users WHERE tuf_id = ? AND email != ?', [tuf_id, email]);
      if (tufCheck.length > 0) {
        return res.status(400).json({ error: 'This TUF ID is already registered to another user.' });
      }
    }

    // 1. Find or create the Student user
    const [existingUsers]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    let userId;

    if (existingUsers.length > 0) {
      // Update existing student profile
      userId = existingUsers[0].id;
      await pool.query(
        'UPDATE users SET name=?, class=?, division=?, year=?, mobile_no=?, tuf_id=? WHERE id=?',
        [name, className, division || null, year, mobile_no, tuf_id, userId]
      );
    } else {
      // Insert new student profile
      const [insertResult]: any = await pool.query(
        'INSERT INTO users (name, email, role, class, division, year, mobile_no, tuf_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, 'student', className, division || null, year, mobile_no, tuf_id]
      );
      userId = insertResult.insertId;
    }

    // 2. If an eventId was provided, register them for the event
    if (eventId) {
      try {
        await pool.query('INSERT IGNORE INTO registrations (event_id, user_id) VALUES (?, ?)', [eventId, userId]);
      } catch (eventErr) {
        console.error('Failed to register for event:', eventErr);
      }
    }

    res.status(200).json({ success: true, userId, message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

app.get('/api/students/:id/registrations', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query('SELECT event_id FROM registrations WHERE user_id = ?', [id]);
    const eventIds = rows.map((r: any) => r.event_id);
    res.json({ success: true, eventIds });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.post('/api/auth/student/signup', async (req, res) => {
  const { name, email, tuf_id, password, year, class: branch, division, mobile_no } = req.body;
  if (!name || !email || !tuf_id || !password) {
    return res.status(400).json({ error: 'Name, Email, TUF ID, and Password are required' });
  }

  try {
    // Check if email or TUF ID is already registered
    const [existing]: any = await pool.query('SELECT * FROM users WHERE email = ? OR tuf_id = ?', [email, tuf_id]);
    
    let userId;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing.length > 0) {
      if (existing.length > 1) {
        return res.status(400).json({ error: 'This Email or TUF ID is already registered to different users.' });
      }

      const user = existing[0];
      if (user.email === email && user.tuf_id === tuf_id) {
        if (user.password) {
          return res.status(400).json({ error: 'Account already exists for this Email and TUF ID. Please login.' });
        } else {
          // Upgrade the existing unauthenticated profile
          await pool.query(
            'UPDATE users SET name = ?, password = ?, year = COALESCE(year, ?), class = COALESCE(class, ?), division = COALESCE(division, ?), mobile_no = COALESCE(mobile_no, ?) WHERE id = ?', 
            [name, hashedPassword, year || null, branch || null, division || null, mobile_no || null, user.id]
          );
          userId = user.id;
        }
      } else {
        return res.status(400).json({ error: 'This Email or TUF ID is already taken by another user.' });
      }
    } else {
      // Create a brand new profile
      const [insertResult]: any = await pool.query(
        'INSERT INTO users (name, email, role, tuf_id, password, year, class, division, mobile_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, 'student', tuf_id, hashedPassword, year || null, branch || null, division || null, mobile_no || null]
      );
      userId = insertResult.insertId;
    }

    res.status(201).json({ success: true, userId, message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to process signup' });
  }
});

app.post('/api/auth/student/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and Password are required' });
  }

  try {
    const [users]: any = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'student']);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: 'student', tuf_id: user.tuf_id }, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

app.post('/api/auth/student/reset-password', async (req, res) => {
  const { email, tuf_id, new_password } = req.body;
  if (!email || !tuf_id || !new_password) {
    return res.status(400).json({ error: 'Email, TUF ID, and New Password are required' });
  }

  try {
    const [users]: any = await pool.query('SELECT * FROM users WHERE email = ? AND tuf_id = ? AND role = ?', [email, tuf_id, 'student']);
    if (users.length === 0) {
      return res.status(401).json({ error: 'No student found with that Email and TUF ID combination' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, users[0].id]);

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.status(200).json({ success: true, user: { id: 0, name: 'System Admin', email: 'admin@campusconnect.edu', role: 'admin' }, message: 'Admin login successful' });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const [events]: any = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(events.map((e: any) => ({
      id: e.id, name: e.title, cat: e.category, date: e.event_date ? new Date(e.event_date).toISOString().split('T')[0] : '',
      seats: e.seats, organizer: e.organizer_name, time: e.time, venue: e.venue,
      filled: e.filled, color: e.color, emoji: e.emoji, status: e.status
    })));
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events', async (req, res) => {
  const { name, cat, date, seats, organizer, time, venue, color, emoji } = req.body;
  try {
    const [result]: any = await pool.query(
      `INSERT INTO events (title, category, event_date, seats, organizer_name, time, venue, color, emoji, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [name, cat, date, seats || 0, organizer, time, venue, color, emoji]
    );
    res.status(201).json({ success: true, eventId: result.insertId });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.put('/api/events/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

app.get('/api/events/:id/registrants', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await pool.query(`
      SELECT u.name, u.year, u.class as branch, u.division, u.tuf_id, u.email, u.mobile_no, r.registered_at
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY 
        CASE u.year
          WHEN 'FE' THEN 1 WHEN 'SE' THEN 2 WHEN 'TE' THEN 3 WHEN 'BE' THEN 4 ELSE 5
        END ASC,
        u.division ASC,
        u.name ASC
    `, [id]);
    res.json({ success: true, registrants: rows });
  } catch (error) {
    console.error('Fetch registrants error:', error);
    res.status(500).json({ error: 'Failed to fetch registrants' });
  }
});

// ===== ORGANIZER CREDENTIAL SYSTEM =====

// Admin creates credentials for an organizer
app.post('/api/admin/credentials', async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  username = username.trim();
  password = password.trim();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    await pool.query(
      'INSERT INTO organizer_credentials (username, password_hash, is_activated, valid_until) VALUES (?, ?, false, ?)',
      [username, hashedPassword, validUntil.toISOString().split('T')[0]]
    );
    res.status(201).json({ success: true, message: 'Credentials created', validUntil: validUntil.toISOString().split('T')[0] });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create credentials error:', error);
    res.status(500).json({ error: 'Failed to create credentials' });
  }
});

// Admin lists all organizer credentials (committee view)
app.get('/api/admin/credentials', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT id, username, is_activated, name, year, branch, committee, valid_until, created_at, last_login FROM organizer_credentials ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('List credentials error:', error);
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// Admin deletes credentials
app.delete('/api/admin/credentials/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM organizer_credentials WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete credentials error:', error);
    res.status(500).json({ error: 'Failed to delete credentials' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 'Organizer' as role, name, year, branch, username as email, created_at
      FROM organizer_credentials
      WHERE is_activated = TRUE
      ORDER BY created_at DESC
    `);
    const users = rows.map((u: any) => ({
      name: u.name || 'Unknown',
      year: u.year || '-',
      branch: u.branch || '-',
      role: u.role,
      email: u.email,
      status: 'Active',
      joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'
    }));
    users.unshift({ name: 'System Admin', year: '-', branch: 'Staff', role: 'Admin', email: 'admin@campusconnect.edu', status: 'Active', joined: 'Jan 2025' });
    res.json(users);
  } catch (error) {
    console.error('List admin users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.get('/api/admin/alerts', async (req, res) => {
  // Empty alerts since we removed hardcoded data
  res.json([]);
});

// Organizer login
app.post('/api/auth/organizer/login', async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  username = username.trim();
  password = password.trim();
  try {
    const [rows]: any = await pool.query('SELECT * FROM organizer_credentials WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const cred = rows[0];
    // Check expiry
    if (new Date() > new Date(cred.valid_until)) {
      return res.status(403).json({ error: 'Credentials have expired. Contact your Admin for new credentials.' });
    }
    const isMatch = await bcrypt.compare(password, cred.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Update last login
    await pool.query('UPDATE organizer_credentials SET last_login = NOW() WHERE id = ?', [cred.id]);
    res.json({
      success: true,
      organizer: {
        id: cred.id, username: cred.username, is_activated: cred.is_activated,
        name: cred.name, year: cred.year, branch: cred.branch, committee: cred.committee,
      }
    });
  } catch (error) {
    console.error('Organizer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Organizer first-time profile setup
app.put('/api/auth/organizer/setup', async (req, res) => {
  const { id, name, year, branch, committee } = req.body;
  if (!id || !name || !year || !branch || !committee) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    await pool.query(
      'UPDATE organizer_credentials SET name = ?, year = ?, branch = ?, committee = ?, is_activated = TRUE WHERE id = ?',
      [name, year, branch, committee, id]
    );
    res.json({ success: true, message: 'Profile setup complete' });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({ error: 'Failed to setup profile' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
