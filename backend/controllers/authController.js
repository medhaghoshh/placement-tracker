// Handles registration, login, and returning the logged-in profile.
// dotenv is already loaded by server.js before this file is required.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dbErrorMessage = require('../config/dbError');

// Simple email format check.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Create a signed token that expires in 7 days.
function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, college, branch, graduation_year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Reject duplicate emails.
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, college, branch, graduation_year)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hash, college || null, branch || null, graduation_year || null]
    );

    const user = { id: result.insertId, name };
    const token = signToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user.id, name },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({
      message: 'Logged in successfully.',
      token,
      user: { id: user.id, name: user.name },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// GET /api/auth/profile  (protected)
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, college, branch, graduation_year, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};
