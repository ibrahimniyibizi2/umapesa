import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Health check passed');
      console.log('📊 Services:', data.services);
      console.log('📈 Queue stats:', data.queue);
    } else {
      console.log('❌ Health check failed');
    }
    return data.success;
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testManualTrigger() {
  console.log('\n🔍 Testing manual trigger...');
  try {
    const testData = {
      phoneNumber: '+250788123456',
      amount: 1000,
      transactionId: `TEST-${Date.now()}`
    };

    const response = await fetch(`${BASE_URL}/trigger/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Manual trigger successful');
      console.log('📋 Transaction ID:', data.transactionId);
    } else {
      console.log('❌ Manual trigger failed:', data.error);
    }
    return data.success;
  } catch (error) {
    console.log('❌ Manual trigger error:', error.message);
    return false;
  }
}

async function testQueueStats() {
  console.log('\n🔍 Testing queue statistics...');
  try {
    const response = await fetch(`${BASE_URL}/queue/stats`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Queue stats retrieved');
      console.log('📊 Stats:', data.stats);
    } else {
      console.log('❌ Queue stats failed');
    }
    return data.success;
  } catch (error) {
    console.log('❌ Queue stats error:', error.message);
    return false;
  }
}

async function testWebhookSecurity() {
  console.log('\n🔍 Testing webhook security...');
  try {
    const mockData = {
      transaction_id: 'SECURITY-TEST',
      status: 'completed'
    };

    // Test without secret key (should fail)
    const response = await fetch(`${BASE_URL}/webhook/nhonga`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });

    if (response.status === 400) {
      console.log('✅ Security test passed - webhook rejected without proper authentication');
      return true;
    } else {
      console.log('❌ Security test failed - webhook accepted without authentication');
      return false;
    }
  } catch (error) {
    console.log('❌ Security test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Automation System Tests\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Manual Trigger', fn: testManualTrigger },
    { name: 'Queue Statistics', fn: testQueueStats },
    { name: 'Webhook Security', fn: testWebhookSecurity }
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

  console.log('\n📋 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! The automation system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
  }
}

// Wait for server to start, then run tests
setTimeout(runAllTests, 2000);