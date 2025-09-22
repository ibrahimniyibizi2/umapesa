import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create a new campaign
router.post('/', async (req, res) => {
  const campaignId = uuidv4();
  const createdAt = new Date().toISOString();
  
  try {
    const {
      title,
      description,
      goalAmount: goal_amount,
      currency,
      endDate: end_date,
      imageUrl: image_url,
      withdrawalNumber: withdrawal_number,
      withdrawalMethod: withdrawal_method,
      creatorId,
      creatorName: creator_name
    } = req.body;

    // Add validation
    if (!title || !description || !goal_amount || !currency || !withdrawal_number || !withdrawal_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO campaigns (
        id, title, description, goal_amount, currency, end_date, 
        image_url, withdrawal_number, withdrawal_method, 
        creator_id, creator_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await new Promise((resolve, reject) => {
      stmt.run(
        [
          campaignId,
          title,
          description,
          Number(goal_amount),
          currency,
          end_date || null,
          image_url || null,
          withdrawal_number,
          withdrawal_method,
          creatorId || null,
          creator_name || null,
          createdAt,
          createdAt
        ],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    // Get the newly created campaign
    const campaign = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [campaignId], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create campaign',
      error: error.message 
    });
  }
});

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM campaigns ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    res.status(200).json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message 
    });
  }
});

// Get a single campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message 
    });
  }
});

// Delete a campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if the campaign exists
    const campaign = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Delete the campaign
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM campaigns WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete campaign',
      error: error.message 
    });
  }
});

export default router;
