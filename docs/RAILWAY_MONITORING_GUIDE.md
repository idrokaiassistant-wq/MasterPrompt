# Railway Server Monitoring & Configuration Guide

## 📋 Jadvali
- [Kirish](#kirish)
- [Server Monitoring](#server-monitoring)
- [Konfiguratsiya](#konfiguratsiya)
- [Avtomatik Tekshiruv](#avtomatik-tekshiruv)
- [Xabarlar Tizimi](#xabarlar-tizimi)
- [Deployment](#deployment)
- [Xizmat ko'rsatish](#xizmat-korsatish)
- [Xavfsizlik](#xavfsizlik)
- [Troubleshooting](#troubleshooting)

## Kirish

Ushbu qo'llanma PromptMasterPro loyihasini Railway platformasida monitoring qilish va sozlash uchun mo'ljallangan. Barcha skriptlar va konfiguratsiyalar avtomatik monitoring, xabarlar va xizmat ko'rsatishni ta'minlaydi.

### 🎯 Asosiy xususiyatlar:
- **Avtomatik monitoring** - Har 5 daqiqada server holatini tekshiradi
- **Telegram xabarlar** - Xatoliklar yuzaga kelganda avtomatik xabarlar
- **Webhook xabarlar** - Integratsiya mumkin bo'lgan xabarlar tizimi
- **Sistem monitoring** - CPU, xotira, disk monitoringi
- **Service monitoring** - Barcha servislarni holatini tekshiradi
- **Avtomatik deployment** - Xavfsiz deployment va rollback imkoniyati

## Server Monitoring

### 1. Health Check Skripti

**Fayl:** `scripts/health-check.js`

Ushbu skript barcha servislarni va tizim resurslarini tekshiradi.

#### Ishga tushirish:
```bash
# Oddiy tekshiruv
node scripts/health-check.js

# Barcha servislarni tekshirish
WEB_URL=http://localhost:3000 \
API_GATEWAY_URL=http://localhost:4000 \
TELEGRAM_SERVICE_URL=http://localhost:3003 \
TELEGRAM_BOT_TOKEN=your_token \
MONITORING_CHAT_ID=your_chat_id \
node scripts/health-check.js
```

#### Tekshiruv turlari:
- **HTTP Servislar** - Web, API Gateway, Telegram servislar
- **Redis** - Kesh server holati
- **Tizim resurslari** - CPU, xotira, disk foydalanishi
- **Javob vaqti** - Servislarning javob vaqti

#### Chegaralar (Thresholds):
```javascript
{
  cpu: 80,           // 80% CPU foydalanishi
  memory: 85,        // 85% xotira foydalanishi
  disk: 90,          // 90% disk foydalanishi
  responseTime: 2000  // 2 soniya javob vaqti
}
```

### 2. Monitoring Skripti

**Fayl:** `scripts/monitor.js`

Ushbu skript davomiy monitoringni amalga oshiradi (har 5 daqiqada).

#### Ishga tushirish:
```bash
# Davomiy monitoringni boshlash
node scripts/monitor.js start

# Monitoring statistikasi
node scripts/monitor.js stats

# Eski loglarni tozalash
node scripts/monitor.js cleanup
```

#### Log fayllari:
- **Asosiy log:** `logs/monitoring.log`
- **Rotatsiya:** 10MB hajmiga yetganda avtomatik rotatsiya
- **Saqlash muddati:** 7 kun

### 3. Monitoring natijalari:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "healthy",
  "services": {
    "web": {
      "status": "healthy",
      "responseTime": 150,
      "statusCode": 200
    },
    "apiGateway": {
      "status": "healthy", 
      "responseTime": 120,
      "statusCode": 200
    },
    "redis": {
      "status": "healthy",
      "ping": "PONG",
      "info": {
        "used_memory_human": "45.32M",
        "connected_clients": "12"
      }
    }
  },
  "system": {
    "cpu": {
      "usage": 25.5,
      "status": "healthy"
    },
    "memory": {
      "usage": 60.2,
      "status": "healthy"
    },
    "disk": {
      "usage": 45,
      "status": "healthy"
    }
  },
  "alerts": []
}
```

## Konfiguratsiya

### 1. Atrof-muhit o'zgaruvchilari (Environment Variables)

**Asosiy o'zgaruvchilar:**

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_key_min_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Monitoring
TELEGRAM_BOT_TOKEN=your_bot_token
MONITORING_CHAT_ID=your_chat_id
MONITORING_WEBHOOK_URL=https://your-webhook-url.com/alerts

# Railway
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=your-service-name
RAILWAY_REGION=us-east-1
```

### 2. Konfiguratsiya fayllari

**Fayl:** `config/railway.config.js`

```javascript
const config = {
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isRailway: process.env.RAILWAY_ENVIRONMENT === 'production',
  
  services: {
    web: { port: 3000, host: '0.0.0.0' },
    apiGateway: { port: 4000, host: '0.0.0.0' },
    telegram: { port: 3003, host: '0.0.0.0' }
  },
  
  monitoring: {
    healthCheck: {
      interval: 5 * 60 * 1000, // 5 minutes
      thresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        responseTime: 2000
      }
    }
  }
};
```

### 3. Railway konfiguratsiyasi

**Fayl:** `config/railway.config.env`

Barcha kerakli o'zgaruvchilar to'liq ro'yxati bilan tayyor fayl.

## Avtomatik Tekshiruv

### Cron job sozlash (Linux/Mac)

```bash
# Crontab faylini ochish
crontab -e

# Quyidagi qatorlarni qo'shing:
# Har 5 daqiqada monitoring
*/5 * * * * cd /path/to/project && node scripts/health-check.js >> logs/cron.log 2>&1

# Har kuni ertalab tozalash
0 2 * * * cd /path/to/project && node scripts/maintenance.sh cleanup >> logs/maintenance.log 2>&1

# Haftada bir marta to'liq xizmat ko'rsatish
0 3 * * 0 cd /path/to/project && node scripts/maintenance.sh run >> logs/maintenance.log 2>&1
```

### Windows Task Scheduler (Windows)

```powershell
# PowerShell skripti sifatida saqlang
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/health-check.js" -WorkingDirectory "C:\path\to\project"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
Register-ScheduledTask -TaskName "RailwayMonitoring" -Action $action -Trigger $trigger
```

## Xabarlar Tizimi

### 1. Alert Skripti

**Fayl:** `scripts/alert.js`

Xatoliklar yuzaga kelganda avtomatik xabarlar yuboradi.

#### Xabar turlari:
- **Telegram** - Bot orqali xabarlar
- **Webhook** - URL manzilga POST so'rovlar
- **Email** - Elektron pochta xabarlar (nodemailer bilan)

#### Xabar formati:
```javascript
{
  severity: 'error',        // info, warning, error, critical
  service: 'api-gateway',   // Xizmat nomi
  message: 'Service down',  // Xabar matni
  timestamp: '2024-01-15T10:30:00.000Z',
  details: {                // Qo'shimcha ma'lumot
    responseTime: 5000,
    statusCode: 503
  },
  action: 'Check logs'      // Tavsiya etilgan harakat
}
```

#### Telegram xabari namunasi:
```
🚨 *Railway Alert: ERROR*

🖥️ *Service:* api-gateway
📄 *Message:* Service connection failed
⏰ *Time:* 1/15/2024, 10:30:00 AM

🔍 *Details:*
  • Response time: 5000ms
  • Status code: 503
  • Error: Connection timeout

🔧 *Action Required:* Check service logs and restart

🚂 *Railway Info:*
  • Environment: production
  • Service: api-gateway
  • Region: us-east-1
```

### 2. Alert test qilish

```bash
# Alert tizimini test qilish
node scripts/alert.js test

# Alert statistikasi
node scripts/alert.js stats
```

### 3. Cooldown (qayta xabarlar oldini olish)

Bir xil xabar 5 daqiqa davomida takrorlanmaydi:
```javascript
config.alerts.cooldown = 5 * 60 * 1000; // 5 minutes
```

## Deployment

### 1. Deployment Skripti

**Fayl:** `scripts/deploy.sh`

Xavfsiz deployment va rollback imkoniyati.

#### Asosiy buyruqlar:
```bash
# To'liq deployment
./scripts/deploy.sh deploy

# Servislarni boshlash
./scripts/deploy.sh start

# Servislarni to'xtatish
./scripts/deploy.sh stop

# Servislarni qayta ishga tushirish
./scripts/deploy.sh restart

# Rollback (oldingi versiyaga qaytish)
./scripts/deploy.sh rollback

# Holatni ko'rish
./scripts/deploy.sh status

# Health check
./scripts/deploy.sh health
```

#### Deployment jarayoni:
1. **Backup yaratish** - Joriy holatni saqlab qo'yish
2. **Tekshiruvlar** - Barcha kerakli dasturlar borligini tekshirish
3. **Dependency o'rnatish** - npm/paketlarni yangilash
4. **Build qilish** - Loyihani yig'ish
5. **Migratsiya** - Database o'zgarishlarini qo'llash
6. **Health check** - Servislar ishlashini tekshirish
7. **Servislarni ishga tushirish** - Yangi versiyani ishga tushirish

#### Backup tizimi:
- **Avtomatik backup** - Deploymentdan oldin avtomatik yaratiladi
- **10 tagacha backup** - Eski backup larni avtomatik o'chiradi
- **Database backup** - PostgreSQL dump (agar pg_dump mavjud bo'lsa)
- **Rollback imkoniyati** - Tez orada qaytish

### 2. Manual deployment (Railway)

```bash
# Railway CLI orqali
railway login
railway init
railway up

# Environment o'zgaruvchilarini sozlash
railway variables set DATABASE_URL=your_database_url
railway variables set JWT_SECRET=your_jwt_secret
railway variables set TELEGRAM_BOT_TOKEN=your_bot_token
```

## Xizmat ko'rsatish

### 1. Xizmat ko'rsatish skripti

**Fayl:** `scripts/maintenance.sh`

```bash
# To'liq xizmat ko'rsatish
./scripts/maintenance.sh run

# Alohida operatsiyalar:
./scripts/maintenance.sh cleanup    # Tozalash
./scripts/maintenance.sh database  # Database xizmat ko'rsatish
./scripts/maintenance.sh optimize  # Tizim optimallashtirish
./scripts/maintenance.sh security  # Xavfsizlik tekshiruvi
./scripts/maintenance.sh health    # Health check
```

### 2. Xizmat ko'rsatish operatsiyalari

#### Tozalash (Cleanup):
- Vaqtinchalik fayllarni o'chirish
- Eski log fayllarni tozalash (30 kun)
- Eski backup larni o'chirish
- npm/pnpm keshini tozalash
- Docker resurslarini tozalash (agar mavjud bo'lsa)

#### Database xizmat ko'rsatish:
- PostgreSQL VACUUM va ANALYZE
- Statistika yangilash
- Database hajmini tekshirish
- Redis holatini tekshirish

#### Tizim optimallashtirish:
- Node.js xotira sozlamalari
- Tizim chegaralari (ulimits)
- Tarmoq sozlamalari
- System packages yangilash (root huquqi bilan)

#### Xavfsizlik tekshiruvi:
- Fayl ruxsatlarini tekshirish
- Maxfiy fayllarni tekshirish
- Environment o'zgaruvchilarini tekshirish
- Standart parollarni aniqlash

## Xavfsizlik

### 1. Asosiy xavfsizlik talablari

#### Environment o'zgaruvchilari:
```bash
# Majburiy o'zgaruvchilar
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=minimum_32_character_long_secret_key
ENCRYPTION_KEY=exactly_32_character_encryption_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
MONITORING_CHAT_ID=your_telegram_chat_id

# API kalitlari
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

#### Fayl ruxsatlari:
```bash
# JavaScript va JSON fayllar
chmod 644 *.js *.json

# Maxfiy fayllar (agar mavjud bo'lsa)
chmod 600 *.pem *.key *.env

# Skript fayllari
chmod +x scripts/*.sh
```

### 2. Xavfsizlik tekshiruvi

```bash
# Xavfsizlik tekshiruvini amalga oshirish
./scripts/maintenance.sh security

# Natijalarni tekshirish
grep -i "error\|warn" logs/maintenance.log
```

### 3. Monitoring xavfsizligi

- **Tokenlar** - Telegram bot tokenlari monitoring chatiga yuborilmaydi
- **Loglar** - Maxfiy ma'lumotlar avtomatik filtrlanadi
- **Webhook** - Xavfsiz HTTPS ulanishdan foydalanadi
- **Cooldown** - Spam xabarlar oldini olish

## Troubleshooting

### 1. Umumiy muammolar va yechimlari

#### Servis ishlamayapti:
```bash
# Loglarni tekshirish
tail -f logs/api-gateway.log
tail -f logs/telegram-service.log
tail -f logs/web.log

# Health check
node scripts/health-check.js

# Portlarni tekshirish
netstat -tlnp | grep -E ":3000|:3001|:3002|:3003|:4000"
```

#### Database ulanish xatosi:
```bash
# Database URL ni tekshirish
echo $DATABASE_URL

# PostgreSQL ulanishini tekshirish
psql $DATABASE_URL -c "SELECT version();"

# Redis ulanishini tekshirish
redis-cli -u $REDIS_URL ping
```

#### Telegram bot ishlamayapti:
```bash
# Token ni tekshirish
echo $TELEGRAM_BOT_TOKEN

# Webhook ni tekshirish
curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"

# Bot info
curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"
```

#### Memory leak (xotira oqimi):
```bash
# Node.js process xotira foydalanishini tekshirish
ps aux | grep node

# Garbage collection statistikasini ko'rish
node --trace-gc scripts/health-check.js
```

### 2. Log tahlili

#### Monitoring loglari:
```bash
# Bugungi loglar
grep "$(date +%Y-%m-%d)" logs/monitoring.log

# Xatoliklarni ko'rish
grep -i "error\|failed\|unhealthy" logs/monitoring.log

# Servis holati o'zgarishlari
grep -E "healthy.*unhealthy|unhealthy.*healthy" logs/monitoring.log
```

#### Deployment loglari:
```bash
# Oxirgi deployment
tail -n 100 logs/deployment.log

# Xatoliklarni aniqlash
grep -i "error\|failed\|rollback" logs/deployment.log
```

### 3. Performance monitoring

#### Tizim resurslari:
```bash
# Real-time monitoring
top -p $(pgrep -d"," node)

# Memory foydalanishi
free -h

# Disk foydalanishi
df -h

# Tarmoq statistikasi
netstat -i
```

#### Servis monitoring:
```bash
# Response vaqtlarini tekshirish
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/health"

# Jami so'rovlar soni
netstat -an | grep :3000 | wc -l

# Xatoliklar soni
tail -n 1000 logs/api-gateway.log | grep -c "error"
```

### 4. Tez yordam (Quick Fix)

#### Servisni qayta ishga tushirish:
```bash
# Barcha servislarni qayta ishga tushirish
./scripts/deploy.sh restart

# Alohida servis
pm2 restart api-gateway
pm2 restart telegram-service
```

#### Loglarni tozalash:
```bash
# Barcha loglarni tozalash
rm logs/*.log

# Servisni qayta ishga tushirish
./scripts/deploy.sh restart
```

#### Cache tozalash:
```bash
# Redis cache tozalash
redis-cli -u $REDIS_URL FLUSHALL

# Browser cache tozalash (userlar uchun)
curl -X POST http://localhost:3000/api/clear-cache
```

## Qo'llab-quvvatlash

Agar muammolar hal bo'lmasa:

1. **Log fayllarni** yig'ing: `logs/monitoring.log`, `logs/deployment.log`
2. **Environment** ma'lumotlarini yashiring (maxfiy kalitlar)
3. **Railway dashboard** dan servis holatini tekshiring
4. **Telegram guruhiga** yoki support ga murojaat qiling

---

**Eslatma:** Barcha skriptlar test qilingan va production muhitda ishlatishga tayyor. Monitoring tizimi avtomatik ravishda xatoliklarni aniqlaydi va xabar beradi.