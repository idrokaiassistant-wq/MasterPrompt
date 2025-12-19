# Railway Environment Setup - Interactive Guide

## 🎯 Siz login qildingiz!

✅ **Railway CLI Status**: Logged in as Idrok (idrokaiassistant@gmail.com)

## 📋 Keyingi Qadamlar

### 1. Loyihani tanlash
```bash
# Agar loyiha allaqachon mavjud bo'lsa
railway init

# Yoki loyihani ko'rish
railway projects

# Mavjud loyihani tanlash
railway link
```

### 2. Environment o'zgaruvchilarini sozlash

#### Majburiy o'zgaruvchilar:
```bash
# Database (PostgreSQL)
railway variables set DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/promptmasterpro"

# Security kalitlari (32+ belgi)
railway variables set JWT_SECRET="your_very_long_secret_key_minimum_32_characters_long"
railway variables set ENCRYPTION_KEY="your_exact_32_character_encryption_key"
```

#### Monitoring uchun:
```bash
# Telegram bot token (BotFather dan)
railway variables set TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

# Monitoring chat ID (@userinfobot dan)
railway variables set MONITORING_CHAT_ID="-1001234567890"
```

### 3. Telegram Bot o'rnatish

#### BotFather orqali:
1. Telegramda @BotFather ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: "PromptMasterProMonitor")
4. Username kiriting (masalan: "@pmp_monitor_bot")
5. Token ni nusxalang va yuqoridagi buyruqda ishlating

#### Chat ID olish:
1. @userinfobot ga yozing
2. Chat ID ni nusxalang
3. Agar guruh bo'lsa, botni guruhga qo'shing va biror xabar yuboring

### 4. Monitoring tizimini test qilish

```bash
# Health check test
railway run node scripts/health-check.js

# Alert system test
railway run node scripts/alert.js test

# Barcha o'zgaruvchilarni ko'rish
railway variables
```

### 5. Servis holatini tekshirish

```bash
# Barcha servislar holati
railway status

# Log larni ko'rish
railway logs

# Alohida servis loglari
railway logs -s web
railway logs -s api-gateway
railway logs -s telegram-service
```

## 🔧 Tez Sozlash Skripti

Agar barcha o'zgaruvchilar tayyor bo'lsa, quyidagi skriptni ishga tushiring:

```bash
# PowerShell skriptini yaratish
$setupScript = @"
# Railway Environment Quick Setup
Write-Host "🚂 Railway Environment Setup" -ForegroundColor Blue

# Majburiy o'zgaruvchilar
railway variables set DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/promptmasterpro"
railway variables set JWT_SECRET="your_32_character_minimum_secret_key_here"
railway variables set ENCRYPTION_KEY="your_exact_32_character_key_here"

# Monitoring
railway variables set TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
railway variables set MONITORING_CHAT_ID="your_telegram_chat_id"

# Railway environment
railway variables set RAILWAY_ENVIRONMENT="production"
railway variables set MONITORING_ENABLED="true"

Write-Host "✅ Environment variables set!" -ForegroundColor Green
Write-Host "📊 Testing monitoring system..." -ForegroundColor Yellow

# Test monitoring
railway run node scripts/health-check.js
railway run node scripts/alert.js test

Write-Host "🎉 Setup completed!" -ForegroundColor Green
"@

# Skriptni saqlash
$setupScript | Out-File -FilePath "setup-railway-env.ps1" -Encoding UTF8
```

## 📊 Monitoring Natijalari

Muvaffaqiyatli sozlangandan so'ng:

✅ **Health Check**: Har 5 daqiqada avtomatik tekshiruv
✅ **Telegram Alerts**: Xatoliklar yuzaga kelganda darhol xabar
✅ **Webhook Alerts**: Qo'shimcha integratsiya imkoniyati
✅ **System Monitoring**: CPU, xotira, disk monitoringi
✅ **Service Monitoring**: Barcha microservislar holati

## 🚨 Xavfsizlik Eslatmalari

1. **Tokenlarni saqlang**: Tokenlarni GitHub ga push qilmang
2. **Strong passwords**: 32+ belgili kalitlar ishlating
3. **Regular rotation**: Kalitlarni muntazam yangilang
4. **Access control**: Faqat ishonchli odamlarga ruxsat bering

## 📞 Qo'llab-quvvatlash

Agar muammolar yuzaga kelsa:

1. **Log larni tekshiring**: `railway logs`
2. **Environment variables**: `railway variables`
3. **Service status**: `railway status`
4. **Telegram bot**: @BotFather orqali tokenni tekshiring
5. **Railway support**: Railway Discord yoki support ga murojaat qiling

---

**✨ Sizning monitoring tizimingiz tayyor! 24/7 avtomatik monitoring va xabarlar tizimi ishga tushdi.**