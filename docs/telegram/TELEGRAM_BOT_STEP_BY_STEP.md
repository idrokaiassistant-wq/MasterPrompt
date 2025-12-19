# Telegram Bot Token Setup - Step by Step

## 🎯 Bot Yaratish

### 1. BotFather orqali bot yaratish

Telegramda quyidagi buyruqlarni bajaring:

1. **@BotFather** ga yozing
2. **Quyidagi ketma-ketlikda buyruqlarni yuboring:**

```
/newbot
```

**Bot nomini kiriting:**
```
PromptMasterPro Monitor
```

**Username kiriting (unique bo'lishi kerak):**
```
@pmp_monitor_bot
```

**Token olasiz:**
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Qo'shimcha sozlamalar

```
/setdescription
PromptMasterPro monitoring bot. Server holatini kuzatish va xabarlar yuborish uchun.
```

```
/setabouttext
Railway server monitoring bot
```

## 🔧 Railway'ga Ulash

### Token Qo‘shish

```bash
railway variables --set "TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### Chat ID Olish

1. **@userinfobot** ga yozing
2. **Chat ID ni nusxalang** (masalan: `123456789`)

```bash
railway variables --set "MONITORING_CHAT_ID=123456789"
```

## ✅ Test Qilish

```bash
# Botni test qilish
railway run node scripts/alert.js test

# Telegram API testi
railway run curl -X GET "https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/getMe"
```

## 📱 Monitoring Xabar Namunasi

Bot muvaffaqiyatli sozlangandan so'ng, siz quyidagi xabarlarni olasiz:

```
🚨 *Railway Alert: ERROR*

🖥️ *Service:* api-gateway
📄 *Message:* Service connection failed
⏰ *Time:* 15/01/2024, 15:30:00

🔍 *Details:*
  • Response time: 5000ms
  • Status code: 503

🚂 *Railway Info:*
  • Environment: production
  • Service: api-gateway
```

## ⚠️ Muhim Eslatmalar

- **Tokenlarni saqlang**: GitHub ga push qilmang
- **Unique username**: @pmp_monitor_bot o'rniga o'zingiznikini tanlang
- **Admin huquqlari**: Guruh monitoringi uchun admin qiling
- **Regular test**: Monitoring tizimini muntazam test qiling

**Bot yaratdingizmi? Token ni olganingizdan so'ng menga ayting va uni Railway'ga ulaymiz!** 🚀