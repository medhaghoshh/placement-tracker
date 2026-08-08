// ============================================================
// setup.js — one-command database setup
// Run with:  npm run setup
// Creates the database, tables, and sample data automatically
// so you never have to import the .sql file by hand.
// ============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');
const fs = require('fs');

const HOST = process.env.DB_HOST || 'localhost';
const USER = process.env.DB_USER || 'root';
const PASS = process.env.DB_PASSWORD || '';
const NAME = process.env.DB_NAME || 'placement_tracker';

async function setup() {
  console.log('\n=== PlacementTrack setup ===');
  console.log(`Connecting to MySQL at ${HOST} as "${USER}"...`);

  let conn;
  try {
    // Connect WITHOUT selecting a database so we can create it.
    conn = await mysql.createConnection({
      host: HOST, user: USER, password: PASS, multipleStatements: true,
    });
  } catch (err) {
    console.error('\n❌ Could not connect to MySQL.\n');
    if (err.code === 'ECONNREFUSED') {
      console.error('   MySQL does not appear to be running.');
      console.error('   → Windows: press Win+R, type "services.msc", find MySQL80, click Start.');
      console.error('   → Mac: run "brew services start mysql"');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Wrong username or password.');
      console.error(`   You are using user "${USER}" with password "${PASS ? '(set)' : '(blank)'}".`);
      console.error('   → Open backend/.env and fix DB_USER / DB_PASSWORD.');
    } else {
      console.error('   ' + err.message);
    }
    console.error('');
    process.exit(1);
  }

  try {
    const sqlPath = path.join(__dirname, '..', 'database', 'placement_tracker.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await conn.query(sql);

    // Verify
    await conn.query(`USE \`${NAME}\``);
    const [[u]] = await conn.query('SELECT COUNT(*) AS c FROM users');
    const [[a]] = await conn.query('SELECT COUNT(*) AS c FROM applications');

    console.log(`\n✅ Database "${NAME}" is ready.`);
    console.log(`   users table: ${u.c} row(s)`);
    console.log(`   applications table: ${a.c} row(s)`);
    console.log('\nNow run:  npm start');
    console.log('Then open http://localhost:5000\n');
  } catch (err) {
    console.error('\n❌ Setup failed while creating tables:');
    console.error('   ' + err.message + '\n');
    process.exit(1);
  } finally {
    await conn.end();
  }
}

setup();
