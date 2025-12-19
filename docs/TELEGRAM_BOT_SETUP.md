# Telegram Bot Setup Guide for Railway Monitoring

## 🤖 Telegram Bot Yaratish

### 1. @BotFather bilan Bot Yaratish

1. **Telegram oching** va @BotFather ga yozing
2. **Quyidagi buyruqlarni ketma-ket bajaring:**

```
/newbot
```

3. **Bot nomini kiriting** (masalan):
```
PromptMasterPro Monitor
```

4. **Username kiriting** (unique bo'lishi kerak, @ bilan):
```
@pmp_monitor_bot
```

5. **Token ni nusxalang** (sizga beriladi):
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Bot Sozlamalari

Bot yaratilgandan so'ng quyidagi buyruqlarni bajaring:

```
/setdescription
```
Desc: `PromptMasterPro monitoring bot. Server holatini kuzatish va xabarlar uchun.`

```
/setabouttext
```
About: `Railway server monitoring bot`

```
/setuserpic
```
Bot uchun monitoring ikonka yuklang (ixtiyoriy)

### 3. Chat ID Olish

1. **@userinfobot ga yozing**
2. **Sizning chat ID ingizni nusxalang** (masalan: `123456789`)
3. **Agar guruhda monitoring kerak bo'lsa:**
   - Botni guruhga qo'shing
   - Admin qiling
   - Guruhga test xabar yuboring
   - @userinfobot dan guruh ID ni oling

## 🔧 Railway Environment Sozlash

### Bot Token Qo‘shish

```bash
railway variables --set "TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### Chat ID Qo‘shish

```bash
railway variables --set "MONITORING_CHAT_ID=123456789"
```

### Monitoring Enable Qilish

```bash
railway variables --set "MONITORING_ENABLED=true"
railway variables --set "TELEGRAM_MONITORING_ENABLED=true"
```

## ✅ Botni Test Qilish

### 1. Bot Tekshirish

```bash
# Bot info tekshirish
railway run curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"

# Webhook status
railway run curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

### 2. Alert Test Qilish

```bash
# Alert tizimini test qilish
railway run node scripts/alert.js test

# Monitoring script testi
railway run node scripts/monitor.js start
```

### 3. Test Xabar Yuborish

```bash
# Test alert yuborish (PowerShell)
$botToken = "YOUR_BOT_TOKEN"
$chatId = "YOUR_CHAT_ID"
$message = "🎉 PromptMasterPro monitoring tizimi muvaffaqiyatli sozlandi!"

$uri = "https://api.telegram.org/bot$botToken/sendMessage"
$body = @{
    chat_id = $chatId
    text = $message
    parse_mode = "Markdown"
} | ConvertTo-Json

Invoke-RestMethod -Uri $uri -Method Post -Body $body -ContentType "application/json"
```

## 📱 Monitoring Xabar Namunalari

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

### Recovery Alert
```
✅ *Railway Alert: RECOVERY*

🖥️ *Service:* api-gateway
📄 *Message:* Service is now healthy
⏰ *Time:* 15/01/2024, 15:35:00

📊 *Recovery Details:*
  • Response time: 120ms
  • Status code: 200
  • Downtime: 5 minutes

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

## 🛠️ Bot Komandlari

### BotFather Muhim Buyruqlari

```
/help - Barcha buyruqlar
/mybots - Mening botlarim
/token - Token olish
/revoke - Token bekor qilish
/setcommands - Bot komandalarini sozlash
/setdescription - Tavsif
/setabouttext - About matn
/setuserpic - Rasm
/deletebot - Bot o'chirish
```

### Monitoring Bot Uchun Komandalar

```
/setcommands
```

Qo'shing:
```
start - Botni ishga tushurish
help - Yordam
status - Server holatini ko'rish
alerts - Xabarlar sozlamalari
stop - Xabarlarni to'xtatish
```

## 🔒 Xavfsizlik Eslatmalari

1. **Tokenlarni saqlang**: Tokenlarni GitHub ga push qilmang
2. **Bot admin huquqlari**: Faqat kerakli huquqlarni bering
3. **Chat ID**: Shaxsiy guruh yoki kanal ishlating
4. **Regular rotation**: Tokenlarni muntazam yangilang
5. **Access control**: Faqat ishonchli odamlar monitoringga ruxsat bering

## 📞 Qo'llab-quvvatlash

Agar muammolar yuzaga kelsa:

1. **Bot tokenini tekshiring**: `railway variables get TELEGRAM_BOT_TOKEN`
2. **Chat ID ni tekshiring**: `railway variables get MONITORING_CHAT_ID`
3. **Bot holatini tekshiring**: @BotFather → `/mybots`
4. **Network ulanishini tekshiring**: `curl` bilan API test
5. **Railway loglarini tekshiring**: `railway logs`

---

**✅ Bot muvaffaqiyatli yaratildi! Endi monitoring tizimi ishga tushadi va xatoliklar yuzaga kelganda darhol xabar beradi.**