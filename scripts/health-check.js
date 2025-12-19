#!/usr/bin/env node

/**
 * Railway Server Health Check Script
 * Performs comprehensive monitoring of all services
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const config = {
  services: {
    web: {
      url: process.env.WEB_URL || 'http://localhost:3000',
      endpoint: '/health',
      timeout: 5000
    },
    apiGateway: {
      url: process.env.API_GATEWAY_URL || 'http://localhost:4000',
      endpoint: '/health',
      timeout: 5000
    },
    telegram: {
      url: process.env.TELEGRAM_SERVICE_URL || 'http://localhost:3003',
      endpoint: '/health',
      timeout: 5000
    },
    database: {
      url: process.env.DATABASE_URL,
      timeout: 10000
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      timeout: 5000
    }
  },
  thresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
    responseTime: 2000
  },
  notifications: {
    telegram: {
      enabled: process.env.TELEGRAM_BOT_TOKEN && process.env.MONITORING_CHAT_ID,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.MONITORING_CHAT_ID
    },
    webhook: process.env.MONITORING_WEBHOOK_URL
  }
};

// Health check results
const results = {
  timestamp: new Date().toISOString(),
  status: 'healthy',
  services: {},
  system: {},
  alerts: []
};

/**
 * Check HTTP service health
 */
async function checkHttpService(name, service) {
  try {
    const startTime = Date.now();
    const response = await new Promise((resolve, reject) => {
      const url = new URL(service.endpoint, service.url);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.get(url.href, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            responseTime,
            data: data ? JSON.parse(data) : null
          });
        });
      });
      
      req.setTimeout(service.timeout, () => {
        reject(new Error('Request timeout'));
      });
      
      req.on('error', reject);
    });
    
    const isHealthy = response.status === 200 && response.responseTime < config.thresholds.responseTime;
    
    results.services[name] = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime: response.responseTime,
      statusCode: response.status,
      data: response.data,
      url: service.url + service.endpoint
    };
    
    if (!isHealthy) {
      results.alerts.push({
        service: name,
        type: 'response',
        message: `${name} xizmati ishlamayapti (Status: ${response.status}, Javob vaqti: ${response.responseTime}ms)`
      });
    }
    
  } catch (error) {
    results.services[name] = {
      status: 'unhealthy',
      error: error.message,
      url: service.url + service.endpoint
    };
    
    results.alerts.push({
      service: name,
      type: 'connection',
      message: `${name} xizmatiga ulanib bo'lmadi: ${error.message}`
    });
  }
}

/**
 * Check Redis connection
 */
async function checkRedis() {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      host: config.services.redis.host,
      port: config.services.redis.port,
      connectTimeout: config.services.redis.timeout
    });
    
    await client.connect();
    const ping = await client.ping();
    const info = await client.info();
    
    await client.disconnect();
    
    results.services.redis = {
      status: 'healthy',
      ping: ping,
      info: parseRedisInfo(info)
    };
    
  } catch (error) {
    results.services.redis = {
      status: 'unhealthy',
      error: error.message
    };
    
    results.alerts.push({
      service: 'redis',
      type: 'connection',
      message: `Redisga ulanib bo'lmadi: ${error.message}`
    });
  }
}

/**
 * Parse Redis info
 */
function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const parsed = {};
  
  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value) {
        parsed[key] = isNaN(value) ? value : Number(value);
      }
    }
  });
  
  return parsed;
}

/**
 * Check system resources
 */
