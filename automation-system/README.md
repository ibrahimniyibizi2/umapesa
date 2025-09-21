# Nhonga-Flutterwave Automation System

A robust automation system that monitors Nhonga API for SMS confirmations and automatically triggers money transfers via Flutterwave API to Rwandan phone numbers.

## 🚀 Features

- **Real-time SMS Monitoring**: Webhook-based integration with Nhonga API
- **Automated Money Transfers**: Seamless integration with Flutterwave API
- **Robust Error Handling**: Comprehensive retry logic and error management
- **Security**: Webhook signature verification and API key protection
- **Logging**: Detailed logging with multiple log levels and file rotation
- **Database Integration**: Optional MySQL logging for transaction history
- **Health Monitoring**: Built-in health checks and statistics
- **Cron Jobs**: Automated retry processing and system maintenance

## 📋 Prerequisites

- Node.js 18+ 
- MySQL database (optional, for transaction logging)
- Nhonga API credentials
- Flutterwave API credentials
- SSL certificate (for production webhook endpoints)

## 🛠 Installation

1. **Clone and Install Dependencies**:
   ```bash
   cd automation-system
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API credentials
   ```

3. **Database Setup** (Optional):
   ```bash
   # Create MySQL database named 'automation_logs'
   # The system will auto-create required tables
   ```

4. **Run Setup**:
   ```bash
   npm run setup
   ```

## ⚙️ Configuration

### Required Environment Variables

```env
# Nhonga API Configuration
NHONGA_API_KEY=your_actual_nhonga_api_key
NHONGA_SECRET_KEY=your_actual_nhonga_secret_key
NHONGA_WEBHOOK_SECRET=your_webhook_secret

# Flutterwave API Configuration
FLUTTERWAVE_SECRET_KEY=your_actual_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_actual_flutterwave_public_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key

# Security
WEBHOOK_ENDPOINT_SECRET=your_secure_webhook_secret
```

### Optional Configuration

```env
# Transfer Settings
DEFAULT_TRANSFER_AMOUNT=1000
TRANSFER_CURRENCY=RWF
TRANSFER_NARRATION=Automated transfer from Nhonga SMS confirmation

# System Settings
PORT=3001
LOG_LEVEL=info
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=2000
```

## 🚀 Usage

### Start the Automation Server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

### Test the System

```bash
# Run comprehensive tests
npm test
```

### Manual Testing

```bash
# Test manual trigger
curl -X POST http://localhost:3001/trigger/manual \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+250788123456",
    "amount": 1000,
    "transactionId": "MANUAL-TEST-001"
  }'

# Check health
curl http://localhost:3001/health

# Get statistics
curl http://localhost:3001/stats?timeframe=24h
```

## 🔄 Automation Workflow

1. **SMS Confirmation Received**: Nhonga sends webhook to `/webhook/nhonga`
2. **Data Validation**: System validates webhook signature and extracts phone number
3. **Phone Number Processing**: Formats and validates Rwandan phone number
4. **Transfer Calculation**: Calculates transfer amount based on configuration
5. **Flutterwave Transfer**: Initiates money transfer via Flutterwave API
6. **Logging**: Records transaction details and status
7. **Retry Logic**: Handles failed transfers with exponential backoff

## 📊 API Endpoints

### Webhook Endpoints

- `POST /webhook/nhonga` - Receives Nhonga SMS confirmations
- `POST /webhook/flutterwave` - Receives Flutterwave transfer status updates

### Management Endpoints

- `GET /health` - System health check and service status
- `GET /stats` - Automation statistics and metrics
- `POST /trigger/manual` - Manual trigger for testing
- `POST /retry/process` - Force retry queue processing
- `POST /maintenance/clear` - Clear processed transactions from memory

### Example Webhook Payload (Nhonga)

```json
{
  "transaction_id": "TXN123456789",
  "status": "completed",
  "amount": 1000,
  "currency": "MZN",
  "phone_number": "+250788123456",
  "sms_content": "Payment confirmed. Amount: 1000 MZN",
  "timestamp": "2024-01-25T10:30:00Z",
  "user_email": "user@example.com"
}
```

