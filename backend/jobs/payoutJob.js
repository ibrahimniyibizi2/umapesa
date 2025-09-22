// In-memory queue implementation
class InMemoryQueue {
  constructor() {
    this.jobs = [];
    this.processing = false;
    this.handlers = new Map();
    console.log('Using in-memory queue (Redis not available)');
  }

  async add(name, data, opts = {}) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      data,
      timestamp: Date.now(),
      ...opts
    };
    
    this.jobs.push(job);
    this.processQueue();
    return job;
  }

  async close() {
    console.log('In-memory queue closed');
    return Promise.resolve();
  }

  on(event, handler) {
    this.handlers.set(event, handler);
  }

  async processQueue() {
    if (this.processing || this.jobs.length === 0) return;
    
    this.processing = true;
    const job = this.jobs.shift();
    
    try {
      const handler = this.handlers.get('completed');
      if (handler) {
        const result = await this.processJob(job);
        handler(job, result);
      }
    } catch (error) {
      const errorHandler = this.handlers.get('failed');
      if (errorHandler) {
        errorHandler(job, error);
      } else {
        console.error('Job failed with no error handler:', error);
      }
    } finally {
      this.processing = false;
      process.nextTick(() => this.processQueue());
    }
  }

  async processJob(job) {
    // This will be implemented by the worker
    throw new Error('No worker registered for this queue');
  }
}

import { payoutToFlutterwave, formatRwandanPhone } from '../services/flutterwaveService.js';
import { convertCurrency } from '../services/currencyService.js';
import dotenv from 'dotenv';

dotenv.config();

// Create in-memory queue
const queue = new InMemoryQueue();

// Implement the job processing
queue.processJob = async (job) => {
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
};

// Export the queue and worker
export const payoutQueue = {
  add: async (name, data, opts) => {
    return queue.add(name, data, opts);
  },
  close: async () => {
    return queue.close();
  }
};

export const payoutWorker = {
  on: (event, handler) => {
    queue.on(event, handler);
  },
  close: async () => {
    return queue.close();
  }
};

// Set up event handlers
payoutWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully:`, result);
});

payoutWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

payoutWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Start processing the queue
queue.processQueue();

console.log('In-memory queue worker started');