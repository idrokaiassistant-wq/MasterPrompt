# Railway Environment Variables - Complete Configuration

## 🎯 Quick Setup Commands

```bash
# Login to Railway
railway login

# Select your project
railway init

# Set essential variables
railway variables set DATABASE_URL="postgresql://user:password@host:port/database"
railway variables set JWT_SECRET="your_32_character_minimum_secret_key_here"
railway variables set ENCRYPTION_KEY="your_exact_32_character_key_here"
railway variables set TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
railway variables set MONITORING_CHAT_ID="your_telegram_chat_id"

# Enable monitoring
railway variables set RAILWAY_ENVIRONMENT="production"
railway variables set MONITORING_ENABLED="true"
```

## 📋 Complete Environment Variables List

### 🔴 Required Variables (Must Set)

```bash
# Database Connection
DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Security Keys
JWT_SECRET=minimum_32_characters_long_secret_key_for_jwt_tokens
ENCRYPTION_KEY=exactly_32_characters_for_encryption
```

### 🟡 Monitoring Variables (Recommended)

```bash
# Telegram Bot for Alerts
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
MONITORING_CHAT_ID=-1001234567890

# Webhook Alerts (Optional)
MONITORING_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts

# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_INTERVAL=300000  # 5 minutes in milliseconds
```

### 🟢 Railway Platform Variables (Auto-set)

```bash
# Railway Environment
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=prompt-master-pro
RAILWAY_PROJECT_ID=your_project_id
RAILWAY_SERVICE_ID=your_service_id
RAILWAY_REGION=us-east-1

# Service URLs (Auto-generated)
WEB_URL=https://web-production-1234.up.railway.app
API_GATEWAY_URL=https://api-gateway-production-5678.up.railway.app
TELEGRAM_SERVICE_URL=https://telegram-service-production-9012.up.railway.app
```

### 🔵 Service Configuration Variables

```bash
# API Gateway
API_GATEWAY_PORT=4000
API_GATEWAY_HOST=0.0.0.0

# Individual Service Ports
WEB_PORT=3000
PROMPT_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
TELEGRAM_SERVICE_PORT=3003
ANALYTICS_SERVICE_PORT=3004
```

### 🟣 Performance & Security Variables

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000      # 1 minute
RATE_LIMIT_MAX_REQUESTS=1000

# Performance Tuning
MAX_WORKER_THREADS=32
CACHE_TTL_SECONDS=3600         # 1 hour
CONNECTION_POOL_SIZE=100
QUERY_TIMEOUT_MS=30000         # 30 seconds

# Security
CORS_ORIGIN=https://promptmaster.pro,https://t.me
LOG_LEVEL=info
LOG_FORMAT=json
```

### ⚫ Database & Cache Variables

```bash
# Redis (Railway Redis)
REDIS_URL=redis://default:password@redis.railway.app:6379
REDIS_HOST=redis.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# ClickHouse Analytics
CLICKHOUSE_URL=https://clickhouse.railway.app:8123
CLICKHOUSE_HOST=clickhouse.railway.app
CLICKHOUSE_PORT=8123
```

## 🔧 Service-Specific Setup

### Web Service Variables
```bash
railway variables set -s web \
  PORT=3000 \
  NODE_ENV=production \
  DATABASE_URL="${DATABASE_URL}" \
  JWT_SECRET="${JWT_SECRET}" \
  ENCRYPTION_KEY="${ENCRYPTION_KEY}"
```

### API Gateway Service Variables
```bash
railway variables set -s api-gateway \
  PORT=4000 \
  API_GATEWAY_PORT=4000 \
  DATABASE_URL="${DATABASE_URL}" \
  REDIS_URL="${REDIS_URL}" \
  JWT_SECRET="${JWT_SECRET}" \
  ENCRYPTION_KEY="${ENCRYPTION_KEY}"
```

### Telegram Service Variables
```bash
railway variables set -s telegram-service \
  PORT=3003 \
  TELEGRAM_PORT=3003 \
  TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
  DATABASE_URL="${DATABASE_URL}" \
  REDIS_URL="${REDIS_URL}" \
  API_GATEWAY_URL="${API_GATEWAY_URL}"
