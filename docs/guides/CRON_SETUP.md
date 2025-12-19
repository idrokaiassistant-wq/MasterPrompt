# Railway Server Monitoring - Cron Setup Guide

## Linux/Mac Cron Setup

### 1. Open crontab editor
```bash
crontab -e
```

### 2. Add monitoring jobs

```bash
# Railway Server Monitoring Cron Jobs
# Add these lines to your crontab

# Health check every 5 minutes
*/5 * * * * cd /home/user/prompt-master-pro && /usr/bin/node scripts/health-check.js >> logs/cron.log 2>&1

# System monitoring every 10 minutes
*/10 * * * * cd /home/user/prompt-master-pro && /usr/bin/node scripts/monitor.js start >> logs/monitor-cron.log 2>&1

# Daily cleanup at 2:00 AM
0 2 * * * cd /home/user/prompt-master-pro && /bin/bash scripts/maintenance.sh cleanup >> logs/maintenance.log 2>&1

# Weekly full maintenance on Sunday at 3:00 AM
0 3 * * 0 cd /home/user/prompt-master-pro && /bin/bash scripts/maintenance.sh run >> logs/weekly-maintenance.log 2>&1

# Daily backup at 1:00 AM
0 1 * * * cd /home/user/prompt-master-pro && /bin/bash scripts/deploy.sh backup >> logs/backup.log 2>&1

# Log rotation daily at 4:00 AM
0 4 * * * cd /home/user/prompt-master-pro && find logs -name "*.log" -size +10M -exec gzip {} \; >> logs/rotation.log 2>&1
```

### 3. Environment setup script

Create `scripts/setup-cron.sh`:

```bash
#!/bin/bash

# Railway Cron Setup Script

PROJECT_DIR="/home/user/prompt-master-pro"
NODE_PATH="/usr/bin/node"
BASH_PATH="/bin/bash"

# Create cron entries
cat > /tmp/railway-cron.txt << EOF
# Railway Server Monitoring - $(date)
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
NODE_PATH=$NODE_PATH

# Health monitoring
*/5 * * * * cd $PROJECT_DIR && $NODE_PATH scripts/health-check.js >> logs/cron.log 2>&1
*/10 * * * * cd $PROJECT_DIR && $NODE_PATH scripts/monitor.js start >> logs/monitor-cron.log 2>&1

# Maintenance
0 2 * * * cd $PROJECT_DIR && $BASH_PATH scripts/maintenance.sh cleanup >> logs/maintenance.log 2>&1
0 3 * * 0 cd $PROJECT_DIR && $BASH_PATH scripts/maintenance.sh run >> logs/weekly-maintenance.log 2>&1

# Backup and rotation
0 1 * * * cd $PROJECT_DIR && $BASH_PATH scripts/deploy.sh backup >> logs/backup.log 2>&1
0 4 * * * cd $PROJECT_DIR && find logs -name "*.log" -size +10M -exec gzip {} \; >> logs/rotation.log 2>&1

# Alert system test (daily at 8:00 AM)
0 8 * * * cd $PROJECT_DIR && $NODE_PATH scripts/alert.js test >> logs/alert-test.log 2>&1
EOF

# Install cron jobs
crontab /tmp/railway-cron.txt
rm /tmp/railway-cron.txt

echo "✅ Railway cron jobs installed successfully!"
echo "Current crontab:"
crontab -l
```

### 4. Make executable and run
```bash
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh
```

## Windows Task Scheduler Setup

### 1. PowerShell script for monitoring

Create `scripts/setup-windows-tasks.ps1`:

```powershell
# Railway Windows Task Scheduler Setup

$ProjectDir = "C:\path\to\prompt-master-pro"
$NodePath = "C:\Program Files\nodejs\node.exe"
$TaskNamePrefix = "RailwayMonitoring"

# Create monitoring task
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "scripts\health-check.js" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "$TaskNamePrefix-HealthCheck" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Railway health check every 5 minutes"

# Create maintenance task (daily at 2 AM)
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File scripts\maintenance-daily.ps1" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At "2:00 AM"
Register-ScheduledTask -TaskName "$TaskNamePrefix-DailyMaintenance" -Action $Action -Trigger $Trigger -Description "Daily Railway maintenance"

# Create weekly maintenance task (Sunday at 3 AM)
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File scripts\maintenance-weekly.ps1" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At "3:00 AM"
Register-ScheduledTask -TaskName "$TaskNamePrefix-WeeklyMaintenance" -Action $Action -Trigger $Trigger -Description "Weekly Railway maintenance"

Write-Host "✅ Windows tasks created successfully!"
```

### 2. Daily maintenance PowerShell script

Create `scripts/maintenance-daily.ps1`:

```powershell
# Daily maintenance script
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

# Clean logs older than 30 days
Get-ChildItem -Path "logs" -Filter "*.log" -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force

# Compress large logs
Get-ChildItem -Path "logs" -Filter "*.log" -File | Where-Object { $_.Length -gt 10MB } | ForEach-Object {
    Compress-Archive -Path $_.FullName -DestinationPath "$($_.FullName).zip" -Force
    Remove-Item $_.FullName -Force
}

# Run cleanup
& node scripts/maintenance.js cleanup

Write-Output "$(Get-Date): Daily maintenance completed" | Out-File -FilePath "logs/maintenance-daily.log" -Append
```

