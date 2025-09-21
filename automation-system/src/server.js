import express from 'express';
import crypto from 'crypto';
import cron from 'node-cron';
import { AutomationService } from './services/AutomationService.js';
import { DatabaseService } from './services/DatabaseService.js';
import config from './config/index.js';
import logger from './utils/logger.js';

export class AutomationServer {
  constructor() {
    this.app = express();
    this.automationService = new AutomationService();
    this.databaseService = new DatabaseService();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupCronJobs();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // Rate limiting middleware (basic implementation)
    const requestCounts = new Map();
    this.app.use((req, res, next) => {
      const clientIp = req.ip;
      const now = Date.now();
      const windowMs = 60000; // 1 minute window
      
      if (!requestCounts.has(clientIp)) {
        requestCounts.set(clientIp, { count: 1, resetTime: now + windowMs });
      } else {
        const clientData = requestCounts.get(clientIp);
        
        if (now > clientData.resetTime) {
          clientData.count = 1;
          clientData.resetTime = now + windowMs;
        } else {
          clientData.count++;
        }
        
        if (clientData.count > config.security.apiRateLimit) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded'
          });
        }
      }
      
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const healthStatus = await this.automationService.healthCheck();
        const stats = this.automationService.getStats();
        
        res.json({
          success: true,
          status: healthStatus.overall,
          services: healthStatus,
          stats: stats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
          success: false,
          error: 'Health check failed'
        });
      }
    });

    // Nhonga webhook endpoint
    this.app.post('/webhook/nhonga', async (req, res) => {
      try {
        // Verify webhook signature
        const signature = req.headers['x-nhonga-signature'];
        if (!this.verifyWebhookSignature(req.body, signature)) {
          logger.warn('Invalid webhook signature', {
            ip: req.ip,
            signature: signature ? 'present' : 'missing'
          });
          return res.status(401).json({
            success: false,
            error: 'Invalid signature'
          });
        }

        logger.info('Received Nhonga webhook', {
          transactionId: req.body.transaction_id,
          status: req.body.status
        });

        // Process automation
        const result = await this.automationService.processAutomation(req.body);
        
        // Log to database
        await this.databaseService.logTransaction({
          automationId: result.data?.automationId || 'unknown',
          nhongaTransactionId: req.body.transaction_id,
          flutterwaveTransferId: result.data?.flutterwaveTransferId,
          phoneNumber: result.data?.phoneNumber,
          amount: result.data?.amount,
          currency: result.data?.currency,
          status: result.success ? 'success' : 'failed',
          errorMessage: result.error,
          nhongaData: req.body,
          flutterwaveData: result.data
        });

        res.json({
          success: true,
          message: 'Webhook processed successfully',
          automationId: result.data?.automationId
        });
      } catch (error) {
        logger.error('Webhook processing error', {
          error: error.message,
          body: req.body
        });
        
        res.status(500).json({
          success: false,
          error: 'Webhook processing failed'
        });
      }
    });

    // Manual trigger endpoint (for testing)
    this.app.post('/trigger/manual', async (req, res) => {
      try {
        const { phoneNumber, amount, transactionId } = req.body;
        
        if (!phoneNumber || !amount) {
          return res.status(400).json({
            success: false,
            error: 'Phone number and amount are required'
          });
        }

        // Create mock Nhonga webhook data
        const mockWebhookData = {
          transaction_id: transactionId || `MANUAL-${Date.now()}`,
          status: 'completed',
          amount: amount,
          currency: 'MZN',
          phone_number: phoneNumber,
          sms_content: `Payment confirmed for ${phoneNumber}`,
          timestamp: new Date().toISOString()
        };

        const result = await this.automationService.processAutomation(mockWebhookData);
        
        res.json({
          success: true,
          message: 'Manual trigger processed',
          result: result
        });
      } catch (error) {
        logger.error('Manual trigger error', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Statistics endpoint
    this.app.get('/stats', async (req, res) => {
      try {
        const timeframe = req.query.timeframe || '24h';
        const automationStats = this.automationService.getStats();
        const databaseStats = await this.databaseService.getAutomationStats(timeframe);
        
        res.json({
          success: true,
          data: {
            automation: automationStats,
            database: databaseStats.data,
            timeframe: timeframe
          }
        });
      } catch (error) {
        logger.error('Stats endpoint error', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Retry queue management
    this.app.post('/retry/process', async (req, res) => {
      try {
        await this.automationService.processRetryQueue();
        const stats = this.automationService.getStats();
        
        res.json({
          success: true,
          message: 'Retry queue processed',
          stats: stats
        });
      } catch (error) {
        logger.error('Retry processing error', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Clear processed transactions
    this.app.post('/maintenance/clear', async (req, res) => {
      try {
        this.automationService.clearProcessedTransactions();
        
        res.json({
          success: true,
          message: 'Processed transactions cleared'
        });
      } catch (error) {
        logger.error('Maintenance clear error', { error: error.message });
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled server error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  /**
   * Setup cron jobs for automated tasks
   */
  setupCronJobs() {
    // Process retry queue every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      logger.info('Running scheduled retry queue processing');
      try {
        await this.automationService.processRetryQueue();
      } catch (error) {
        logger.error('Scheduled retry processing failed', { error: error.message });
      }
    });

    // Clear processed transactions every hour (memory management)
    cron.schedule('0 * * * *', () => {
      logger.info('Running scheduled cleanup');
      this.automationService.clearProcessedTransactions();
    });

    // Health check every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        const health = await this.automationService.healthCheck();
        if (health.overall !== 'healthy') {
          logger.warn('System health check failed', { health });
        }
      } catch (error) {
        logger.error('Health check cron failed', { error: error.message });
      }
    });

    logger.info('Cron jobs scheduled successfully');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!signature) return false;
    
    try {
      const expectedSignature = crypto
        .createHmac('sha256', config.security.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Signature verification error', { error: error.message });
      return false;
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Initialize database tables
      await this.databaseService.createTables();
      
      // Start Express server
      this.server = this.app.listen(config.system.port, () => {
        logger.info('Automation server started', {
          port: config.system.port,
          environment: config.system.nodeEnv,
          pid: process.pid
        });
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      
      return this.server;
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down automation server...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
      });
    }
    
    await this.databaseService.close();
    logger.info('Automation server shutdown complete');
    process.exit(0);
  }
}