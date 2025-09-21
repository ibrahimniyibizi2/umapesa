import { AutomationServer } from './server.js';
import logger from './utils/logger.js';

async function main() {
  try {
    logger.info('Starting Nhonga-Flutterwave Automation System');
    
    const server = new AutomationServer();
    await server.start();
    
    logger.info('Automation system is running and ready to process webhooks');
  } catch (error) {
    logger.error('Failed to start automation system', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

main();