### 3. Run PowerShell setup
```powershell
# Run as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup-windows-tasks.ps1
```

## Docker Cron Setup

### 1. Dockerfile with cron

```dockerfile
FROM node:18-alpine

# Install cron
RUN apk add --no-cache dcron

# Copy project files
WORKDIR /app
COPY . .

# Install dependencies
RUN npm install

# Create cron file
RUN echo "*/5 * * * * cd /app && node scripts/health-check.js >> logs/cron.log 2>&1" > /etc/crontabs/root
RUN echo "0 2 * * * cd /app && node scripts/maintenance.js cleanup >> logs/maintenance.log 2>&1" >> /etc/crontabs/root

# Create log directory
RUN mkdir -p logs

# Start cron and application
CMD crond -b && npm start
```

### 2. Docker Compose with cron

```yaml
version: '3.8'
services:
  monitoring:
    build: .
    volumes:
      - ./logs:/app/logs
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - MONITORING_CHAT_ID=${MONITORING_CHAT_ID}
    command: |
      sh -c "
        echo '*/5 * * * * cd /app && node scripts/health-check.js >> logs/cron.log 2>&1' | crontab -
        echo '0 2 * * * cd /app && node scripts/maintenance.js cleanup >> logs/maintenance.log 2>&1' | crontab -
        crond -b && npm start
      "
```

## Railway-specific Cron

### 1. Railway cron service

Create `railway-cron.js`:

```javascript
const cron = require('node-cron');
const { exec } = require('child_process');

// Health check every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Running health check...');
  exec('node scripts/health-check.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Health check failed:', error);
    }
  });
});

// Daily maintenance at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running daily maintenance...');
  exec('node scripts/maintenance.js cleanup', (error, stdout, stderr) => {
    if (error) {
      console.error('Maintenance failed:', error);
    }
  });
});

// Weekly maintenance on Sunday at 3 AM
cron.schedule('0 3 * * 0', () => {
  console.log('Running weekly maintenance...');
  exec('node scripts/maintenance.js run', (error, stdout, stderr) => {
    if (error) {
      console.error('Weekly maintenance failed:', error);
    }
  });
});

console.log('Railway cron service started');
```

### 2. Add to package.json

```json
{
  "scripts": {
    "cron": "node railway-cron.js",
    "start:cron": "concurrently \"npm start\" \"npm run cron\""
  }
}
```

## Monitoring Cron Jobs

### 1. Check cron status

```bash
# Linux/Mac
crontab -l
ps aux | grep cron

# Check logs
tail -f /var/log/cron.log
tail -f logs/cron.log
```

### 2. Test cron jobs manually

```bash
# Test health check
./scripts/health-check.js

# Test maintenance
./scripts/maintenance.sh cleanup

# Check if cron is running
pgrep cron
```

### 3. Cron job monitoring

Add to health check:

```javascript
// Check cron job status
function checkCronStatus() {
  try {
    const { execSync } = require('child_process');
    const cronStatus = execSync('pgrep cron', { encoding: 'utf8' });
    return { running: !!cronStatus, pid: cronStatus.trim() };
  } catch (error) {
    return { running: false, error: error.message };
  }
}
```

## Troubleshooting Cron Issues

### 1. Cron not running
```bash
# Start cron service
sudo service cron start
sudo systemctl start cron

# Check status
sudo service cron status
```

### 2. Permission issues
```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x scripts/*.js

# Check file permissions
ls -la scripts/
```

### 3. Environment issues
```bash
# Add to crontab
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
NODE_PATH=/usr/bin/node

# Or use full paths
*/5 * * * * cd /home/user/prompt-master-pro && /usr/bin/node scripts/health-check.js
```

### 4. Log issues
```bash
# Create log directory
mkdir -p logs

# Check log permissions
ls -la logs/

# Test logging
echo "test" >> logs/test.log
```

## Alert Configuration for Cron

### 1. Failed cron alerts

Add to alert system:

```javascript
// Check cron job failures
function checkCronFailures() {
  const logFile = 'logs/cron.log';
  const lastHour = new Date(Date.now() - 3600000);
  
  // Check for recent errors
  const errors = fs.readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(line => line.includes('ERROR') && new Date(line.split(' ')[0] + ' ' + line.split(' ')[1]) > lastHour);
  
  if (errors.length > 0) {
    sendAlert({
      severity: 'warning',
      service: 'cron',
      message: `${errors.length} cron job failures in the last hour`,
      details: { recentErrors: errors.slice(-5) }
    });
  }
}
```

### 2. Cron health check

Add to health check:

```javascript
// Check cron health
async function checkCronHealth() {
  try {
    const cronStatus = checkCronStatus();
    const recentRuns = checkRecentCronRuns();
    
    return {
      status: cronStatus.running ? 'healthy' : 'unhealthy',
      lastRun: recentRuns.lastRun,
      totalRuns: recentRuns.totalRuns,
      failures: recentRuns.failures
    };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```