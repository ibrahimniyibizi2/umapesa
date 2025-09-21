import axios from 'axios';
import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export class FlutterwaveService {
  constructor() {
    this.publicKey = config.flutterwave.publicKey;
    this.secretKey = config.flutterwave.secretKey;
    this.baseUrl = config.flutterwave.baseUrl;
    this.encryptionKey = config.flutterwave.encryptionKey;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
        'User-Agent': 'UmaPesa-Automation/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Flutterwave API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: this.sanitizeLogData(config.data)
        });
        return config;
      },
      (error) => {
        logger.error('Flutterwave API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('Flutterwave API Response', {
          status: response.status,
          data: this.sanitizeLogData(response.data)
        });
        return response;
      },
      (error) => {
        logger.error('Flutterwave API Response Error', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send money to a phone number via Flutterwave
   */
  async sendMoney(phoneNumber, amount, reference, narration) {
    try {
      // Validate inputs
      if (!phoneNumber || !amount || amount <= 0) {
        throw new Error('Invalid phone number or amount');
      }

      // Format phone number for Rwanda
      const formattedPhone = this.formatRwandanPhone(phoneNumber);
      if (!formattedPhone) {
        throw new Error('Invalid Rwandan phone number format');
      }

      // Prepare transfer payload
      const transferData = {
        account_bank: "MPS", // Mobile Money Rwanda
        account_number: formattedPhone,
        amount: amount,
        currency: config.transfer.currency,
        narration: narration || config.transfer.narration,
        reference: reference || this.generateReference(),
        callback_url: `${process.env.CALLBACK_BASE_URL || 'http://localhost:3001'}/webhook/flutterwave`,
        debit_currency: config.transfer.currency
      };

      logger.info('Initiating Flutterwave transfer', {
        phoneNumber: this.maskPhoneNumber(formattedPhone),
        amount,
        currency: config.transfer.currency,
        reference: transferData.reference
      });

      const response = await this.client.post('/transfers', transferData);

      if (response.data.status === 'success') {
        logger.info('Flutterwave transfer successful', {
          transferId: response.data.data.id,
          reference: transferData.reference,
          phoneNumber: this.maskPhoneNumber(formattedPhone)
        });

        return {
          success: true,
          data: {
            transferId: response.data.data.id,
            reference: transferData.reference,
            status: response.data.data.status,
            amount: amount,
            currency: config.transfer.currency,
            phoneNumber: formattedPhone
          }
        };
      } else {
        throw new Error(response.data.message || 'Transfer failed');
      }
    } catch (error) {
      logger.error('Flutterwave transfer failed', {
        phoneNumber: phoneNumber ? this.maskPhoneNumber(phoneNumber) : 'N/A',
        amount,
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId) {
    try {
      const response = await this.client.get(`/transfers/${transferId}`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Failed to get transfer status', {
        transferId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify account number (phone number) before transfer
   */
  async verifyAccount(phoneNumber) {
    try {
      const formattedPhone = this.formatRwandanPhone(phoneNumber);
      
      const verificationData = {
        account_number: formattedPhone,
        account_bank: "MPS"
      };

      const response = await this.client.post('/misc/verify_payment', verificationData);
      
      return {
        success: response.data.status === 'success',
        data: response.data.data
      };
    } catch (error) {
      logger.error('Account verification failed', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    try {
      const response = await this.client.get('/balances');
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      logger.error('Failed to get balance', { error: error.message });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format phone number for Rwanda
   */
  formatRwandanPhone(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleanPhone.startsWith('250')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0')) {
      return '250' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 8 || cleanPhone.length === 9) {
      return '250' + cleanPhone;
    }
    
    return null;
  }

  /**
   * Validate Rwandan phone number
   */
  validateRwandanPhone(phone) {
    const formatted = this.formatRwandanPhone(phone);
    if (!formatted) return false;
    
    // Rwanda phone number validation
    const rwandaPattern = /^250[0-9]{9}$/;
    return rwandaPattern.test(formatted);
  }

  /**
   * Generate unique reference for transfers
   */
  generateReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `UMA-AUTO-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Mask phone number for logging
   */
  maskPhoneNumber(phone) {
    if (!phone || phone.length < 8) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
  }

  /**
   * Sanitize data for logging
   */
  sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    const sensitiveFields = ['secret', 'key', 'token', 'pin', 'password'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '***REDACTED***';
      }
      if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('account_number')) {
        sanitized[key] = this.maskPhoneNumber(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}