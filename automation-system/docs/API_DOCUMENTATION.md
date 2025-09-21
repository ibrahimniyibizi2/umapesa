# API Documentation - Nhonga-Flutterwave Automation System

## Overview

This document provides comprehensive API documentation for the Nhonga-Flutterwave automation system, including endpoint specifications, request/response formats, and integration examples.

## Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com
```

## Authentication

Most endpoints are public for webhook processing, but sensitive operations may require API key authentication in future versions.

## Endpoints

### 1. Health Check

**GET** `/health`

Returns the current health status of the automation system and connected services.

#### Response

```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "nhonga": {
      "status": "healthy",
      "error": null
    },
    "flutterwave": {
      "status": "healthy", 
      "error": null
    },
    "overall": "healthy"
  },
  "stats": {
    "processedTransactions": 45,
    "pendingRetries": 2,
    "retryQueue": []
  },
  "timestamp": "2024-01-25T10:30:00Z"
}
```

#### Status Codes
- `200`: System is healthy
- `500`: System health check failed

---

### 2. Nhonga Webhook

**POST** `/webhook/nhonga`

Receives SMS confirmation webhooks from Nhonga API and triggers automated money transfers.

#### Headers
- `Content-Type: application/json`
- `x-nhonga-signature: <hmac-sha256-signature>` (required for security)

#### Request Body

```json
{
  "transaction_id": "TXN123456789",
  "status": "completed",
  "amount": 1000,
  "currency": "MZN",
  "phone_number": "+250788123456",
  "sms_content": "Payment confirmed. Amount: 1000 MZN. Phone: +250788123456",
  "timestamp": "2024-01-25T10:30:00Z",
  "user_email": "user@example.com"
}
```

#### Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "automationId": "AUTO-1706178600000-ABC123"
}
```

**Error (400/401/500)**:
```json
{
  "success": false,
  "error": "Invalid signature"
}
```

#### Webhook Signature Verification

The webhook signature is calculated using HMAC-SHA256:

```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

---

### 3. Manual Trigger

**POST** `/trigger/manual`

Manually trigger the automation process for testing purposes.

#### Request Body

```json
{
  "phoneNumber": "+250788123456",
  "amount": 1000,
  "transactionId": "MANUAL-TEST-001"
}
```

#### Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Manual trigger processed",
  "result": {
    "success": true,
    "data": {
      "automationId": "AUTO-1706178600000-XYZ789",
      "nhongaTransactionId": "MANUAL-TEST-001",
      "flutterwaveTransferId": "FLW-TRANSFER-123",
      "phoneNumber": "+250788123456",
      "amount": 1000,
      "currency": "RWF"
    }
  }
}
```

**Error (400/500)**:
```json
{
  "success": false,
  "error": "Phone number and amount are required"
}
```

---

### 4. Statistics

**GET** `/stats`

Retrieve automation system statistics and metrics.

#### Query Parameters
- `timeframe` (optional): `1h`, `24h`, `7d`, `30d` (default: `24h`)

#### Response

```json
{
  "success": true,
  "data": {
    "automation": {
      "processedTransactions": 45,
      "pendingRetries": 2,
      "retryQueue": [
        {
          "automationId": "AUTO-123",
          "transactionId": "TXN789",
          "phoneNumber": "+250****56",
          "amount": 1000,
          "attempt": 2,
          "addedAt": "2024-01-25T10:00:00Z",
          "lastAttempt": "2024-01-25T10:15:00Z",
          "lastError": "Network timeout"
        }
      ]
    },
    "database": {
      "success": true,
      "data": {
        "timeframe": "24h",
        "totalTransactions": 45,
        "successfulTransactions": 43,
        "failedTransactions": 2,
        "pendingTransactions": 0,
        "totalAmount": 45000,
        "averageAmount": 1000,
        "successRate": "95.56",
        "firstTransaction": "2024-01-24T10:30:00Z",
        "lastTransaction": "2024-01-25T10:30:00Z"
      }
    },
    "timeframe": "24h"
  }
}
```

---

### 5. Retry Queue Management

**POST** `/retry/process`

Manually trigger processing of the retry queue.

#### Response

```json
{
  "success": true,
  "message": "Retry queue processed",
  "stats": {
    "processedTransactions": 45,
    "pendingRetries": 1,
    "retryQueue": []
  }
}
```

---

### 6. Maintenance

**POST** `/maintenance/clear`

Clear processed transactions from memory (for memory management).

#### Response