## 🔒 Security Features

- **Webhook Signature Verification**: HMAC-SHA256 signature validation
- **API Key Protection**: Secure storage and transmission of credentials
- **Rate Limiting**: Basic rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation of all inputs
- **Logging Sanitization**: Sensitive data is masked in logs
- **Error Handling**: Graceful error handling without exposing internals

## 📝 Logging

The system provides comprehensive logging with multiple levels:

- **Error Logs**: `logs/errors.log` - Critical errors and failures
- **Transaction Logs**: `logs/transactions.log` - All transaction activities
- **General Logs**: `logs/automation.log` - General system activities

### Log Levels

- `error`: Critical errors that need immediate attention
- `warn`: Warning conditions that should be monitored
- `info`: General information about system operations
- `debug`: Detailed debugging information

## 🔄 Retry Logic

The system implements intelligent retry logic for failed transfers:

- **Exponential Backoff**: Increasing delays between retry attempts
- **Maximum Attempts**: Configurable maximum retry attempts (default: 3)
- **Queue Management**: Failed transactions are queued for retry
- **Automatic Processing**: Cron job processes retry queue every 5 minutes

## 📈 Monitoring

### Health Checks

The system provides comprehensive health monitoring:

```bash
curl http://localhost:3001/health
```

Response includes:
- Service status (Nhonga, Flutterwave)
- System statistics
- Queue status
- Last successful operations

### Statistics

Get detailed automation statistics:

```bash
curl http://localhost:3001/stats?timeframe=24h
```

Available timeframes: `1h`, `24h`, `7d`, `30d`

## 🚨 Error Handling

### Common Error Scenarios

1. **Invalid Phone Number**: System validates and formats phone numbers
2. **API Failures**: Automatic retry with exponential backoff
3. **Network Issues**: Timeout handling and connection retry
4. **Invalid Webhook**: Signature verification prevents unauthorized access
5. **Insufficient Balance**: Flutterwave balance checks before transfers

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "details": {
    "code": "ERROR_CODE",
    "timestamp": "2024-01-25T10:30:00Z"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Data**:
   - Check Nhonga webhook configuration
   - Verify server is accessible from internet
   - Check firewall settings

2. **Flutterwave Transfers Failing**:
   - Verify API credentials
   - Check account balance
   - Validate phone number format

3. **Database Connection Issues**:
   - Check MySQL server status
   - Verify database credentials
   - Ensure database exists

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

## 📚 API Integration Details

### Nhonga API Integration

The system expects Nhonga webhooks with the following structure:
- Transaction ID for tracking
- Status confirmation (completed/success)
- Phone number extraction from SMS content
- Amount and currency information

### Flutterwave API Integration

Uses Flutterwave's Transfer API for Rwanda:
- Mobile Money Provider (MPS) for Rwanda
- Automatic phone number formatting
- Transfer status tracking
- Balance verification

## 🔄 Deployment

### Production Deployment

1. **Server Setup**:
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start with PM2
   pm2 start src/index.js --name "nhonga-flutterwave-automation"
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

2. **SSL Certificate**: Configure SSL for webhook endpoints
3. **Firewall**: Open port 3001 (or your configured port)
4. **Monitoring**: Set up monitoring for the PM2 process

### Environment-Specific Configuration

- **Development**: Use `.env` file with test credentials
- **Production**: Use environment variables or secure secret management
- **Testing**: Use mock APIs and test phone numbers

## 📞 Support

For issues and questions:
1. Check the logs in `logs/` directory
2. Review the health endpoint: `GET /health`
3. Verify API credentials and network connectivity
4. Check Nhonga and Flutterwave API documentation

## 🔄 Version History

- **v1.0.0**: Initial implementation with core automation features
- Webhook processing for Nhonga SMS confirmations
- Flutterwave money transfer integration
- Comprehensive logging and error handling
- Retry logic and queue management
- Health monitoring and statistics

---

**Note**: This system is designed for production use with proper error handling, security measures, and monitoring capabilities. Always test thoroughly in a development environment before deploying to production.