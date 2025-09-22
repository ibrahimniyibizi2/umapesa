import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Drop tables if they exist (for development)
  db.run('DROP TABLE IF EXISTS contributions');
  db.run('DROP TABLE IF EXISTS campaigns');

  // Create campaigns table
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      goal_amount REAL NOT NULL,
      raised_amount REAL DEFAULT 0,
      currency TEXT NOT NULL,
      creator_id TEXT,
      creator_name TEXT,
      image_url TEXT,
      withdrawal_number TEXT,
      withdrawal_method TEXT,
      is_active BOOLEAN DEFAULT 1,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create contributions table
  db.run(`
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      contributor_name TEXT,
      contributor_phone TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      message TEXT,
      is_anonymous BOOLEAN DEFAULT 0,
      payment_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
    )
  `);

  console.log('Database tables created successfully');
});

db.close();
