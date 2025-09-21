import axios from 'axios';
import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export class NhongaService {
  constructor() {
    this.apiKey = config.nhonga.apiKey;
    this.secretKey = config.nhonga.secretKey;
    this.baseUrl = config.nhonga.baseUrl;
    this.webhookSecret = config.nhonga.webhookSecret;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'apiKey': this.apiKey,
        'User-Agent': 'UmaPesa-Automation/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Nhonga API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: this.sanitizeLogData(config.data)
        });
        return config;
      },
      (error) => {
        logger.error('Nhonga API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('Nhonga API Response', {
          status: response.status,
          data: this.sanitizeLogData(response.data)
        });
        return response;
      },
      (error) => {
        logger.error('Nhonga API Response Error', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Monitor SMS confirmations from Nhonga
   * This would typically be called via webhook or polling
   */
  async getSMSConfirmations() {
    try {
      const response = await this.client.get('/sms/confirmations');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to get SMS confirmations', {
        error: error.message,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Get transaction status from Nhonga
   */
  async getTransactionStatus(transactionId) {
    try {
      const response = await this.client.get(`/transactions/${transactionId}/status`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to get transaction status', {
        transactionId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Webhook signature verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Process webhook data from Nhonga
   */
  processWebhook(payload) {
    try {
      // Extract relevant information from Nhonga webhook
      const {
        transaction_id,
        status,
        amount,
        currency,
        phone_number,
        sms_content,
        timestamp
      } = payload;

      // Validate required fields
      if (!transaction_id || !status || !phone_number) {
        throw new Error('Missing required webhook fields');
      }

      // Check if transaction was successful
      if (status !== 'completed' && status !== 'success') {
        logger.info('Transaction not successful, skipping automation', {
          transactionId: transaction_id,
          status
        });
        return {
          success: false,
          reason: 'Transaction not successful',
          shouldProcess: false
        };
      }

      // Extract and validate phone number
      const extractedPhone = this.extractPhoneNumber(phone_number, sms_content);
      if (!extractedPhone) {
        throw new Error('Could not extract valid phone number');
      }

      logger.info('Successfully processed Nhonga webhook', {
        transactionId: transaction_id,
        phoneNumber: this.maskPhoneNumber(extractedPhone),
        amount,
        currency
      });

      return {
        success: true,
        data: {
          transactionId: transaction_id,
          phoneNumber: extractedPhone,
          amount: parseFloat(amount),
          currency,
          timestamp
        },
        shouldProcess: true
      };
    } catch (error) {
      logger.error('Failed to process Nhonga webhook', {
        error: error.message,
        payload: this.sanitizeLogData(payload)
      });
      
      return {
        success: false,
        error: error.message,
        shouldProcess: false
      };
    }
  }

  /**
   * Extract phone number from SMS content or direct field
   */
  extractPhoneNumber(phoneField, smsContent) {
    // First try the direct phone field
    if (phoneField && this.validatePhoneNumber(phoneField)) {
      return this.formatPhoneNumber(phoneField);
    }

    // If no direct phone or invalid, try to extract from SMS content
    if (smsContent) {
      const phoneRegex = /(?:\+?250|0)?([0-9]{8,9})/g;
      const matches = smsContent.match(phoneRegex);
      
      if (matches && matches.length > 0) {
        const extractedPhone = this.formatPhoneNumber(matches[0]);
        if (this.validatePhoneNumber(extractedPhone)) {
          return extractedPhone;
        }
      }
    }

    return null;
  }

  /**
   * Validate Rwandan phone number format
   */
  validatePhoneNumber(phone) {
    if (!phone) return false;
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check for valid Rwandan phone number patterns
    const patterns = [
      /^250[0-9]{9}$/,     // +250XXXXXXXXX
      /^0[0-9]{8,9}$/,     // 0XXXXXXXX or 0XXXXXXXXX
      /^[0-9]{8,9}$/       // XXXXXXXX or XXXXXXXXX
    ];

    return patterns.some(pattern => pattern.test(cleanPhone));
  }

  /**
   * Format phone number to international format
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleanPhone.startsWith('250')) {
      return '+' + cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      return '+250' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 8 || cleanPhone.length === 9) {
      return '+250' + cleanPhone;
    }
    
    return null;
  }

  /**
   * Mask phone number for logging (privacy)
   */
  maskPhoneNumber(phone) {
    if (!phone || phone.length < 8) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'pin'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      }
      if (key.toLowerCase().includes('phone')) {
        sanitized[key] = this.maskPhoneNumber(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}