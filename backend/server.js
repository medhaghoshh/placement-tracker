// ============================================================
// PlacementTrack — Express server entry point
// ============================================================
// Load .env FIRST, before anything else reads process.env.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve the frontend so http://localhost:5000 just works.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PlacementTrack API' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 5000;

// ---- Check the database BEFORE accepting requests ----
// This turns a confusing "Something went wrong" into a clear message.
async function start() {
  try {
    await db.query('SELECT 1');
    const [[u]] = await db.query('SELECT COUNT(*) AS c FROM users');
    console.log(`Database connected (${u.c} user(s) registered).`);
  } catch (err) {
    console.error('\n========================================');
    console.error(' DATABASE PROBLEM — fix this first');
    console.error('========================================');
    if (err.code === 'ECONNREFUSED') {
      console.error('MySQL is not running or not reachable.');
      console.error('  Windows: Win+R -> services.msc -> start "MySQL80"');
      console.error('  Mac:     brew services start mysql');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Wrong MySQL username or password.');
      console.error(`  Using user "${process.env.DB_USER}" with a ${process.env.DB_PASSWORD ? 'password' : 'BLANK password'}.`);
      console.error('  Fix DB_USER / DB_PASSWORD in backend/.env');
    } else if (err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
      console.error(`The database/tables do not exist yet.`);
      console.error('  Run this once:   npm run setup');
    } else {
      console.error(err.message);
    }
    console.error('========================================\n');
  }

  app.listen(PORT, () => {
    console.log(`PlacementTrack running at http://localhost:${PORT}`);
  });
}

start();
