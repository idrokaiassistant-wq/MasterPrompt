# Railway Server Monitoring Scripts - Quick Reference

## 🚀 Tez boshlash

```bash
# 1. Monitoringni ishga tushirish
node scripts/monitor.js start

# 2. Health check
node scripts/health-check.js

# 3. Alert tizimini test qilish
node scripts/alert.js test
```

## 📊 Monitoring Commands

### Health Check
```bash
# Oddiy tekshiruv
node scripts/health-check.js

# Barcha servislar bilan
WEB_URL=http://localhost:3000 \
API_GATEWAY_URL=http://localhost:4000 \
TELEGRAM_SERVICE_URL=http://localhost:3003 \
TELEGRAM_BOT_TOKEN=your_token \
MONITORING_CHAT_ID=your_chat_id \
node scripts/health-check.js
```

### Continuous Monitoring
```bash
# Monitoringni boshlash
node scripts/monitor.js start

# Statistika
node scripts/monitor.js stats

# Log tozalash
node scripts/monitor.js cleanup
```

### Alert System
```bash
# Test alert
node scripts/alert.js test

# Alert statistikasi
node scripts/alert.js stats
```

## 🔧 Deployment Commands

```bash
# To'liq deployment
./scripts/deploy.sh deploy

# Status ko'rish
./scripts/deploy.sh status

# Servislarni boshlash/to'xtatish
./scripts/deploy.sh start
./scripts/deploy.sh stop
./scripts/deploy.sh restart

# Rollback
./scripts/deploy.sh rollback

# Health check
./scripts/deploy.sh health
```

## 🛠️ Maintenance Commands

```bash
# To'liq xizmat ko'rsatish
./scripts/maintenance.sh run

# Alohida operatsiyalar
./scripts/maintenance.sh cleanup    # Tozalash
./scripts/maintenance.sh database  # Database
./scripts/maintenance.sh optimize  # Optimallashtirish
./scripts/maintenance.sh security  # Xavfsizlik
./scripts/maintenance.sh health    # Health check
./scripts/maintenance.sh report    # Hisobot
```

## 📋 Environment Variables

### Required
```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=minimum_32_character_long_secret_key
ENCRYPTION_KEY=exactly_32_character_encryption_key
```

### Optional
```bash
# Monitoring
TELEGRAM_BOT_TOKEN=your_bot_token
MONITORING_CHAT_ID=your_chat_id
MONITORING_WEBHOOK_URL=https://your-webhook.com/alerts

# Services
WEB_URL=http://localhost:3000
API_GATEWAY_URL=http://localhost:4000
TELEGRAM_SERVICE_URL=http://localhost:3003

# AI APIs
OPENROUTER_API_KEY=your_key
GOOGLE_GEMINI_API_KEY=your_key
```

## 🔍 Log Files

```bash
# Monitoring logs
tail -f logs/monitoring.log

# Deployment logs
tail -f logs/deployment.log

# Service logs
tail -f logs/api-gateway.log
tail -f logs/telegram-service.log
tail -f logs/web.log

# Maintenance logs
tail -f logs/maintenance.log
```

## 🚨 Common Issues

### Service not starting
```bash
# Check logs
tail -f logs/api-gateway.log

# Check ports
netstat -tlnp | grep :3000

# Health check
node scripts/health-check.js
```

### Database connection error
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check Redis
redis-cli -u $REDIS_URL ping
```

### Telegram bot not working
```bash
# Check token
echo $TELEGRAM_BOT_TOKEN

# Test webhook
curl -X GET "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

## 📈 Performance Monitoring

```bash
# System resources
top -p $(pgrep -d"," node)
free -h
df -h

# Response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/health"

# Active connections
netstat -an | grep :3000 | wc -l
```

## 🔄 Cron Jobs

### Linux/Mac
```bash
# Edit crontab
crontab -e

# Add these lines:
# Monitoring every 5 minutes
*/5 * * * * cd /path/to/project && node scripts/health-check.js >> logs/cron.log 2>&1

# Daily cleanup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/maintenance.sh cleanup >> logs/maintenance.log 2>&1

# Weekly full maintenance on Sunday at 3 AM
0 3 * * 0 cd /path/to/project && ./scripts/maintenance.sh run >> logs/maintenance.log 2>&1
```

### Windows
```powershell
# Save as railway-tasks.ps1
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/health-check.js" -WorkingDirectory "C:\path\to\project"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
Register-ScheduledTask -TaskName "RailwayMonitoring" -Action $action -Trigger $trigger
```

## 📞 Support

For issues:
1. Check logs: `tail -f logs/monitoring.log`
2. Run health check: `node scripts/health-check.js`
3. Check environment variables
4. Contact support with logs

## 📚 Full Documentation

See: `docs/RAILWAY_MONITORING_GUIDE.md`