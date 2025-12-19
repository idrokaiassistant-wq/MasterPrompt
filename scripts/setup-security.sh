#!/bin/bash

# Secure Configuration Setup Script for PromptMaster Pro
# This script helps set up secure configurations and generates strong secrets

set -e

echo "🔐 PromptMaster Pro Security Configuration Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate strong random strings
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Function to generate secure password
generate_password() {
    local length=${1:-16}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

echo -e "${YELLOW}⚠️  IMPORTANT: This script will help you create secure configurations."
echo -e "Please ensure you have:${NC}"
echo "1. OpenSSL installed"
echo "2. Access to your Telegram Bot (@BotFather)"
echo "3. Domain name for webhooks"
echo ""

read -p "Do you want to proceed with secure configuration setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Setup cancelled.${NC}"
    exit 1
fi

echo ""
echo "🔑 Generating secure secrets..."

# Generate secure secrets
JWT_SECRET=$(generate_secret 64)
ENCRYPTION_KEY=$(generate_secret 32)
DB_PASSWORD=$(generate_password 20)

# Create secure .env file
echo ""
echo "📝 Creating secure .env file..."
cat > .env.secure << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@localhost:5432/promptmasterpro
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ClickHouse Analytics
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123

# API Gateway
API_GATEWAY_PORT=4000
API_GATEWAY_HOST=0.0.0.0
API_GATEWAY_URL=http://localhost:4000

# Microservices URLs
PROMPT_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
TELEGRAM_SERVICE_URL=http://localhost:3003
ANALYTICS_SERVICE_URL=http://localhost:3004

# Telegram Bot Configuration
# ⚠️  IMPORTANT: Replace with your actual bot token from @BotFather
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
TELEGRAM_MINI_APP_URL=https://your-domain.com/mini-app

# AI Model API Keys
# ⚠️  IMPORTANT: Replace with your actual API keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Security Configuration (Auto-generated - DO NOT SHARE)
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGIN=https://promptmaster.pro,https://t.me

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Monitoring & Logging
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info
LOG_FORMAT=json

# Railway Pro Configuration
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_ID=your_service_id
RAILWAY_PROJECT_ID=your_project_id

# Multi-region deployment
PRIMARY_REGION=us-east-1
SECONDARY_REGION=eu-west-1
TERTIARY_REGION=ap-southeast-1

# Performance Tuning
MAX_WORKER_THREADS=32
CACHE_TTL_SECONDS=3600
CONNECTION_POOL_SIZE=100
QUERY_TIMEOUT_MS=30000

# SOC2 Compliance
AUDIT_LOG_RETENTION_DAYS=2555
DATA_RETENTION_DAYS=2555
ENCRYPTION_ALGORITHM=AES-256-GCM
EOF

echo -e "${GREEN}✅ Secure .env file created: .env.secure${NC}"
echo ""

# Create webhook configuration helper
echo "🌐 Webhook Configuration Helper"
echo "==============================="
cat > webhook-setup.md << 'EOF'
# Webhook Setup Instructions

## Telegram Bot Webhook Configuration

1. **Get your bot token from @BotFather**
   - Open Telegram
   - Search for @BotFather
   - Create new bot or use existing one
   - Copy the bot token

2. **Set up webhook URL**
   - Replace `your-domain.com` with your actual domain
   - Ensure HTTPS is enabled
   - Webhook URL format: `https://your-domain.com/api/telegram/webhook`

3. **Configure webhook**
   ```bash
   # Set webhook (replace with your values)
   curl -F "url=https://your-domain.com/api/telegram/webhook" \
        https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
   ```

4. **Verify webhook**
   ```bash
   # Check webhook info
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   ```

## Security Checklist

- [ ] Bot token is kept secret (not in code)
- [ ] Webhook uses HTTPS
- [ ] Domain has valid SSL certificate
- [ ] Webhook secret is configured
- [ ] Rate limiting is enabled

EOF

echo -e "${GREEN}✅ Webhook setup guide created: webhook-setup.md${NC}"
echo ""

# Security summary
echo "🔒 Security Summary"
echo "==================="
echo "Generated secure secrets:"
echo "- JWT Secret: ${JWT_SECRET:0:10}... (64 chars)"
echo "- Encryption Key: ${ENCRYPTION_KEY:0:10}... (32 chars)"
echo "- DB Password: ${DB_PASSWORD:0:10}... (20 chars)"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "1. Copy .env.secure to .env and update placeholder values"
echo "2. Get your Telegram bot token from @BotFather"
echo "3. Configure webhook URL with your domain"
echo "4. Add your AI service API keys"
echo "5. Set up monitoring (Sentry, etc.)"
echo "6. Read SECURITY.md for detailed guidelines"
echo ""
echo -e "${GREEN}✅ Security configuration setup complete!${NC}"
echo ""
echo -e "${RED}🔥 CRITICAL: Delete this script and any temporary files after use!${NC}"

# Make the script executable
chmod +x setup-security.sh 2>/dev/null || true