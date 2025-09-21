import mysql from 'mysql2/promise';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export class DatabaseService {
  constructor() {
    this.pool = null;
    this.initializePool();
  }

  /**
   * Initialize MySQL connection pool
   */
  async initializePool() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'automation_logs',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000
      });

      // Test connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database pool', { error: error.message });
      // Continue without database logging if connection fails
      this.pool = null;
    }
  }

  /**
   * Log automation transaction
   */
  async logTransaction(data) {
    if (!this.pool) {
      logger.warn('Database not available, skipping transaction log');
      return false;
    }

    try {
      const query = `
        INSERT INTO automation_logs (
          automation_id, nhonga_transaction_id, flutterwave_transfer_id,
          phone_number, amount, currency, status, error_message,
          nhonga_data, flutterwave_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const values = [
        data.automationId,
        data.nhongaTransactionId,
        data.flutterwaveTransferId || null,
        data.phoneNumber,
        data.amount,
        data.currency,
        data.status,
        data.errorMessage || null,
        JSON.stringify(data.nhongaData || {}),
        JSON.stringify(data.flutterwaveData || {}),
      ];

      await this.pool.execute(query, values);
      
      logger.debug('Transaction logged to database', {
        automationId: data.automationId
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to log transaction to database', {
        error: error.message,
        automationId: data.automationId
      });
      return false;
    }
  }

  /**
   * Get automation statistics from database
   */
  async getAutomationStats(timeframe = '24h') {
    if (!this.pool) {
      return {
        success: false,
        error: 'Database not available'
      };
    }

    try {
      let timeCondition = '';
      switch (timeframe) {
        case '1h':
          timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)';
          break;
        case '24h':
          timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
          break;
        case '7d':
          timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
          break;
        case '30d':
          timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
          break;
        default:
          timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
      }

      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(created_at) as first_transaction,
          MAX(created_at) as last_transaction
        FROM automation_logs 
        WHERE ${timeCondition}
      `;

      const [rows] = await this.pool.execute(query);
      const stats = rows[0];

      return {
        success: true,
        data: {
          timeframe,
          totalTransactions: parseInt(stats.total_transactions),
          successfulTransactions: parseInt(stats.successful_transactions),
          failedTransactions: parseInt(stats.failed_transactions),
          pendingTransactions: parseInt(stats.pending_transactions),
          totalAmount: parseFloat(stats.total_amount) || 0,
          averageAmount: parseFloat(stats.average_amount) || 0,
          successRate: stats.total_transactions > 0 
            ? (stats.successful_transactions / stats.total_transactions * 100).toFixed(2)
            : 0,
          firstTransaction: stats.first_transaction,
          lastTransaction: stats.last_transaction
        }
      };
    } catch (error) {
      logger.error('Failed to get automation stats', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create database tables if they don't exist
   */
  async createTables() {
    if (!this.pool) {
      logger.warn('Database not available, skipping table creation');
      return false;
    }

    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS automation_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          automation_id VARCHAR(50) NOT NULL UNIQUE,
          nhonga_transaction_id VARCHAR(100) NOT NULL,
          flutterwave_transfer_id VARCHAR(100) NULL,
          phone_number VARCHAR(20) NOT NULL,
          amount DECIMAL(15,2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'RWF',
          status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
          error_message TEXT NULL,
          nhonga_data JSON NULL,
          flutterwave_data JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_automation_id (automation_id),
          INDEX idx_nhonga_transaction (nhonga_transaction_id),
          INDEX idx_phone_number (phone_number),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await this.pool.execute(createTableQuery);
      logger.info('Database tables created/verified successfully');
      return true;
    } catch (error) {
      logger.error('Failed to create database tables', { error: error.message });
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }
}