import { NhongaService } from './NhongaService.js';
import { FlutterwaveService } from './FlutterwaveService.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export class AutomationService {
  constructor() {
    this.nhongaService = new NhongaService();
    this.flutterwaveService = new FlutterwaveService();
    this.processedTransactions = new Set(); // Prevent duplicate processing
    this.retryQueue = new Map(); // Store failed transactions for retry
  }

  /**
   * Main automation workflow
   */
  async processAutomation(nhongaWebhookData) {
    const automationId = this.generateAutomationId();
    
    logger.info('Starting automation process', {
      automationId,
      timestamp: new Date().toISOString()
    });

    try {
      // Step 1: Process Nhonga webhook data
      const nhongaResult = this.nhongaService.processWebhook(nhongaWebhookData);
      
      if (!nhongaResult.success || !nhongaResult.shouldProcess) {
        logger.info('Automation skipped', {
          automationId,
          reason: nhongaResult.reason || nhongaResult.error
        });
        return {
          success: true,
          skipped: true,
          reason: nhongaResult.reason || nhongaResult.error
        };
      }

      const { transactionId, phoneNumber, amount } = nhongaResult.data;

      // Check if already processed
      if (this.processedTransactions.has(transactionId)) {
        logger.warn('Transaction already processed, skipping', {
          automationId,
          transactionId
        });
        return {
          success: true,
          skipped: true,
          reason: 'Already processed'
        };
      }

      // Step 2: Validate phone number for Rwanda
      if (!this.flutterwaveService.validateRwandanPhone(phoneNumber)) {
        throw new Error(`Invalid Rwandan phone number: ${phoneNumber}`);
      }

      // Step 3: Verify Flutterwave account (optional but recommended)
      const accountVerification = await this.flutterwaveService.verifyAccount(phoneNumber);
      if (!accountVerification.success) {
        logger.warn('Account verification failed, proceeding anyway', {
          automationId,
          phoneNumber: this.nhongaService.maskPhoneNumber(phoneNumber),
          error: accountVerification.error
        });
      }

      // Step 4: Calculate transfer amount (you can customize this logic)
      const transferAmount = this.calculateTransferAmount(amount);

      // Step 5: Execute Flutterwave transfer
      const transferResult = await this.flutterwaveService.sendMoney(
        phoneNumber,
        transferAmount,
        `AUTO-${transactionId}`,
        `Automated transfer for Nhonga transaction ${transactionId}`
      );

      if (transferResult.success) {
        // Mark as processed
        this.processedTransactions.add(transactionId);
        
        // Log successful automation
        logger.info('Automation completed successfully', {
          automationId,
          nhongaTransactionId: transactionId,
          flutterwaveTransferId: transferResult.data.transferId,
          phoneNumber: this.nhongaService.maskPhoneNumber(phoneNumber),
          amount: transferAmount,
          currency: config.transfer.currency
        });

        return {
          success: true,
          data: {
            automationId,
            nhongaTransactionId: transactionId,
            flutterwaveTransferId: transferResult.data.transferId,
            phoneNumber: phoneNumber,
            amount: transferAmount,
            currency: config.transfer.currency
          }
        };
      } else {
        // Add to retry queue
        this.addToRetryQueue(automationId, {
          transactionId,
          phoneNumber,
          amount: transferAmount,
          attempt: 1
        });

        throw new Error(`Flutterwave transfer failed: ${transferResult.error}`);
      }
    } catch (error) {
      logger.error('Automation process failed', {
        automationId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        automationId
      };
    }
  }

  /**
   * Calculate transfer amount based on Nhonga transaction
   */
  calculateTransferAmount(nhongaAmount) {
    // You can implement custom logic here
    // For example: fixed amount, percentage of Nhonga amount, or lookup table
    
    if (nhongaAmount && nhongaAmount > 0) {
      // Example: Transfer 10% of the Nhonga amount, minimum 500 RWF
      const calculatedAmount = Math.max(nhongaAmount * 0.1, 500);
      return Math.min(calculatedAmount, 50000); // Cap at 50,000 RWF
    }
    
    return config.transfer.defaultAmount;
  }

  /**
   * Add failed transaction to retry queue
   */
  addToRetryQueue(automationId, transactionData) {
    this.retryQueue.set(automationId, {
      ...transactionData,
      addedAt: new Date().toISOString(),
      lastAttempt: new Date().toISOString()
    });

    logger.info('Added transaction to retry queue', {
      automationId,
      attempt: transactionData.attempt
    });
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (this.retryQueue.size === 0) return;

    logger.info('Processing retry queue', { queueSize: this.retryQueue.size });

    for (const [automationId, transactionData] of this.retryQueue.entries()) {
      try {
        // Check if max attempts reached
        if (transactionData.attempt >= config.system.maxRetryAttempts) {
          logger.error('Max retry attempts reached, removing from queue', {
            automationId,
            attempts: transactionData.attempt
          });
          this.retryQueue.delete(automationId);
          continue;
        }

        // Check if enough time has passed since last attempt
        const lastAttemptTime = new Date(transactionData.lastAttempt).getTime();
        const now = new Date().getTime();
        const timeSinceLastAttempt = now - lastAttemptTime;

        if (timeSinceLastAttempt < config.system.retryDelayMs) {
          continue; // Not enough time has passed
        }

        // Retry the transfer
        logger.info('Retrying failed transfer', {
          automationId,
          attempt: transactionData.attempt + 1
        });

        const transferResult = await this.flutterwaveService.sendMoney(
          transactionData.phoneNumber,
          transactionData.amount,
          `RETRY-${automationId}`,
          `Retry transfer for Nhonga transaction ${transactionData.transactionId}`
        );

        if (transferResult.success) {
          // Success - remove from retry queue
          this.retryQueue.delete(automationId);
          this.processedTransactions.add(transactionData.transactionId);
          
          logger.info('Retry transfer successful', {
            automationId,
            transferId: transferResult.data.transferId,
            attempt: transactionData.attempt + 1
          });
        } else {
          // Update retry data
          transactionData.attempt += 1;
          transactionData.lastAttempt = new Date().toISOString();
          transactionData.lastError = transferResult.error;
          
          this.retryQueue.set(automationId, transactionData);
          
          logger.warn('Retry transfer failed', {
            automationId,
            attempt: transactionData.attempt,
            error: transferResult.error
          });
        }
      } catch (error) {
        logger.error('Error processing retry queue item', {
          automationId,
          error: error.message
        });
      }
    }
  }

  /**
   * Get automation statistics
   */
  getStats() {
    return {
      processedTransactions: this.processedTransactions.size,
      pendingRetries: this.retryQueue.size,
      retryQueue: Array.from(this.retryQueue.entries()).map(([id, data]) => ({
        automationId: id,
        transactionId: data.transactionId,
        phoneNumber: this.nhongaService.maskPhoneNumber(data.phoneNumber),
        amount: data.amount,
        attempt: data.attempt,
        addedAt: data.addedAt,
        lastAttempt: data.lastAttempt,
        lastError: data.lastError
      }))
    };
  }

  /**
   * Clear processed transactions (for memory management)
   */
  clearProcessedTransactions() {
    const count = this.processedTransactions.size;
    this.processedTransactions.clear();
    logger.info('Cleared processed transactions', { count });
  }

  /**
   * Generate unique automation ID
   */
  generateAutomationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `AUTO-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Health check for both services
   */
  async healthCheck() {
    const results = {
      nhonga: { status: 'unknown', error: null },
      flutterwave: { status: 'unknown', error: null },
      overall: 'unknown'
    };

    try {
      // Check Flutterwave balance endpoint as health check
      const flutterwaveHealth = await this.flutterwaveService.getBalance();
      results.flutterwave.status = flutterwaveHealth.success ? 'healthy' : 'unhealthy';
      if (!flutterwaveHealth.success) {
        results.flutterwave.error = flutterwaveHealth.error;
      }
    } catch (error) {
      results.flutterwave.status = 'unhealthy';
      results.flutterwave.error = error.message;
    }

    try {
      // Check Nhonga API (you might need to implement a health endpoint)
      const nhongaHealth = await this.nhongaService.getSMSConfirmations();
      results.nhonga.status = nhongaHealth.success ? 'healthy' : 'unhealthy';
      if (!nhongaHealth.success) {
        results.nhonga.error = nhongaHealth.error;
      }
    } catch (error) {
      results.nhonga.status = 'unhealthy';
      results.nhonga.error = error.message;
    }

    // Determine overall health
    results.overall = (results.nhonga.status === 'healthy' && results.flutterwave.status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';

    return results;
  }
}