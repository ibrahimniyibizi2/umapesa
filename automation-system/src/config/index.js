import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

// Configuration schema validation
const configSchema = Joi.object({
  // Nhonga Configuration
  NHONGA_API_KEY: Joi.string().required(),
  NHONGA_SECRET_KEY: Joi.string().required(),
  NHONGA_BASE_URL: Joi.string().uri().default('https://nhonga.net/api'),
  NHONGA_WEBHOOK_SECRET: Joi.string().required(),

  // Flutterwave Configuration
  FLUTTERWAVE_PUBLIC_KEY: Joi.string().required(),
  FLUTTERWAVE_SECRET_KEY: Joi.string().required(),
  FLUTTERWAVE_BASE_URL: Joi.string().uri().default('https://api.flutterwave.com/v3'),
  FLUTTERWAVE_ENCRYPTION_KEY: Joi.string().required(),

  // Transfer Configuration
  DEFAULT_TRANSFER_AMOUNT: Joi.number().positive().default(1000),
  TRANSFER_CURRENCY: Joi.string().valid('RWF', 'FRW').default('RWF'),
  TRANSFER_NARRATION: Joi.string().default('Automated transfer from Nhonga SMS confirmation'),

  // System Configuration
  PORT: Joi.number().port().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  MAX_RETRY_ATTEMPTS: Joi.number().integer().min(1).max(10).default(3),
  RETRY_DELAY_MS: Joi.number().integer().min(100).max(10000).default(2000),

  // Security Configuration
  WEBHOOK_ENDPOINT_SECRET: Joi.string().required(),
  API_RATE_LIMIT: Joi.number().integer().min(1).max(1000).default(100)
});

const { error, value: config } = configSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true
});

if (error) {
  throw new Error(`Configuration validation error: ${error.details.map(d => d.message).join(', ')}`);
}

export default {
  nhonga: {
    apiKey: config.NHONGA_API_KEY,
    secretKey: config.NHONGA_SECRET_KEY,
    baseUrl: config.NHONGA_BASE_URL,
    webhookSecret: config.NHONGA_WEBHOOK_SECRET
  },
  flutterwave: {
    publicKey: config.FLUTTERWAVE_PUBLIC_KEY,
    secretKey: config.FLUTTERWAVE_SECRET_KEY,
    baseUrl: config.FLUTTERWAVE_BASE_URL,
    encryptionKey: config.FLUTTERWAVE_ENCRYPTION_KEY
  },
  transfer: {
    defaultAmount: config.DEFAULT_TRANSFER_AMOUNT,
    currency: config.TRANSFER_CURRENCY,
    narration: config.TRANSFER_NARRATION
  },
  system: {
    port: config.PORT,
    nodeEnv: config.NODE_ENV,
    logLevel: config.LOG_LEVEL,
    maxRetryAttempts: config.MAX_RETRY_ATTEMPTS,
    retryDelayMs: config.RETRY_DELAY_MS
  },
  security: {
    webhookSecret: config.WEBHOOK_ENDPOINT_SECRET,
    apiRateLimit: config.API_RATE_LIMIT
  }
};