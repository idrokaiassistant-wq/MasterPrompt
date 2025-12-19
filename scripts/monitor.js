#!/usr/bin/env node

/**
 * Railway Server Continuous Monitor
 * Runs health checks every 5 minutes and logs results
 */

const { performHealthCheck } = require('./health-check');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  interval: 5 * 60 * 1000, // 5 minutes
  logFile: path.join(__dirname, '../logs/monitoring.log'),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  retentionDays: 7
};

/**
 * Format log entry
 */
function formatLogEntry(level, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    hostname: require('os').hostname(),
    pid: process.pid
  };
}

/**
 * Write log entry
 */
async function writeLog(entry) {
  try {
    const logDir = path.dirname(config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(config.logFile, logLine);
    
    // Rotate log if too large
    const stats = fs.statSync(config.logFile);
    if (stats.size > config.maxLogSize) {
      rotateLog();
    }
    
  } catch (error) {
    console.error('Failed to write log:', error.message);
  }
}

/**
 * Rotate log files
 */
function rotateLog() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = `${config.logFile}.${timestamp}`;
    
    fs.renameSync(config.logFile, rotatedFile);
    
    // Clean up old rotated files
    const logDir = path.dirname(config.logFile);
    const files = fs.readdirSync(logDir)
      .filter(file => file.startsWith('monitoring.log.'))
      .sort()
      .reverse();
    
    // Keep only last 10 rotated files
    files.slice(10).forEach(file => {
      fs.unlinkSync(path.join(logDir, file));
    });
    
  } catch (error) {
    console.error('Failed to rotate log:', error.message);
  }
}

/**
 * Clean up old logs
 */
function cleanupOldLogs() {
  try {
    const logDir = path.dirname(config.logFile);
    if (!fs.existsSync(logDir)) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    
    const files = fs.readdirSync(logDir);
    
    files.forEach(file => {
      if (file.startsWith('monitoring.log.')) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to cleanup old logs:', error.message);
  }
}

/**
 * Perform health check with logging
 */
async function performMonitoredHealthCheck() {
  const startTime = Date.now();
  
  try {
    console.log(`[${new Date().toISOString()}] Starting health check...`);
    
    // Import health check module
    const { performHealthCheck: runHealthCheck, results } = require('./health-check');
    
    // Run health check
    await runHealthCheck();
    
    const duration = Date.now() - startTime;
    
    // Log success
    const logEntry = formatLogEntry('info', 'Health check completed', {
      duration,
      status: results.status,
      services: results.services,
      system: results.system,
      alerts: results.alerts.length
    });
    
    await writeLog(logEntry);
    
    console.log(`[${new Date().toISOString()}] Health check completed in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    const logEntry = formatLogEntry('error', 'Health check failed', {
      duration,
      error: error.message,
      stack: error.stack
    });
    
    await writeLog(logEntry);
    
    console.error(`[${new Date().toISOString()}] Health check failed after ${duration}ms:`, error.message);
  }
}

/**
 * Start continuous monitoring
 */
function startMonitoring() {
  console.log('🚀 Starting Railway server monitoring...');
  console.log(`📊 Health checks will run every ${config.interval / 1000} seconds`);
  console.log(`📝 Logs will be written to: ${config.logFile}`);
  
  // Initial health check
  performMonitoredHealthCheck();
  
  // Schedule periodic health checks
  setInterval(performMonitoredHealthCheck, config.interval);
  
  // Cleanup old logs daily
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Monitoring stopped by user');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Monitoring stopped by system');
    process.exit(0);
  });
}

/**
 * Get monitoring statistics
 */
function getMonitoringStats() {
  try {
    const logDir = path.dirname(config.logFile);
    if (!fs.existsSync(config.logFile)) {
      return { error: 'No monitoring logs found' };
    }
    
    const logs = fs.readFileSync(config.logFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    const last24h = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 1);
      return logTime > cutoff;
    });
    
    const errors = last24h.filter(log => log.level === 'error');
    const warnings = last24h.filter(log => log.level === 'warning');
    
    return {
      totalChecks: last24h.length,
      errors: errors.length,
      warnings: warnings.length,
      successRate: ((last24h.length - errors.length) / last24h.length * 100).toFixed(1),
      lastCheck: logs[logs.length - 1]?.timestamp,
      logFile: config.logFile,
      logSize: fs.statSync(config.logFile).size
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      startMonitoring();
      break;
    case 'stats':
      const stats = getMonitoringStats();
      console.log('📊 Monitoring Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;
    case 'cleanup':
      cleanupOldLogs();
      console.log('🧹 Log cleanup completed');
      break;
    default:
      console.log('Usage: node monitor.js [start|stats|cleanup]');
      process.exit(1);
  }
}

module.exports = {
  startMonitoring,
  getMonitoringStats,
  config
};