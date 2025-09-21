import axios from 'axios';
import config from './config/index.js';
import logger from './utils/logger.js';

/**
 * Test suite for the automation system
 */
class AutomationTester {
  constructor() {
    this.baseUrl = `http://localhost:${config.system.port}`;
  }

  /**
   * Test health endpoint
   */
  async testHealth() {
    try {
      console.log('🔍 Testing health endpoint...');
      const response = await axios.get(`${this.baseUrl}/health`);
      
      if (response.data.success) {
        console.log('✅ Health check passed');
        console.log('📊 System status:', response.data.status);
        console.log('📈 Stats:', response.data.stats);
      } else {
        console.log('❌ Health check failed');
      }
      
      return response.data.success;
    } catch (error) {
      console.log('❌ Health endpoint error:', error.message);
      return false;
    }
  }

  /**
   * Test manual trigger with valid data
   */
  async testManualTrigger() {
    try {
      console.log('\n🔍 Testing manual trigger...');
      
      const testData = {
        phoneNumber: '+250788123456', // Test Rwandan number
        amount: 1000,
        transactionId: `TEST-${Date.now()}`
      };

      const response = await axios.post(`${this.baseUrl}/trigger/manual`, testData);
      
      if (response.data.success) {
        console.log('✅ Manual trigger successful');
        console.log('📋 Result:', response.data.result);
      } else {
        console.log('❌ Manual trigger failed:', response.data.error);
      }
      
      return response.data.success;
    } catch (error) {
      console.log('❌ Manual trigger error:', error.message);
      if (error.response?.data) {
        console.log('📋 Error details:', error.response.data);
      }
      return false;
    }
  }

  /**
   * Test webhook endpoint with mock Nhonga data
   */
  async testWebhook() {
    try {
      console.log('\n🔍 Testing webhook endpoint...');
      
      const mockWebhookData = {
        transaction_id: `WEBHOOK-TEST-${Date.now()}`,
        status: 'completed',
        amount: 500,
        currency: 'MZN',
        phone_number: '+250788987654',
        sms_content: 'Payment confirmed. Amount: 500 MZN. Phone: +250788987654',
        timestamp: new Date().toISOString(),
        user_email: 'test@example.com'
      };

      // Generate test signature
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', config.security.webhookSecret)
        .update(JSON.stringify(mockWebhookData))
        .digest('hex');

      const response = await axios.post(`${this.baseUrl}/webhook/nhonga`, mockWebhookData, {
        headers: {
          'x-nhonga-signature': signature
        }
      });
      
      if (response.data.success) {
        console.log('✅ Webhook test successful');
        console.log('🔄 Automation ID:', response.data.automationId);
      } else {
        console.log('❌ Webhook test failed:', response.data.error);
      }
      
      return response.data.success;
    } catch (error) {
      console.log('❌ Webhook test error:', error.message);
      if (error.response?.data) {
        console.log('📋 Error details:', error.response.data);
      }
      return false;
    }
  }

  /**
   * Test statistics endpoint
   */
  async testStats() {
    try {
      console.log('\n🔍 Testing statistics endpoint...');
      
      const response = await axios.get(`${this.baseUrl}/stats?timeframe=24h`);
      
      if (response.data.success) {
        console.log('✅ Statistics endpoint working');
        console.log('📊 Automation stats:', response.data.data.automation);
        if (response.data.data.database.success) {
          console.log('📈 Database stats:', response.data.data.database.data);
        }
      } else {
        console.log('❌ Statistics test failed');
      }
      
      return response.data.success;
    } catch (error) {
      console.log('❌ Statistics test error:', error.message);
      return false;
    }
  }

  /**
   * Test invalid webhook (security test)
   */
  async testInvalidWebhook() {
    try {
      console.log('\n🔍 Testing webhook security...');
      
      const mockData = {
        transaction_id: 'INVALID-TEST',
        status: 'completed'
      };

      // Send without signature
      const response = await axios.post(`${this.baseUrl}/webhook/nhonga`, mockData);
      
      // This should fail
      console.log('❌ Security test failed - webhook accepted without signature');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Security test passed - webhook rejected without valid signature');
        return true;
      } else {
        console.log('❌ Unexpected security test error:', error.message);
        return false;
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Automation System Tests\n');
    
    const tests = [
      { name: 'Health Check', fn: () => this.testHealth() },
      { name: 'Manual Trigger', fn: () => this.testManualTrigger() },
      { name: 'Webhook Processing', fn: () => this.testWebhook() },
      { name: 'Statistics', fn: () => this.testStats() },
      { name: 'Webhook Security', fn: () => this.testInvalidWebhook() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.log(`❌ Test "${test.name}" threw an error:`, error.message);
        failed++;
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📋 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! The automation system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the logs and configuration.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AutomationTester();
  
  // Wait for server to start
  setTimeout(async () => {
    await tester.runAllTests();
    process.exit(0);
  }, 3000);
}

export { AutomationTester };