```json
{
  "success": true,
  "message": "Processed transactions cleared"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid webhook signature |
| 404 | Not Found - Endpoint doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - System error |

## Webhook Integration

### Setting up Nhonga Webhook

1. **Configure Webhook URL** in Nhonga dashboard:
   ```
   https://your-domain.com/webhook/nhonga
   ```

2. **Set Webhook Secret** in Nhonga dashboard (must match `NHONGA_WEBHOOK_SECRET` in your `.env`)

3. **Test Webhook** using the manual trigger endpoint

### Webhook Security

All webhooks must include a valid HMAC-SHA256 signature in the `x-nhonga-signature` header. The signature is calculated using:

```
HMAC-SHA256(webhook_secret, JSON.stringify(payload))
```

## Phone Number Formats

The system accepts and processes various Rwandan phone number formats:

### Accepted Formats
- `+250788123456` (International format)
- `250788123456` (Without + prefix)
- `0788123456` (Local format)
- `788123456` (Without country code)

### Output Format
All phone numbers are normalized to: `250788123456`

## Transfer Amount Calculation

The system calculates transfer amounts based on configurable logic:

### Default Logic
```javascript
function calculateTransferAmount(nhongaAmount) {
  if (nhongaAmount && nhongaAmount > 0) {
    // Transfer 10% of Nhonga amount, minimum 500 RWF
    const calculatedAmount = Math.max(nhongaAmount * 0.1, 500);
    return Math.min(calculatedAmount, 50000); // Cap at 50,000 RWF
  }
  return DEFAULT_TRANSFER_AMOUNT; // Fallback to configured default
}
```

### Customization
You can modify the calculation logic in `src/services/AutomationService.js` in the `calculateTransferAmount` method.

## Logging

### Log Files
- `logs/automation.log` - General system logs
- `logs/errors.log` - Error-specific logs
- `logs/transactions.log` - Transaction-specific logs

### Log Levels
- `error`: Critical errors requiring immediate attention
- `warn`: Warning conditions that should be monitored
- `info`: General operational information
- `debug`: Detailed debugging information

### Log Format
```
2024-01-25 10:30:00 [INFO]: Automation completed successfully | Meta: {"automationId":"AUTO-123","phoneNumber":"+250****56","amount":1000}
```

## Database Schema

### automation_logs Table

```sql
CREATE TABLE automation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  automation_id VARCHAR(50) NOT NULL UNIQUE,
  nhonga_transaction_id VARCHAR(100) NOT NULL,
  flutterwave_transfer_id VARCHAR(100) NULL,
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'RWF',
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  nhonga_data JSON NULL,
  flutterwave_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testing

### Unit Testing
```bash
npm test
```

### Manual Testing Examples

#### Test Valid Webhook
```bash
curl -X POST http://localhost:3001/webhook/nhonga \
  -H "Content-Type: application/json" \
  -H "x-nhonga-signature: calculated_signature_here" \
  -d '{
    "transaction_id": "TEST-123",
    "status": "completed",
    "amount": 1000,
    "currency": "MZN",
    "phone_number": "+250788123456",
    "sms_content": "Payment confirmed",
    "timestamp": "2024-01-25T10:30:00Z"
  }'
```

#### Test Manual Trigger
```bash
curl -X POST http://localhost:3001/trigger/manual \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+250788123456",
    "amount": 1000,
    "transactionId": "MANUAL-001"
  }'
```

## Performance Considerations

### Memory Management
- Processed transactions are cleared hourly via cron job
- Retry queue has maximum size limits
- Database connection pooling for efficiency

### Scalability
- Stateless design allows horizontal scaling
- Database logging for persistence across restarts
- Configurable retry limits and timeouts

## Security Best Practices

1. **Environment Variables**: Store all sensitive data in environment variables
2. **Webhook Signatures**: Always verify webhook signatures
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Input Validation**: Validate all inputs before processing
5. **Logging**: Sanitize sensitive data in logs
6. **HTTPS**: Use HTTPS in production for webhook endpoints
7. **Firewall**: Restrict access to necessary ports only

## Monitoring and Alerting

### Key Metrics to Monitor
- Success rate of automations
- Average processing time
- Retry queue size
- API response times
- Error frequency

### Recommended Alerts
- Success rate drops below 95%
- Retry queue size exceeds 10 items
- No successful transactions in 1 hour
- API health checks fail

---

This documentation provides a complete reference for integrating with and maintaining the Nhonga-Flutterwave automation system.