import { NhongaAPI, NhongaError } from 'nhonga-api';
import dotenv from 'dotenv';

dotenv.config();

const nhonga = new NhongaAPI({
  apiKey: process.env.NHONGA_API_KEY,
  secretKey: process.env.NHONGA_SECRET_KEY
});

export async function processNhongaWebhook(payload, secretKey, callback) {
  try {
    nhonga.processWebhook(payload, secretKey, callback);
  } catch (error) {
    console.error('Nhonga webhook processing error:', error);
    throw error;
  }
}

export async function createNhongaPayment({amount, context, callbackUrl, returnUrl}) {
  try {
    const payment = await nhonga.createPayment({
      amount,
      context,
      callbackUrl,
      returnUrl,
      currency: 'MZN',
      enviroment: 'prod'
    });
    
    console.log('Nhonga payment created:', {
      id: payment.id,
      amount,
      context
    });
    
    return payment;
  } catch (error) {
    console.error('Nhonga payment creation error:', error);
    if (error instanceof NhongaError) throw error;
    throw new Error(error.message);
  }
}

export function extractPhoneFromSMS(smsContent) {
  if (!smsContent) return null;
  
  // Extract Rwandan phone number patterns from SMS
  const phonePatterns = [
    /(?:\+?250|0)?([0-9]{8,9})/g,
    /250([0-9]{9})/g,
    /\b0([0-9]{8,9})\b/g,
    /\b([0-9]{8,9})\b/g
  ];
  
  for (const pattern of phonePatterns) {
    const matches = smsContent.match(pattern);
    if (matches && matches.length > 0) {
      const phone = formatPhoneNumber(matches[0]);
      if (validateRwandanPhone(phone)) {
        return phone;
      }
    }
  }
  
  return null;
}

export function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  let cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('250')) {
    return '+' + cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    return '+250' + cleanPhone.substring(1);
  } else if (cleanPhone.length === 8 || cleanPhone.length === 9) {
    return '+250' + cleanPhone;
  }
  
  return null;
}

export function validateRwandanPhone(phone) {
  if (!phone) return false;
  
  const cleanPhone = phone.replace(/\D/g, '');
  const patterns = [
    /^250[0-9]{9}$/,     // +250XXXXXXXXX
    /^0[0-9]{8,9}$/,     // 0XXXXXXXX
    /^[0-9]{8,9}$/       // XXXXXXXX
  ];

  return patterns.some(pattern => pattern.test(cleanPhone));
}

export function maskPhoneNumber(phone) {
  if (!phone || phone.length < 8) return phone;
  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
}