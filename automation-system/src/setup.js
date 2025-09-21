import fs from 'fs';
import path from 'path';
import { DatabaseService } from './services/DatabaseService.js';
import logger from './utils/logger.js';

/**
 * Setup script for the automation system
 */
class SetupManager {
  constructor() {
    this.requiredDirs = ['logs', 'config', 'data'];
    this.requiredFiles = ['.env'];
  }

  /**
   * Run complete setup
   */
  async runSetup() {
    console.log('🚀 Setting up Nhonga-Flutterwave Automation System\n');

    try {
      // Step 1: Create required directories
      this.createDirectories();
      
      // Step 2: Check environment configuration
      this.checkEnvironmentConfig();
      
      // Step 3: Setup database
      await this.setupDatabase();
      
      // Step 4: Validate API credentials
      await this.validateAPICredentials();
      
      console.log('\n✅ Setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Start the automation server: npm start');
      console.log('2. Test the system: npm test');
      console.log('3. Monitor logs in the logs/ directory');
      console.log('4. Configure your Nhonga webhook to point to: http://your-server:3001/webhook/nhonga');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create required directories
   */
  createDirectories() {
    console.log('📁 Creating required directories...');
    
    this.requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created directory: ${dir}`);
      } else {
        console.log(`   ℹ️  Directory already exists: ${dir}`);
      }
    });
  }

  /**
   * Check environment configuration
   */
  checkEnvironmentConfig() {
    console.log('\n🔧 Checking environment configuration...');
    
    if (!fs.existsSync('.env')) {
      console.log('   ⚠️  .env file not found, copying from .env.example');
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('   ✅ .env file created from template');
        console.log('   ⚠️  Please update .env with your actual API credentials');
      } else {
        throw new Error('.env.example file not found');
      }
    } else {
      console.log('   ✅ .env file exists');
    }

    // Check for required environment variables
    const requiredVars = [
      'NHONGA_API_KEY',
      'NHONGA_SECRET_KEY',
      'FLUTTERWAVE_SECRET_KEY',
      'WEBHOOK_ENDPOINT_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('   ⚠️  Missing required environment variables:');
      missingVars.forEach(varName => {
        console.log(`      - ${varName}`);
      });
      console.log('   Please update your .env file with the missing variables');
    } else {
      console.log('   ✅ All required environment variables are set');
    }
  }

  /**
   * Setup database
   */
  async setupDatabase() {
    console.log('\n🗄️  Setting up database...');
    
    try {
      const dbService = new DatabaseService();
      const success = await dbService.createTables();
      
      if (success) {
        console.log('   ✅ Database tables created/verified');
      } else {
        console.log('   ⚠️  Database setup failed (continuing without database logging)');
      }
      
      await dbService.close();
    } catch (error) {
      console.log('   ⚠️  Database setup error:', error.message);
      console.log('   ℹ️  The system will continue without database logging');
    }
  }

  /**
   * Validate API credentials (basic check)
   */
  async validateAPICredentials() {
    console.log('\n🔑 Validating API credentials...');
    
    // Check if credentials look valid (basic format check)
    const nhongaKey = process.env.NHONGA_API_KEY;
    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (nhongaKey && nhongaKey.length > 10 && !nhongaKey.includes('your_')) {
      console.log('   ✅ Nhonga API key format looks valid');
    } else {
      console.log('   ⚠️  Nhonga API key appears to be placeholder or invalid');
    }
    
    if (flutterwaveKey && flutterwaveKey.length > 10 && !flutterwaveKey.includes('your_')) {
      console.log('   ✅ Flutterwave API key format looks valid');
    } else {
      console.log('   ⚠️  Flutterwave API key appears to be placeholder or invalid');
    }
    
    console.log('   ℹ️  For full API validation, start the server and check /health endpoint');
  }

  /**
   * Generate sample webhook data for testing
   */
  generateSampleWebhookData() {
    return {
      transaction_id: `SAMPLE-${Date.now()}`,
      status: 'completed',
      amount: 1000,
      currency: 'MZN',
      phone_number: '+250788123456',
      sms_content: 'Payment confirmed. Amount: 1000 MZN. Phone: +250788123456',
      timestamp: new Date().toISOString(),
      user_email: 'test@example.com'
    };
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setupManager = new SetupManager();
  setupManager.runSetup();
}

export { SetupManager };