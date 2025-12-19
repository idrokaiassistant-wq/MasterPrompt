# Get Telegram Chat ID for Railway Monitoring

## 🔍 Chat ID Aniqlash

### 1. Shaxsiy Chat ID (O'zingiz uchun)

1. **Telegramda @userinfobot ga yozing**
2. **Sizning chat ID ingizni nusxalang**
3. **Odatda format: `123456789`**

### 2. Guruh Chat ID (Monitoring guruh uchun)

1. **Telegram guruh yarating** (masalan: "PromptMasterPro Monitoring")
2. **Botni guruhga qo'shing:**
   - Guruhga `@pmp_monitor_bot` ni qo'shing
   - Botga admin huquqlari bering
3. **Guruhga test xabar yuboring:**
   ```
   /test
   ```
4. **@userinfobot ga yozing va guruhdan xabar yuboring**
5. **Guruh chat ID ni nusxalang**
6. **Format: `-1001234567890` (minus bilan boshlanadi)**

## 🔧 Chat ID Formatlari

### Shaxsiy Chat
```
123456789
```

### Guruh Chat
```
-1001234567890
```

### Kanal Chat
```
-1001234567890
```

## 📱 Chat ID Tekshirish

### 1. Shaxsiy Chat Test

```bash
# Shaxsiy chat ID bilan test
YOUR_CHAT_ID="123456789"
BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "'${YOUR_CHAT_ID}'",
    "text": "🎉 PromptMasterPro monitoring test message!\n\nBot is working correctly.\n\nTime: '"$(date)"'",
    "parse_mode": "Markdown"
  }'
```

### 2. Guruh Chat Test

```bash
# Guruh chat ID bilan test
GROUP_CHAT_ID="-1001234567890"
BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "'${GROUP_CHAT_ID}'",
    "text": "🎉 PromptMasterPro monitoring test message!\n\nGroup monitoring is working correctly.\n\nTime: '"$(date)"'",
    "parse_mode": "Markdown"
  }'
```

## 🔧 Railway'ga Qo‘shish

### Chat ID Railway Variable

```bash
# Shaxsiy chat uchun
railway variables --set "MONITORING_CHAT_ID=123456789"

# Yoki guruh chat uchun
railway variables --set "MONITORING_CHAT_ID=-1001234567890"
```

### Monitoring Enable Qilish

```bash
railway variables --set "MONITORING_ENABLED=true"
railway variables --set "TELEGRAM_MONITORING_ENABLED=true"
```

## ✅ Monitoring Test Qilish

### 1. Alert System Test

```bash
# Alert tizimini test qilish
railway run node scripts/alert.js test
```

### 2. Health Check Test

```bash
# Health check va alert testi
railway run node scripts/health-check.js
```

### 3. Monitoring Start

```bash
# Davomiy monitoringni boshlash
railway run node scripts/monitor.js start
```

## 📊 Monitoring Xabar Namunasi

### Health Alert
```
🚨 *Railway Alert: ERROR*

🖥️ *Service:* api-gateway
📄 *Message:* Service connection failed
⏰ *Time:* 15/01/2024, 15:30:00

🔍 *Details:*
  • Response time: 5000ms
  • Status code: 503
  • Error: Connection timeout

🚂 *Railway Info:*
  • Environment: production
  • Service: api-gateway
  • Region: us-east-1
```

### System Resource Alert
```
⚠️ *Railway Alert: WARNING*

🖥️ *Service:* system
📄 *Message:* High memory usage detected
⏰ *Time:* 15/01/2024, 16:00:00

📊 *Resource Details:*
  • Memory usage: 87%
  • CPU usage: 45%
  • Disk usage: 32%

🔧 *Action Required:*
Consider scaling up resources
```

## 🎯 Keyingi Qadamlar

1. **Chat ID ni aniqlang** (@userinfobot yordamida)
2. **Railway'ga qo'shing** (yuqoridagi buyruqlar bilan)
3. **Test qiling** (alert va monitoring testlari)
4. **Monitoringni boshlang** (davomiy monitoring)

## 📞 Qo'llab-quvvatlash

Agar muammolar yuzaga kelsa:

1. **Chat ID ni tekshiring** - Format to'g'ri ekanligiga ishonch hosil qiling
2. **Bot token ni tekshiring** - @BotFather orqali
3. **Bot guruhga qo'shilganmi?** - Admin huquqlari borligiga ishonch hosil qiling
4. **Network ulanishini tekshiring** - Internet va Telegram API
5. **Railway loglarini tekshiring** - `railway logs`

---

**✅ Chat ID ni olganingizdan so'ng, uni Railway'ga qo'shing va monitoring tizimi ishga tushadi!**