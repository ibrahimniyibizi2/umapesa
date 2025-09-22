import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { processNhongaWebhook, createNhongaPayment, extractPhoneFromSMS, validateRwandanPhone, maskPhoneNumber } from './services/nhongaService.js';
// Import job queue with error handling
let payoutQueue = null;
let payoutWorker = null;

try {
  const { payoutQueue: queue, payoutWorker: worker } = await import('./jobs/payoutJob.js');
  payoutQueue = queue;
  payoutWorker = worker;
  console.log('Redis job queue initialized');
} catch (error) {
  console.warn('Failed to initialize Redis job queue. Some features may be limited. Error:', error.message);
}
import { getFlutterwaveBalance } from './services/flutterwaveService.js';
import { convertCurrency } from './services/currencyService.js';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create images directory if it doesn't exist
    const uploadDir = 'images/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize database
const initDb = () => {
  const db = new sqlite3.Database(path.join(process.cwd(), 'data', 'database.sqlite'));
  
  db.serialize(() => {
    // Create campaigns table if not exists
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

    // Create contributions table if not exists
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

    console.log('Database tables initialized');
  });

  return db;
};

// Initialize database
const db = initDb();

// Serve static files from the images directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, 'images')));

// Import routes
import campaignsRouter from './routes/campaigns.js';
import transactionsRouter from './routes/transactions.js';

// Use routes
app.use('/api/campaigns', campaignsRouter);
app.use('/api/transactions', transactionsRouter);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('API Endpoints:');
  console.log(`- POST   /api/campaigns/upload`);
  console.log(`- GET    /api/campaigns`);
  console.log(`- POST   /api/campaigns`);
  console.log(`- GET    /api/campaigns/:id`);
  console.log(`- PUT    /api/campaigns/:id`);
  console.log(`- DELETE /api/campaigns/:id`);
  console.log('\nMake sure the "images" directory exists and is writable');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (payoutWorker) {
    await payoutWorker.close();
  }
  if (payoutQueue) {
    await payoutQueue.close();
  }
  await payoutQueue.close();
  process.exit(0);
});
