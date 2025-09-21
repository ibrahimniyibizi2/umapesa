# Deployment Guide - Nhonga-Flutterwave Automation System

## Overview

This guide provides step-by-step instructions for deploying the Nhonga-Flutterwave automation system in various environments.

## 🏗️ Architecture Overview

```
Internet → Load Balancer → Automation Server → Database
    ↓              ↓              ↓              ↓
Nhonga API    SSL/HTTPS     Node.js App    MySQL/PostgreSQL
Webhooks      Termination   (Express.js)   (Transaction Logs)
```

## 🚀 Production Deployment

### Prerequisites

- Ubuntu 20.04+ or CentOS 8+ server
- Node.js 18+ installed
- MySQL 8.0+ or PostgreSQL 13+
- Nginx (for reverse proxy)
- SSL certificate
- Domain name pointing to your server

### Step 1: Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### Step 2: Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/automation-system
sudo chown $USER:$USER /opt/automation-system

# Clone/copy your application
cd /opt/automation-system
# Copy your automation-system files here

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Set proper permissions
chmod 755 /opt/automation-system
chmod 644 /opt/automation-system/src/*
chmod 600 /opt/automation-system/.env
```

### Step 3: Database Setup

```bash
# Connect to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE automation_logs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'automation_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON automation_logs.* TO 'automation_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Environment Configuration

```bash
# Create production .env file
cat > /opt/automation-system/.env << EOF
# Production Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=automation_logs
DB_USER=automation_user
DB_PASSWORD=secure_password_here

# Nhonga API Configuration
NHONGA_API_KEY=your_production_nhonga_api_key
NHONGA_SECRET_KEY=your_production_nhonga_secret_key
NHONGA_BASE_URL=https://nhonga.net/api
NHONGA_WEBHOOK_SECRET=your_production_webhook_secret

# Flutterwave API Configuration
FLUTTERWAVE_PUBLIC_KEY=your_production_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_production_flutterwave_secret_key
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
FLUTTERWAVE_ENCRYPTION_KEY=your_production_encryption_key

# Transfer Configuration
DEFAULT_TRANSFER_AMOUNT=1000
TRANSFER_CURRENCY=RWF
TRANSFER_NARRATION=Automated transfer from Nhonga SMS confirmation

# Security Configuration
WEBHOOK_ENDPOINT_SECRET=your_secure_webhook_endpoint_secret
API_RATE_LIMIT=100

# System Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=2000
EOF

# Secure the environment file
chmod 600 /opt/automation-system/.env
```

### Step 5: PM2 Process Management

```bash
# Create PM2 ecosystem file
cat > /opt/automation-system/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nhonga-flutterwave-automation',
    script: 'src/index.js',
    cwd: '/opt/automation-system',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/opt/automation-system/logs/pm2-error.log',
    out_file: '/opt/automation-system/logs/pm2-out.log',
    log_file: '/opt/automation-system/logs/pm2-combined.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start application with PM2
cd /opt/automation-system
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### Step 6: Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/automation-system << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=webhook:10m rate=10r/m;
    
    # Webhook endpoint (with rate limiting)
    location /webhook/ {
        limit_req zone=webhook burst=5 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API endpoints
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/automation-system /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Step 8: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

### Step 9: Monitoring Setup

```bash
# Create monitoring script
sudo cat > /opt/automation-system/monitor.sh << EOF
#!/bin/bash
# Health check script for automation system

HEALTH_URL="http://localhost:3001/health"
LOG_FILE="/opt/automation-system/logs/monitor.log"

response=\$(curl -s -o /dev/null -w "%{http_code}" \$HEALTH_URL)

if [ \$response -eq 200 ]; then
    echo "\$(date): Health check passed" >> \$LOG_FILE
else
    echo "\$(date): Health check failed (HTTP \$response)" >> \$LOG_FILE
    # Restart application if health check fails
    pm2 restart nhonga-flutterwave-automation
    echo "\$(date): Application restarted due to health check failure" >> \$LOG_FILE
fi
EOF

# Make script executable
sudo chmod +x /opt/automation-system/monitor.sh

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/automation-system/monitor.sh") | crontab -
```

## 🔧 Development Deployment

### Local Development Setup

```bash
# Clone repository
git clone <your-repo-url>
cd automation-system

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your development credentials
nano .env

# Run setup
npm run setup

# Start in development mode
npm run dev
```

### Docker Deployment (Alternative)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY .env ./

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  automation:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
      - ./.env:/app/.env
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: automation_logs
      MYSQL_USER: automation_user
      MYSQL_PASSWORD: userpassword
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - automation
    restart: unless-stopped

volumes:
  mysql_data:
```

## 🔍 Testing Deployment

### Verify Installation

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs nhonga-flutterwave-automation

# Test health endpoint
curl https://your-domain.com/health

# Check Nginx status
sudo systemctl status nginx

# Check MySQL status
sudo systemctl status mysql
```

### Test Webhook Endpoint

```bash
# Test webhook with valid signature
curl -X POST https://your-domain.com/webhook/nhonga \
  -H "Content-Type: application/json" \
  -H "x-nhonga-signature: your_calculated_signature" \
  -d '{
    "transaction_id": "DEPLOY-TEST-001",
    "status": "completed",
    "amount": 100,
    "currency": "MZN",
    "phone_number": "+250788123456",
    "sms_content": "Test payment confirmed",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

## 📊 Monitoring and Maintenance

### Log Rotation

```bash
# Create logrotate configuration
sudo cat > /etc/logrotate.d/automation-system << EOF
/opt/automation-system/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 automation automation
    postrotate
        pm2 reload nhonga-flutterwave-automation
    endscript
}
EOF
```

### Backup Strategy

```bash
# Create backup script
cat > /opt/automation-system/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/automation-system"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \$BACKUP_DIR

# Backup database
mysqldump -u automation_user -p automation_logs > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup logs
tar -czf \$BACKUP_DIR/logs_backup_\$DATE.tar.gz logs/

# Backup configuration
cp .env \$BACKUP_DIR/env_backup_\$DATE

# Clean old backups (keep last 7 days)
find \$BACKUP_DIR -name "*backup*" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x /opt/automation-system/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/automation-system/backup.sh") | crontab -
```

### Performance Monitoring

```bash
# Create performance monitoring script
cat > /opt/automation-system/performance.sh << EOF
#!/bin/bash
LOG_FILE="/opt/automation-system/logs/performance.log"

# Get system metrics
CPU_USAGE=\$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | awk -F'%' '{print \$1}')
MEMORY_USAGE=\$(free | grep Mem | awk '{printf("%.2f", \$3/\$2 * 100.0)}')
DISK_USAGE=\$(df -h /opt/automation-system | awk 'NR==2{print \$5}' | sed 's/%//')

# Get application metrics
HEALTH_RESPONSE=\$(curl -s http://localhost:3001/health)
STATS_RESPONSE=\$(curl -s http://localhost:3001/stats)

echo "\$(date): CPU: \${CPU_USAGE}%, Memory: \${MEMORY_USAGE}%, Disk: \${DISK_USAGE}%" >> \$LOG_FILE

# Alert if resources are high
if (( \$(echo "\$CPU_USAGE > 80" | bc -l) )); then
    echo "\$(date): HIGH CPU USAGE: \${CPU_USAGE}%" >> \$LOG_FILE
fi

if (( \$(echo "\$MEMORY_USAGE > 80" | bc -l) )); then
    echo "\$(date): HIGH MEMORY USAGE: \${MEMORY_USAGE}%" >> \$LOG_FILE
fi
EOF

chmod +x /opt/automation-system/performance.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/automation-system/performance.sh") | crontab -
```

## 🔒 Security Hardening

### System Security

```bash
# Create dedicated user for the application
sudo useradd -r -s /bin/false automation
sudo chown -R automation:automation /opt/automation-system

# Update PM2 configuration to run as automation user
sudo -u automation pm2 start /opt/automation-system/ecosystem.config.js
sudo -u automation pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u automation --hp /home/automation
```

### Database Security

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database user with minimal privileges
mysql -u root -p << EOF
CREATE USER 'automation_readonly'@'localhost' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON automation_logs.* TO 'automation_readonly'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### Application Security

```bash
# Set proper file permissions
sudo chmod 750 /opt/automation-system
sudo chmod 640 /opt/automation-system/.env
sudo chmod 644 /opt/automation-system/src/*.js
sudo chmod 755 /opt/automation-system/logs

# Create security audit script
cat > /opt/automation-system/security-audit.sh << EOF
#!/bin/bash
echo "Security Audit Report - \$(date)"
echo "=================================="

# Check file permissions
echo "File Permissions:"
ls -la /opt/automation-system/.env
ls -la /opt/automation-system/src/

# Check for sensitive data in logs
echo "Checking for sensitive data in logs:"
grep -i "password\|secret\|key" /opt/automation-system/logs/*.log | head -5

# Check open ports
echo "Open ports:"
netstat -tlnp | grep :3001

echo "Audit completed"
EOF

chmod +x /opt/automation-system/security-audit.sh
```

## 📈 Scaling Considerations

### Horizontal Scaling

For high-volume deployments, consider:

1. **Load Balancer**: Use Nginx or HAProxy to distribute traffic
2. **Multiple Instances**: Run multiple PM2 instances
3. **Database Clustering**: Use MySQL cluster or read replicas
4. **Redis Cache**: Add Redis for caching and session management

### Vertical Scaling

```bash
# Update PM2 configuration for more resources
cat > /opt/automation-system/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nhonga-flutterwave-automation',
    script: 'src/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Find process using port 3001
   sudo lsof -i :3001
   
   # Kill process if needed
   sudo kill -9 <PID>
   ```

2. **Database Connection Issues**:
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   
   # Test database connection
   mysql -u automation_user -p automation_logs
   ```

3. **PM2 Process Issues**:
   ```bash
   # Check PM2 logs
   pm2 logs nhonga-flutterwave-automation
   
   # Restart application
   pm2 restart nhonga-flutterwave-automation
   
   # Reset PM2
   pm2 delete all
   pm2 start ecosystem.config.js
   ```

4. **Nginx Issues**:
   ```bash
   # Check Nginx configuration
   sudo nginx -t
   
   # Check Nginx logs
   sudo tail -f /var/log/nginx/error.log
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

### Debug Mode

Enable debug logging temporarily:

```bash
# Update .env
echo "LOG_LEVEL=debug" >> /opt/automation-system/.env

# Restart application
pm2 restart nhonga-flutterwave-automation

# Monitor debug logs
tail -f /opt/automation-system/logs/automation.log
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Server meets minimum requirements
- [ ] Domain name configured and pointing to server
- [ ] SSL certificate obtained and installed
- [ ] Database server installed and secured
- [ ] All API credentials obtained and validated

### Deployment

- [ ] Application files copied to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables configured
- [ ] Database created and tables initialized
- [ ] PM2 process manager configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed and tested

### Post-Deployment

- [ ] Health endpoint responding correctly
- [ ] Webhook endpoint accessible from internet
- [ ] Database logging working
- [ ] PM2 auto-restart configured
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured
- [ ] Security audit completed

### Testing

- [ ] Manual trigger test successful
- [ ] Webhook signature verification working
- [ ] Rate limiting functional
- [ ] Error handling working correctly
- [ ] Retry logic functioning
- [ ] Statistics endpoint working

## 🔄 Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review error logs
   - Check system performance metrics
   - Verify backup integrity
   - Update dependencies if needed

2. **Monthly**:
   - Security audit
   - Performance optimization review
   - Log cleanup (if not automated)
   - SSL certificate renewal check

3. **Quarterly**:
   - Full system backup
   - Disaster recovery test
   - Security penetration testing
   - Performance benchmarking

### Update Procedure

```bash
# 1. Backup current version
cp -r /opt/automation-system /opt/automation-system-backup-$(date +%Y%m%d)

# 2. Stop application
pm2 stop nhonga-flutterwave-automation

# 3. Update code
# Copy new files to /opt/automation-system

# 4. Install new dependencies
cd /opt/automation-system
npm install --production

# 5. Run database migrations if needed
npm run setup

# 6. Start application
pm2 start nhonga-flutterwave-automation

# 7. Verify deployment
curl https://your-domain.com/health
```

This deployment guide ensures a robust, secure, and scalable production deployment of your Nhonga-Flutterwave automation system.