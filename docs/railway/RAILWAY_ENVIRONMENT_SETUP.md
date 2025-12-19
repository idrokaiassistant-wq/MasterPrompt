# Railway Environment Variables Setup Guide

## 🚀 Boshlash

Ushbu qo'llanma Railway platformasida PromptMasterPro monitoring tizimini sozlash uchun mo'ljallangan.

## 📋 Kerakli O'zgaruvchilar

### 1. Majburiy O'zgaruvchilar (Required)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
JWT_SECRET=your_very_long_secret_key_at_least_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key

# Railway Identifikatsiyasi
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=prompt-master-pro
RAILWAY_PROJECT_ID=your_project_id
RAILWAY_SERVICE_ID=your_service_id
```

### 2. Monitoring O'zgaruvchilari (Recommended)

```bash
# Telegram Monitoring
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
MONITORING_CHAT_ID=your_telegram_chat_id_for_alerts

# Webhook Alerts (ixtiyoriy)
MONITORING_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

### 3. Service URLs (Avtomatik sozlanadi)

```bash
# Service URLs
WEB_URL=https://your-web-service.railway.app
API_GATEWAY_URL=https://your-api-gateway.railway.app
TELEGRAM_SERVICE_URL=https://your-telegram-service.railway.app
```

### 4. Qo‘shimcha O‘zgaruvchilar

```bash
# Redis (Railway avtomatik beradi)
REDIS_URL=redis://default:password@host:port

# Performance
MAX_WORKER_THREADS=32
CACHE_TTL_SECONDS=3600
CONNECTION_POOL_SIZE=100
QUERY_TIMEOUT_MS=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## 🔧 Sozlash Qadamlari

### 1. Railway Dashboard ochish

1. [railway.app](https://railway.app) ga kiring
2. Loyihangizni tanlang
3. "Settings" ga o'ting
4. "Variables" bo'limini oching

### 2. Environment o‘zgaruvchilarini qo‘shish

#### Har bir servis uchun alohida sozlash:

**Web Service:**
```
PORT=3000
NODE_ENV=production
DATABASE_URL=${{DATABASE_URL}}
JWT_SECRET=${{JWT_SECRET}}
ENCRYPTION_KEY=${{ENCRYPTION_KEY}}
```

**API Gateway Service:**
```
PORT=4000
API_GATEWAY_PORT=4000
API_GATEWAY_HOST=0.0.0.0
DATABASE_URL=${{DATABASE_URL}}
REDIS_URL=${{REDIS_URL}}
JWT_SECRET=${{JWT_SECRET}}
ENCRYPTION_KEY=${{ENCRYPTION_KEY}}
```

**Telegram Service:**
```
PORT=3003
TELEGRAM_PORT=3003
TELEGRAM_BOT_TOKEN=${{TELEGRAM_BOT_TOKEN}}
DATABASE_URL=${{DATABASE_URL}}
REDIS_URL=${{REDIS_URL}}
API_GATEWAY_URL=${{API_GATEWAY_URL}}
```

### 3. Monitoring o‘rnatish

#### Telegram Bot Token olish:
1. Telegramda @BotFather ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini va username ni kiriting
4. Token ni nusxalang

#### Monitoring Chat ID olish:
1. @userinfobot ga yozing
2. Chat ID ni nusxalang
3. Yoki guruhga bot qo'shib, `/id` buyrug'ini yuboring

### 4. Railway CLI orqali sozlash

```bash
# Railway CLI o‘rnatish
npm install -g @railway/cli

# Login qilish
railway login

# Loyihani tanlash
railway init

# O‘zgaruvchilarni qo‘shish
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your_32_character_secret_key"
railway variables set ENCRYPTION_KEY="your_32_character_key"
railway variables set TELEGRAM_BOT_TOKEN="your_bot_token"
railway variables set MONITORING_CHAT_ID="your_chat_id"
railway variables set RAILWAY_ENVIRONMENT="production"
```

## 🎯 Monitoring Tizimini Ishga Tushirish

### 1. Health Check Test

```bash
# Railway console orqali
railway run node scripts/health-check.js