```

## 🚀 Monitoring System Setup

### Step 1: Telegram Bot Setup
```bash
# 1. Message @BotFather on Telegram
# 2. Create new bot: /newbot
# 3. Copy the token and set it:
railway variables set TELEGRAM_BOT_TOKEN="your_bot_token"

# 4. Get your chat ID by messaging @userinfobot
# 5. Set monitoring chat ID:
railway variables set MONITORING_CHAT_ID="your_chat_id"
```

### Step 2: Test Monitoring
```bash
# Test health check
railway run node scripts/health-check.js

# Test alert system
railway run node scripts/alert.js test

# Start continuous monitoring
railway run node scripts/monitor.js start
```

### Step 3: Verify Setup
```bash
# Check all variables
railway variables

# Check service status
railway status

# Check logs
railway logs -s web
railway logs -s api-gateway
railway logs -s telegram-service
```

## 📊 Monitoring Dashboard URLs

After setup, your monitoring will be available at:
- **Health Check**: `https://your-domain.com/health`
- **API Docs**: `https://your-domain.com/docs`
- **Metrics**: `https://your-domain.com/metrics`

## 🔔 Alert Configuration

### Alert Thresholds (Default)
```bash
# System Resources
CPU_THRESHOLD=80        # 80% CPU usage
MEMORY_THRESHOLD=85   # 85% memory usage
DISK_THRESHOLD=90     # 90% disk usage
RESPONSE_TIME_THRESHOLD=2000  # 2 seconds

# Service Health
SERVICE_TIMEOUT=5000    # 5 seconds
MAX_CONSECUTIVE_FAILURES=3
```

### Alert Cooldown
```bash
# Prevent spam
ALERT_COOLDOWN=300000   # 5 minutes between same alerts
MAX_ALERTS_PER_HOUR=12  # Maximum 12 alerts per hour
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
```bash
# Check DATABASE_URL format
railway variables get DATABASE_URL

# Test connection
railway run psql $DATABASE_URL -c "SELECT version();"
```

2. **Telegram Bot Not Working**
```bash
# Verify bot token
railway run curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"

# Check webhook
railway run curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

3. **Redis Connection Error**
```bash
# Test Redis connection
railway run redis-cli -u $REDIS_URL ping

# Check Redis info
railway run redis-cli -u $REDIS_URL info
```

4. **Service Not Starting**
```bash
# Check service logs
railway logs -s api-gateway
railway logs -s telegram-service

# Check environment variables
railway variables -s api-gateway
railway variables -s telegram-service
```

## 📈 Performance Monitoring

### Key Metrics to Monitor
- Response time < 2 seconds
- CPU usage < 80%
- Memory usage < 85%
- Disk usage < 90%
- Service availability > 99%

### Log Locations
```bash
# Application logs
railway logs

# Monitoring logs
railway run tail -f logs/monitoring.log

# Health check logs
railway run tail -f logs/health-check.log

# Alert logs
railway run tail -f logs/alert.log
```

## 🔄 Auto-scaling Configuration

```bash
# Railway will auto-scale based on:
# - CPU usage > 70%
# - Memory usage > 75%
# - Request count > 1000/minute

# You can also manually configure:
RAILWAY_REPLICAS=3        # Number of instances
RAILWAY_CPU_LIMIT=1000    # CPU limit in millicores
RAILWAY_MEMORY_LIMIT=2048 # Memory limit in MB
```

## 🛡️ Security Best Practices

1. **Never commit secrets to Git**
2. **Use strong, unique passwords**
3. **Enable 2FA on Railway account**
4. **Regularly rotate API keys**
5. **Monitor for unusual activity**

## 📞 Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Verify all environment variables
3. Test individual services
4. Check monitoring alerts
5. Contact Railway support or community Discord

---

**Note**: After setting up environment variables, Railway will automatically restart your services. Monitor the deployment status in the Railway dashboard.