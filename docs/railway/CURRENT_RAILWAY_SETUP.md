# Railway Environment Setup - Current Project

## 🎯 Sizning Holatingiz:

✅ **Project**: Prompt Master Pro  
✅ **Environment**: production  
✅ **Service**: api-gateway  
✅ **Status**: Logged in as Idrok

## 🔧 Hozirgi Servislar:

Sizning loyihangizda quyidagi servislar mavjud:
- `web` - Frontend (React/Next.js)
- `api-gateway` - API Gateway (Fastify)
- `telegram-service` - Telegram Bot
- `prompt-service` - Prompt Engine
- `user-service` - User Management
- `analytics-service` - Analytics

## 📋 Environment O'zgaruvchilari Sozlash

### 1. Umumiy O'zgaruvchilar (Hamma Servislar Uchun)

```bash
# Majburiy o'zgaruvchilar
railway variables set DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/promptmasterpro"
railway variables set JWT_SECRET="your_32_character_minimum_secret_key_here_minimum_32_chars"
railway variables set ENCRYPTION_KEY="your_exact_32_character_encryption_key"

# Railway muhit
railway variables set RAILWAY_ENVIRONMENT="production"
railway variables set MONITORING_ENABLED="true"
```

### 2. Monitoring Tizimi Uchun

#### Telegram Bot Token Olish:
1. Telegramda @BotFather ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting: "PromptMasterProMonitor"
4. Username kiriting: "@pmp_monitor_bot"
5. Token ni nusxalang

```bash
# Telegram monitoring
railway variables set TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

# Chat ID olish uchun @userinfobot ga yozing
railway variables set MONITORING_CHAT_ID="-1001234567890"
```

### 3. Servis-Specific O'zgaruvchilar

#### API Gateway Service:
```bash
# API Gateway uchun maxsus
railway variables set -s api-gateway API_GATEWAY_PORT="4000"
railway variables set -s api-gateway API_GATEWAY_HOST="0.0.0.0"
railway variables set -s api-gateway REDIS_URL="redis://default:password@redis.railway.app:6379"
```

#### Telegram Service:
```bash
# Telegram service uchun
railway variables set -s telegram-service TELEGRAM_PORT="3003"
railway variables set -s telegram-service TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
railway variables set -s telegram-service TELEGRAM_WEBHOOK_URL="https://telegram-service-production-XXXX.up.railway.app/webhook"
```

#### Web Service:
```bash
# Web frontend uchun
railway variables set -s web PORT="3000"
railway variables set -s web NEXT_PUBLIC_API_URL="https://api-gateway-production-XXXX.up.railway.app"
```

## 🚀 Monitoring Tizimini Ishga Tushirish

### 1. Health Check Test:
```bash
# Umumiy health check
railway run node scripts/health-check.js

# API Gateway health check
railway run -s api-gateway node scripts/health-check.js
```

### 2. Alert System Test:
```bash
# Alert tizimini test qilish
railway run node scripts/alert.js test

# Telegram bot testi
railway run node scripts/alert.js test
```

### 3. Monitoringni boshlash:
```bash
# Davomiy monitoring
railway run node scripts/monitor.js start

# Monitoring statistikasi
railway run node scripts/monitor.js stats
```

## 📊 Servis Holatini Ko'rish

```bash
# Barcha servislar holati
railway status

# Alohida servislar
railway status -s web
railway status -s api-gateway
railway status -s telegram-service

# Loglar
railway logs
railway logs -s web
railway logs -s api-gateway
railway logs -s telegram-service
```

## 🔍 Tekshirish va Test Qilish

### 1. Environment Variables:
```bash
# Barcha o'zgaruvchilar
railway variables

# Servis-specific o'zgaruvchilar
railway variables -s web
railway variables -s api-gateway
railway variables -s telegram-service
```

### 2. Monitoring Test:
```bash
# Tizim monitoringi
railway run node scripts/test.js quick

# Barcha testlar
railway run node scripts/test.js run
```

### 3. Telegram Bot Test:
```bash
# Bot info
railway run curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"

# Webhook status
railway run curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

## ⚠️ Muhim Eslatmalar

1. **Tokenlarni saqlang**: Tokenlarni GitHub ga push qilmang
2. **32 belgili kalitlar**: JWT_SECRET va ENCRYPTION_KEY kamida 32 belgi bo'lishi kerak
3. **Servis nomlari**: Railway'dagi servis nomlar bilan moslashtiring
4. **URL manzillar**: O'zingizning Railway URL manzillaringizni ishlating

## 🎯 Keyingi Qadamlar

1. **Environment o'zgaruvchilarini sozlash** - Yuqoridagi buyruqlarni bajaring
2. **Monitoring tizimini test qilish** - Health check va alert testlar
3. **Servislarni qayta ishga tushirish** - Yangi sozlamalar kuchga kirishi uchun
4. **Cron joblarni sozlash** - Avtomatik monitoring uchun
5. **Deploymentni yakunlash** - Barcha servislar ishga tushgach

## 📞 Qo'llab-quvvatlash

Agar muammolar yuzaga kelsa:
1. `railway logs` bilan loglarni tekshiring
2. `railway status` bilan servis holatini ko'ring
3. `railway variables` bilan o'zgaruvchilarni tekshiring
4. Telegram bot token va chat ID ni tekshiring
5. Railway support yoki Discord ga murojaat qiling

---

**✅ Sizning Prompt Master Pro monitoring tizimi tayyor! Barcha servislar monitoringi va avtomatik xabarlar tizimi ishga tushadi.**