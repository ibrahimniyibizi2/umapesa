import { NhongaAPI } from 'nhonga-api';
import { config } from './config';
import { PaymentMessageService } from './paymentMessages';

// Validate API configuration before making requests
const validateApiConfig = (): boolean => {
  if (!config.nhonga.apiKey || config.nhonga.apiKey.length < 10) {
    console.error('Invalid Nhonga API key configuration');
    return false;
  }
  if (!config.nhonga.secretKey || config.nhonga.secretKey.length < 10) {
    console.error('Invalid Nhonga secret key configuration');
    return false;
  }
  return true;
};

// Initialize Nhonga API with provided credentials
export const nhonga = validateApiConfig() ? new NhongaAPI({
  apiKey: config.nhonga.apiKey,
  secretKey: config.nhonga.secretKey,
  baseUrl: config.nhonga.baseUrl,
  timeout: 30000,
  retries: 3
}) : null;

// Payment processing service
export class PaymentService {
  static async createPayment(data: {
    amount: number;
    context: string;
    userEmail: string;
    returnUrl?: string;
    currency?: 'MZN' | 'USD';
    environment?: 'prod' | 'dev';
  }) {
    if (!validateApiConfig()) {
      return {
        success: false,
        error: 'Payment service is not properly configured'
      };
    }

    try {
      if (!nhonga) {
        throw new Error('Nhonga API not initialized');
      }

      const payment = await nhonga!.createPayment({
        amount: data.amount,
        context: data.context,
        callbackUrl: `${window.location.origin}/api/webhook/nhonga`,
        returnUrl: data.returnUrl || `${window.location.origin}/payment/success`,
        currency: data.currency || 'MZN',
        enviroment: data.environment || 'prod'
      });

      return {
        success: true,
        paymentId: payment.id,
        redirectUrl: payment.redirectUrl,
        data: payment
      };
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  static async createMobilePayment(data: {
    method: 'mpesa' | 'emola';
    amount: number;
    context: string;
    userEmail: string;
    userWhatsApp: string;
    phone: string;
  }) {
    if (!validateApiConfig() || !nhonga) {
      return {
        success: false,
        error: 'Payment service is not properly configured'
      };
    }

    try {
      const payment = await nhonga!.createMobilePayment({
        method: data.method,
        amount: data.amount,
        context: data.context,
        useremail: data.userEmail,
        userwhatsApp: data.userWhatsApp,
        phone: data.phone
      });

      return {
        success: true,
        paymentId: payment.id,
        data: payment
      };
    } catch (error) {
      console.error('Mobile payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mobile payment failed'
      };
    }
  }

  static async sendMoney(data: {
    phoneNumber: string;
    amount: number;
    method: 'mpesa' | 'emola';
  }) {
    // Validate configuration first
    if (!validateApiConfig()) {
      return {
        success: false,
        error: 'Payment service is not properly configured. Please contact support.'
      };
    }

    // Validate input data
    if (!data.phoneNumber || data.phoneNumber.length < 9) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    if (data.amount <= 0 || data.amount > 50000) {
      return {
        success: false,
        error: 'Amount must be between 1 and 50,000'
      };
    }

    try {
      // Log request for debugging (remove in production)
      if (config.nhonga.debug) {
        console.log('Making payment request:', {
          phoneNumber: data.phoneNumber.substring(0, 3) + '***',
          amount: data.amount,
          method: data.method
        });
      }

      // Format phone number properly
      const formattedPhone = data.phoneNumber.startsWith('+') 
        ? data.phoneNumber.substring(1)
        : data.phoneNumber;

      // Prepare request payload
      const payload = {
        phoneNumber: formattedPhone,
        amount: data.amount.toString(),
        method: data.method === 'mpesa' ? 'Mpesa' : 'Emola'
      };

      if (config.nhonga.debug) {
        console.log('Request payload:', {
          ...payload,
          phoneNumber: payload.phoneNumber.substring(0, 3) + '***'
        });
      }

      const response = await fetch('https://nhonga.net/api/payment/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiKey': config.nhonga.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'UmaPesa/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      // Enhanced error handling for 403 responses
      if (response.status === 403) {
        console.error('403 Forbidden - API Key Issues:', {
          apiKeyLength: config.nhonga.apiKey?.length,
          hasApiKey: !!config.nhonga.apiKey,
          endpoint: 'https://nhonga.net/api/payment/send'
        });
        
        return {
          success: false,
          error: 'Payment service access denied. Please verify your API credentials or contact support.'
        };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Payment API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        switch (response.status) {
          case 401:
            return {
              success: false,
              error: 'Invalid API credentials. Please check your authentication.'
            };
          case 429:
            return {
              success: false,
              error: 'Too many requests. Please wait a moment and try again.'
            };
          case 500:
            return {
              success: false,
              error: 'Payment service is temporarily unavailable. Please try again later.'
            };
          default:
            return {
              success: false,
              error: `Payment failed: ${response.status} ${response.statusText}`
            };
        }
      }

      const result = await response.json();

      if (config.nhonga.debug) {
        console.log('Payment API Response:', result);
      }

      if (result.success === 'true' || result.success === true) {
        return {
          success: true,
          transferId: result.id,
          data: result,
          confirmationMessage: PaymentMessageService.generateWithdrawalConfirmation({
            amount: data.amount,
            currency: 'MZN',
            method: data.method,
            transactionId: result.id || 'N/A'
          })
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || 'Payment processing failed'
        };
      }
    } catch (error) {
      console.error('Payment request failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  static async getPaymentStatus(paymentId: string) {
    if (!validateApiConfig() || !nhonga) {
      return {
        success: false,
        error: 'Payment service is not properly configured'
      };
    }

    try {
      const status = await nhonga!.getPaymentStatus({ id: paymentId });
      return {
        success: true,
        status: status.status,
        amount: status.amount,
        method: status.method,
        currency: status.currency,
        data: status
      };
    } catch (error) {
      console.error('Payment status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status'
      };
    }
  }

  static processWebhook(payload: any, secretKey: string, callback: (data: any) => void) {
    try {
      if (!nhonga) {
        throw new Error('Nhonga API not initialized');
      }
      nhonga!.processWebhook(payload, secretKey, callback);
      return { success: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }
}

// Payment method configurations
export const PAYMENT_METHODS = {
  card: {
    id: 'card',
    name: 'Visa/Mastercard',
    fee: 7,
    icon: '💳',
    type: 'card' as const
  },
  mpesa: {
    id: 'mpesa',
    name: 'M-Pesa',
    fee: 10,
    icon: '📱',
    type: 'mobile_money' as const,
    provider: 'Vodacom'
  },
  emola: {
    id: 'emola',
    name: 'eMola',
    fee: 10,
    icon: '📱',
    type: 'mobile_money' as const,
    provider: 'mCel'
  }
};

// Helper functions
export const calculateTotalWithPaymentFee = (amount: number, paymentMethod: string): number => {
  const method = Object.values(PAYMENT_METHODS).find(m => m.id === paymentMethod);
  if (!method) return amount;
  
  const paymentFee = (amount * method.fee) / 100;
  return amount + paymentFee;
};

export const getPaymentMethodFee = (amount: number, paymentMethod: string): number => {
  const method = Object.values(PAYMENT_METHODS).find(m => m.id === paymentMethod);
  if (!method) return 0;
  
  return (amount * method.fee) / 100;
};