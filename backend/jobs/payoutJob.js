import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { payoutToFlutterwave, formatRwandanPhone } from '../services/flutterwaveService.js';
import { convertCurrency } from '../services/currencyService.js';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null
});

export const payoutQueue = new Queue('payoutQueue', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
});

export const payoutWorker = new Worker('payoutQueue', async job => {
  const { amount, currency, beneficiary, phoneNumber } = job.data;
  
  console.log(`Processing payout job: ${job.id}`, {
    amount,
    currency,
    phoneNumber: phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'N/A'
  });

  try {
    // Convert currency from MZN to RWF
    const convertedAmount = await convertCurrency(amount, currency || 'MZN', 'RWF');
    
    console.log(`Currency conversion: ${amount} ${currency} = ${convertedAmount} RWF`);

    // Format phone number for Flutterwave
    const formattedPhone = formatRwandanPhone(phoneNumber || beneficiary.account_number);
    
    if (!formattedPhone) {
      throw new Error(`Invalid phone number format: ${phoneNumber || beneficiary.account_number}`);
    }

    // Prepare beneficiary data for Flutterwave
    const flutterwaveBeneficiary = {
      ...beneficiary,
      account_number: formattedPhone,
      bank_code: beneficiary.bank_code || "MPS" // Mobile Money Rwanda
    };

    // Execute transfer
    const result = await payoutToFlutterwave({ 
      amount: convertedAmount, 
      currency: 'RWF', 
      beneficiary: flutterwaveBeneficiary 
    });

    if (result.status >= 400) {
      throw new Error(`Payout failed: ${JSON.stringify(result.body)}`);
    }

    console.log('Payout successful:', {
      transferId: result.body.data?.id,
      reference: result.body.data?.reference,
      status: result.body.status
    });

    return {
      success: true,
      transferId: result.body.data?.id,
      reference: result.body.data?.reference,
      amount: convertedAmount,
      currency: 'RWF',
      phoneNumber: formattedPhone
    };
  } catch (error) {
    console.error('Payout job failed:', error.message);
    throw error;
  }
}, { 
  connection,
  concurrency: 5,
  removeOnComplete: 100,
  removeOnFail: 50
});

// Handle worker events
payoutWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully:`, result);
});

payoutWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

payoutWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Payout worker started and listening for jobs...');