async function checkSystemResources() {
  try {
    // CPU Usage
    const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'");
    const cpuUsage = parseFloat(cpuInfo.trim());
    
    // Memory Usage
    const { stdout: memInfo } = await execAsync("free | grep Mem | awk '{print ($3/$2) * 100.0}'");
    const memoryUsage = parseFloat(memInfo.trim());
    
    // Disk Usage
    const { stdout: diskInfo } = await execAsync("df -h / | awk 'NR==2{print $5}' | sed 's/%//'");
    const diskUsage = parseInt(diskInfo.trim());
    
    // Load Average
    const { stdout: loadInfo } = await execAsync("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'");
    const loadAverage = parseFloat(loadInfo.trim());
    
    results.system = {
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        status: cpuUsage < config.thresholds.cpu ? 'healthy' : 'warning'
      },
      memory: {
        usage: Math.round(memoryUsage * 100) / 100,
        status: memoryUsage < config.thresholds.memory ? 'healthy' : 'warning'
      },
      disk: {
        usage: diskUsage,
        status: diskUsage < config.thresholds.disk ? 'healthy' : 'warning'
      },
      loadAverage: loadAverage
    };
    
    // Add alerts for resource warnings
    if (cpuUsage >= config.thresholds.cpu) {
      results.alerts.push({
        service: 'system',
        type: 'resource',
        message: `Yuqori CPU yuki: ${cpuUsage.toFixed(1)}%`
      });
    }
    
    if (memoryUsage >= config.thresholds.memory) {
      results.alerts.push({
        service: 'system',
        type: 'resource',
        message: `Yuqori xotira yuki: ${memoryUsage.toFixed(1)}%`
      });
    }
    
    if (diskUsage >= config.thresholds.disk) {
      results.alerts.push({
        service: 'system',
        type: 'resource',
        message: `Yuqori disk yuki: ${diskUsage}%`
      });
    }
    
  } catch (error) {
    results.system = {
      status: 'error',
      error: error.message
    };
    
    results.alerts.push({
      service: 'system',
      type: 'monitoring',
      message: `Tizim monitoringida xatolik: ${error.message}`
    });
  }
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(message) {
  if (!config.notifications.telegram.enabled) return;
  
  try {
    const https = require('https');
    
    const data = JSON.stringify({
      chat_id: config.notifications.telegram.chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${config.notifications.telegram.botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Telegram notification failed: ${res.statusCode}`);
      }
    });
    
    req.on('error', (error) => {
      console.error(`Telegram notification error: ${error.message}`);
    });
    
    req.write(data);
    req.end();
    
  } catch (error) {
    console.error(`Failed to send Telegram notification: ${error.message}`);
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(data) {
  if (!config.notifications.webhook) return;
  
  try {
    const response = await fetch(config.notifications.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error(`Webhook notification failed: ${response.status}`);
    }
    
  } catch (error) {
    console.error(`Webhook notification error: ${error.message}`);
  }
}

/**
 * Main health check function
 */
async function performHealthCheck() {
  console.log('🚀 Railway server holati tekshirilmoqda...');
  
  try {
    // Check all services
    await Promise.all([
      checkHttpService('web', config.services.web),
      checkHttpService('apiGateway', config.services.apiGateway),
      checkHttpService('telegram', config.services.telegram),
      checkRedis(),
      checkSystemResources()
    ]);
    
    // Determine overall status
    const unhealthyServices = Object.values(results.services).filter(s => s.status !== 'healthy');
    const systemWarnings = Object.values(results.system).filter(s => s.status === 'warning');
    
    if (unhealthyServices.length > 0) {
      results.status = 'unhealthy';
    } else if (systemWarnings.length > 0) {
      results.status = 'warning';
    } else {
      results.status = 'healthy';
    }
    
    // Send notifications for alerts
    if (results.alerts.length > 0) {
      const alertMessage = `🚨 *Railway Server Xabari*\n\n${results.alerts.map(alert => 
        `• ${alert.service}: ${alert.message}`
      ).join('\n')}\n\nVaqt: ${results.timestamp}`;
      
      await sendTelegramNotification(alertMessage);
      await sendWebhookNotification({
        type: 'health_alert',
        alerts: results.alerts,
        status: results.status,
        timestamp: results.timestamp
      });
    }
    
    // Log results
    console.log('📊 Tekshiruv Natijalari:');
    console.log(JSON.stringify(results, null, 2));
    
    // Exit with appropriate code
    process.exit(results.status === 'healthy' ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Tekshiruvda xatolik:', error.message);
    process.exit(1);
  }
}

// Run health check if called directly
if (require.main === module) {
  performHealthCheck();
}

module.exports = {
  performHealthCheck,
  config,
  results
};