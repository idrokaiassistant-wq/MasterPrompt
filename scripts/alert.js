#!/usr/bin/env node

/**
 * Railway Alert System
 * Sends notifications via Telegram and webhooks
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.MONITORING_CHAT_ID,
    enabled: process.env.TELEGRAM_BOT_TOKEN && process.env.MONITORING_CHAT_ID
  },
  webhook: {
    url: process.env.MONITORING_WEBHOOK_URL,
    enabled: !!process.env.MONITORING_WEBHOOK_URL
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO
  },
  alerts: {
    cooldown: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    retryDelay: 1000
  }
};

// Alert history to prevent spam
const alertHistory = new Map();

/**
 * Alert severity levels
 */
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Check if alert should be sent (cooldown check)
 */
function shouldSendAlert(alertKey) {
  const now = Date.now();
  const lastSent = alertHistory.get(alertKey);
  
  if (!lastSent) {
    alertHistory.set(alertKey, now);
    return true;
  }
  
  if (now - lastSent > config.alerts.cooldown) {
    alertHistory.set(alertKey, now);
    return true;
  }
  
  return false;
}

/**
 * Format alert message
 */
function formatAlertMessage(alert) {
  const {
    severity = SEVERITY.INFO,
    service,
    message,
    timestamp = new Date().toISOString(),
    details = {},
    action = null
  } = alert;
  
  const emoji = {
    [SEVERITY.INFO]: 'ℹ️',
    [SEVERITY.WARNING]: '⚠️',
    [SEVERITY.ERROR]: '❌',
    [SEVERITY.CRITICAL]: '🚨'
  }[severity];
  
  let formattedMessage = `${emoji} *Railway Xabari: ${severity.toUpperCase()}*\n\n`;
  formattedMessage += `🖥️ *Xizmat:* ${service}\n`;
  formattedMessage += `📄 *Xabar:* ${message}\n`;
  formattedMessage += `⏰ *Vaqt:* ${new Date(timestamp).toLocaleString()}\n`;
  
  if (Object.keys(details).length > 0) {
    formattedMessage += `\n🔍 *Tafsilotlar:*\n`;
    Object.entries(details).forEach(([key, value]) => {
      formattedMessage += `  • ${key}: ${value}\n`;
    });
  }
  
  if (action) {
    formattedMessage += `\n🔧 *Harakat talab etiladi:* ${action}\n`;
  }
  
  if (config.railway) {
    formattedMessage += `\n🚂 *Railway Ma'lumotlari:*\n`;
    formattedMessage += `  • Muhit: ${config.railway.environment || 'noma\'lum'}\n`;
    formattedMessage += `  • Xizmat: ${config.railway.serviceName || 'noma\'lum'}\n`;
    formattedMessage += `  • Hudud: ${config.railway.region || 'noma\'lum'}\n`;
  }
  
  return formattedMessage;
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(alert) {
  if (!config.telegram.enabled) {
    console.log('Telegram notifications disabled');
    return false;
  }
  
  const alertKey = `telegram:${alert.service}:${alert.message}`;
  if (!shouldSendAlert(alertKey)) {
    console.log('Alert skipped due to cooldown');
    return false;
  }
  
  const message = formatAlertMessage(alert);
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${config.telegram.botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Telegram xabarnomasi muvaffaqiyatli yuborildi');
          resolve(true);
        } else {
          console.error(`Telegram xabarnomasi yuborilmadi: ${res.statusCode}`, responseData);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Telegram notification error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('Telegram notification timeout');
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(alert) {
  if (!config.webhook.enabled) {
    console.log('Webhook notifications disabled');
    return false;
  }
  
  const alertKey = `webhook:${alert.service}:${alert.message}`;
  if (!shouldSendAlert(alertKey)) {
    console.log('Webhook alert skipped due to cooldown');
    return false;
  }
  
  const payload = {
    type: 'railway_alert',
    severity: alert.severity || SEVERITY.INFO,
    service: alert.service,
    message: alert.message,
    timestamp: alert.timestamp || new Date().toISOString(),
    details: alert.details || {},
    action: alert.action || null,
    railway: config.railway,
    environment: config.environment
  };
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const url = new URL(config.webhook.url);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Railway-Alert-System/1.0'
      }
    };
    
    if (url.protocol === 'https:') {
      options.port = url.port || 443;
    } else {
      options.port = url.port || 80;
    }
    
    const protocol = url.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Webhook notification sent successfully');
          resolve(true);
        } else {
          console.error(`Webhook notification failed: ${res.statusCode}`, responseData);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Webhook notification error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('Webhook notification timeout');
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Send email notification
 */
async function sendEmailNotification(alert) {
  if (!config.email.enabled) {
    console.log('Email notifications disabled');
    return false;
  }
  
  // Email implementation would require nodemailer or similar
  // This is a placeholder for email functionality
  console.log('Email notifications not implemented yet');
  return false;
}

/**
 * Send alert through all configured channels
 */
async function sendAlert(alert) {
  const results = {
    telegram: false,
    webhook: false,
    email: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Send to all enabled channels in parallel
    const [telegramResult, webhookResult, emailResult] = await Promise.allSettled([
      sendTelegramNotification(alert),
      sendWebhookNotification(alert),
      sendEmailNotification(alert)
    ]);
    
    results.telegram = telegramResult.status === 'fulfilled' ? telegramResult.value : false;
    results.webhook = webhookResult.status === 'fulfilled' ? webhookResult.value : false;
    results.email = emailResult.status === 'fulfilled' ? emailResult.value : false;
    
    console.log('Alert sent successfully:', results);
    return results;
    
  } catch (error) {
    console.error('Failed to send alert:', error.message);
    return results;
  }
}

/**
 * Test alert system
 */
async function testAlertSystem() {
  const testAlert = {
    severity: SEVERITY.INFO,
    service: 'alert-system',
    message: 'Railway monitoring tizimidan test xabari',
    details: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('🧪 Xabarnoma tizimi tekshirilmoqda...');
  const result = await sendAlert(testAlert);
  
  console.log('Test results:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Get alert statistics
 */
function getAlertStats() {
  const now = Date.now();
  const stats = {
    totalAlerts: alertHistory.size,
    recentAlerts: 0,
    channels: {
      telegram: config.telegram.enabled,
      webhook: config.webhook.enabled,
      email: config.email.enabled
    },
    cooldown: config.alerts.cooldown / 1000 / 60 // minutes
  };
  
  // Count recent alerts (last hour)
  alertHistory.forEach((timestamp) => {
    if (now - timestamp < 60 * 60 * 1000) {
      stats.recentAlerts++;
    }
  });
  
  return stats;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      testAlertSystem().then(() => process.exit(0));
      break;
    case 'stats':
      const stats = getAlertStats();
      console.log('📊 Xabarnoma Tizimi Statistikasi:');
      console.log(JSON.stringify(stats, null, 2));
      process.exit(0);
      break;
    default:
      console.log('Usage: node alert.js [test|stats]');
      process.exit(1);
  }
}

module.exports = {
  sendAlert,
  sendTelegramNotification,
  sendWebhookNotification,
  testAlertSystem,
  getAlertStats,
  SEVERITY,
  config
};