# Yoki servis ichidagi terminaldan
node scripts/health-check.js
```

### 2. Monitoringni boshlash

```bash
# Davomiy monitoring
railway run node scripts/monitor.js start

# Statistikani ko'rish
railway run node scripts/monitor.js stats
```

### 3. Alert test qilish

```bash
# Alert tizimini test qilish
railway run node scripts/alert.js test

# Telegram xabar testi
railway run node scripts/alert.js test
```

## 📊 Monitoring Natijalari

### Health Check Natijasi:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "healthy",
  "services": {
    "web": { "status": "healthy", "responseTime": 150 },
    "apiGateway": { "status": "healthy", "responseTime": 120 },
    "telegram": { "status": "healthy", "responseTime": 100 },
    "redis": { "status": "healthy", "ping": "PONG" }
  },
  "system": {
    "cpu": { "usage": 25.5, "status": "healthy" },
    "memory": { "usage": 60.2, "status": "healthy" },
    "disk": { "usage": 45, "status": "healthy" }
  }
}
```

### Telegram Alert Namunasi:
```
🚨 *Railway Alert: ERROR*

🖥️ *Service:* api-gateway
📄 *Message:* Service connection failed
⏰ *Time:* 1/15/2024, 10:30:00 AM

🔍 *Details:*
  • Response time: 5000ms
  • Status code: 503
  • Error: Connection timeout

🚂 *Railway Info:*
  • Environment: production
  • Service: api-gateway
  • Region: us-east-1
```

## 🔍 Tekshirish va Troubleshooting

### 1. Log larni ko'rish

```bash
# Monitoring loglari
railway logs -s monitoring

# Service loglari
railway logs -s web
railway logs -s api-gateway
railway logs -s telegram-service
```

### 2. Xizmat holatini tekshirish

```bash
# Barcha servislar holati
railway status

# Alohida servis
railway status -s web
```

### 3. Keng ko'rsatmalar

```bash
# Health check batafsil
railway run node scripts/health-check.js

# Monitoring statistikasi
railway run node scripts/monitor.js stats

# Alert statistikasi
railway run node scripts/alert.js stats
```

## ⚠️ Xavfsizlik Eslatmalari

1. **Tokenlarni saqlash** - Tokenlarni GitHub ga push qilmang
2. **Environment variables** - Maxfiy kalitlarni `.env` faylida saqlang
3. **Webhook URL** - Faqat ishonchli URL manzillarni ishlating
4. **Monitoring chat** - Shaxsiy guruh yoki kanal ishlating

## 🚀 Avtomatlashtirish

### Cron Jobs (Linux/Mac)

```bash
# Crontab ochish
crontab -e

# Railway monitoring uchun
*/5 * * * * cd /app && railway run node scripts/health-check.js
0 2 * * * cd /app && railway run node scripts/maintenance.js cleanup
0 3 * * 0 cd /app && railway run node scripts/maintenance.js run
```

### Windows Task Scheduler

PowerShell skripti yordamida Windows'da ham sozlash mumkin (docs/CRON_SETUP.md ga qarang).

## 📞 Qo'llab-quvvatlash

Agar muammolar yuzaga kelsa:

1. **Log larni tekshiring** - `railway logs` buyrug'i bilan
2. **Environment variables** - Barcha o'zgaruvchilar to'g'ri ekanligini tekshiring
3. **Telegram bot** - @BotFather orqali tokenni tekshiring
4. **Railway support** - Railway Discord yoki support ga murojaat qiling

---

**Eslatma:** Monitoring tizimi 24/7 ishlaydi va xatoliklar yuzaga kelganda darhol xabar beradi. Barcha sozlamalar to'g'ri ekanligiga ishonch hosil qiling.