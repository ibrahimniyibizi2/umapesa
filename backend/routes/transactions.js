import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';

const router = express.Router();
const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Get all transactions for a user
router.get('/', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  // Get transactions from the database
  db.all(
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch transactions',
          error: err.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: rows
      });
    }
  );
});

export default router;
