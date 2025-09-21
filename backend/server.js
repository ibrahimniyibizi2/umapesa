import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { processNhongaWebhook, createNhongaPayment, extractPhoneFromSMS, validateRwandanPhone, maskPhoneNumber } from './services/nhongaService.js';
import { payoutQueue, payoutWorker } from './jobs/payoutJob.js';
import { getFlutterwaveBalance } from './services/flutterwaveService.js';
import { convertCurrency } from './services/currencyService.js';


dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
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
    // Create uploads directory if it doesn't exist
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Flutterwave connectivity
    const flutterwaveHealth = await getFlutterwaveBalance();
    
    // Get queue stats
    const waiting = await payoutQueue.getWaiting();
    const active = await payoutQueue.getActive();
    const completed = await payoutQueue.getCompleted();
    const failed = await payoutQueue.getFailed();

    res.json({
      success: true,
      status: 'healthy',
      services: {
        flutterwave: flutterwaveHealth.status < 400 ? 'healthy' : 'unhealthy',
        redis: 'healthy', // If we got queue stats, Redis is working
        queue: 'healthy'
      },
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Webhook Nhonga - Main automation trigger
app.post('/webhook/nhonga', async (req, res) => {
  const secretKey = req.headers['secretkey'] || req.headers['x-webhook-signature'];
  const payload = req.body;

  console.log('Received Nhonga webhook:', {
    hasSecretKey: !!secretKey,
    payloadKeys: Object.keys(payload)
  });

  try {
    processNhongaWebhook(payload, secretKey, async (webhookData) => {
      console.log('Processing webhook data:', {
        id: webhookData.id,
        status: webhookData.status,
        paid: webhookData.paid,
        hasPhone: !!webhookData.phone
      });

      const txId = webhookData.id;
      const amount = webhookData.paid || webhookData.amount;
      
      // Extract phone number from SMS content or direct field
      let phoneNumber = webhookData.phone || webhookData.phoneNumber;
      
      if (!phoneNumber && webhookData.sms_content) {
        phoneNumber = extractPhoneFromSMS(webhookData.sms_content);
      }
      
      if (!phoneNumber && webhookData.message) {
        phoneNumber = extractPhoneFromSMS(webhookData.message);
      }

      if (!phoneNumber) {
        console.error('No phone number found in webhook data');
        return;
      }

      // Validate phone number
      if (!validateRwandanPhone(phoneNumber)) {
        console.error('Invalid Rwandan phone number:', maskPhoneNumber(phoneNumber));
        return;
      }

      console.log('Queueing payout for:', {
        txId,
        phoneNumber: maskPhoneNumber(phoneNumber),
        amount,
        currency: 'MZN'
      });

      const beneficiary = {
        bank_code: 'MPS', // Mobile Money Rwanda
        account_number: phoneNumber,
        orig_tx: txId
      };

      // Add job to queue with unique ID to prevent duplicates
      await payoutQueue.add(`payout-${txId}`, {
        amount: amount,
        currency: 'MZN',
        beneficiary,
        phoneNumber,
        originalTxId: txId
      }, {
        jobId: `payout-${txId}`, // Prevents duplicate processing
        delay: 5000 // 5 second delay to ensure transaction is fully processed
      });

      console.log(`Payout job queued successfully for transaction ${txId}`);
    });

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Invalid webhook',
      message: error.message 
    });
  }
});

// Manual trigger for testing
app.post('/trigger/manual', async (req, res) => {
  const { phoneNumber, amount, transactionId } = req.body;
  
  try {
    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and amount are required'
      });
    }

    if (!validateRwandanPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Rwandan phone number format'
      });
    }

    const txId = transactionId || `MANUAL-${Date.now()}`;
    const beneficiary = {
      bank_code: 'MPS',
      account_number: phoneNumber,
      orig_tx: txId
    };

    await payoutQueue.add(`manual-payout-${txId}`, {
      amount: amount,
      currency: 'MZN',
      beneficiary,
      phoneNumber,
      originalTxId: txId
    });

    console.log('Manual payout triggered:', {
      txId,
      phoneNumber: maskPhoneNumber(phoneNumber),
      amount
    });

    res.json({
      success: true,
      message: 'Manual payout triggered successfully',
      transactionId: txId
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create Nhonga payment
app.post('/create-payment', async (req, res) => {
  const { amount, context, callbackUrl, returnUrl } = req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const payment = await createNhongaPayment({ 
      amount, 
      context: context || 'Payment via automation system', 
      callbackUrl: callbackUrl || `http://localhost:${process.env.PORT}/webhook/nhonga`,
      returnUrl 
    });
    
    res.json({
      success: true,
      payment: payment
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Queue statistics
app.get('/queue/stats', async (req, res) => {
  try {
    const waiting = await payoutQueue.getWaiting();
    const active = await payoutQueue.getActive();
    const completed = await payoutQueue.getCompleted();
    const failed = await payoutQueue.getFailed();

    res.json({
      success: true,
      stats: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        jobs: {
          waiting: waiting.map(job => ({
            id: job.id,
            data: {
              ...job.data,
              phoneNumber: maskPhoneNumber(job.data.phoneNumber)
            }
          })),
          failed: failed.map(job => ({
            id: job.id,
            error: job.failedReason,
            data: {
              ...job.data,
              phoneNumber: maskPhoneNumber(job.data.phoneNumber)
            }
          }))
        }
      }
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Flutterwave webhook
app.post('/webhook/flutterwave', (req, res) => {
  console.log('Received Flutterwave webhook:', req.body);
  res.status(200).send('OK');
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Campaign endpoints
app.post('/api/campaigns', async (req, res) => {
  try {
    const {
      title,
      description,
      goal_amount,
      currency,
      end_date,
      image_url,
      withdrawal_number,
      withdrawal_method,
      is_active
    } = req.body;

    // Add validation
    if (!title || !description || !goal_amount || !currency || !withdrawal_number || !withdrawal_method) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Here you would typically save to your database
    // For now, we'll just return a success response
    const newCampaign = {
      id: Date.now().toString(),
      title,
      description,
      goal_amount,
      currency,
      end_date: end_date || null,
      image_url: image_url || '',
      withdrawal_number,
      withdrawal_method,
      is_active: is_active !== false, // default to true if not provided
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newCampaign
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

// Delete campaign endpoint
app.delete('/api/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Here you would typically delete from your database
    // For now, we'll just return a success response
    console.log(`Deleting campaign with ID: ${id}`);
    
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

// File upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    // Return the file path
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload file',
      error: error.message 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Nhonga-Flutterwave Automation Server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/nhonga`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Queue stats: http://localhost:${PORT}/queue/stats`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await payoutWorker.close();
  await payoutQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await payoutWorker.close();
  await payoutQueue.close();
  process.exit(0);
});