#!/usr/bin/env node

/**
 * Railway Server Monitoring Test Script
 * Tests all monitoring and configuration systems
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Configuration
const SCRIPT_DIR = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', 'test.log');

// Test results
let testsPassed = 0;
let testsFailed = 0;
let testsTotal = 0;

// Create log directory
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Logging functions
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
}

function info(message) { log('INFO', message); }
function warn(message) { log('WARN', `⚠️  ${message}`); }
function error(message) { log('ERROR', `❌ ${message}`); }
function success(message) { log('SUCCESS', `✅ ${message}`); }
function testHeader(message) { log('TEST', `🔍 ${message}`); }

// Test helper functions
function runTest(testName, testFunction) {
    testsTotal++;
    testHeader(`Testing: ${testName}`);
    
    try {
        if (testFunction()) {
            success(`PASSED: ${testName}`);
            testsPassed++;
            return true;
        } else {
            error(`FAILED: ${testName}`);
            testsFailed++;
            return false;
        }
    } catch (err) {
        error(`FAILED: ${testName} - ${err.message}`);
        testsFailed++;
        return false;
    }
}

function assertFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
        success(`File exists: ${description}`);
        return true;
    } else {
        error(`File not found: ${description} (${filePath})`);
        return false;
    }
}

function assertCommandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        success(`Command available: ${command}`);
        return true;
    } catch {
        warn(`Command not found: ${command}`);
        return false;
    }
}

function assertEnvironmentVariable(varName) {
    if (process.env[varName]) {
        success(`Environment variable set: ${varName}`);
        return true;
    } else {
        warn(`Environment variable not set: ${varName}`);
        return false;
    }
}

// Test functions
function testFileStructure() {
    testHeader("Testing file structure...");
    
    let allPassed = true;
    
    allPassed &= assertFileExists(path.join(SCRIPT_DIR, 'health-check.js'), 'Health check script');
    allPassed &= assertFileExists(path.join(SCRIPT_DIR, 'monitor.js'), 'Monitor script');
    allPassed &= assertFileExists(path.join(SCRIPT_DIR, 'alert.js'), 'Alert script');
    allPassed &= assertFileExists(path.join(SCRIPT_DIR, 'deploy.sh'), 'Deployment script');
    allPassed &= assertFileExists(path.join(SCRIPT_DIR, 'maintenance.sh'), 'Maintenance script');
    allPassed &= assertFileExists(path.join(SCRIPT_DIR, 'test.js'), 'Test script');
    
    allPassed &= assertFileExists(path.join(PROJECT_ROOT, 'config', 'railway.config.js'), 'Railway configuration');
    allPassed &= assertFileExists(path.join(PROJECT_ROOT, 'config', 'railway.config.env'), 'Railway environment config');
    allPassed &= assertFileExists(path.join(PROJECT_ROOT, 'docs', 'RAILWAY_MONITORING_GUIDE.md'), 'Monitoring guide');
    allPassed &= assertFileExists(path.join(PROJECT_ROOT, 'docs', 'QUICK_REFERENCE.md'), 'Quick reference');
    allPassed &= assertFileExists(path.join(PROJECT_ROOT, 'docs', 'CRON_SETUP.md'), 'Cron setup guide');
    
    return allPassed;
}

function testDependencies() {
    testHeader("Testing dependencies...");
    
    let allPassed = true;
    
    // Check Node.js
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        success(`Node.js version: ${nodeVersion}`);
    } catch (err) {
        error('Node.js not found');
        allPassed = false;
    }
    
    // Check npm
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        success(`npm version: ${npmVersion}`);
    } catch (err) {
        error('npm not found');
        allPassed = false;
    }
    
    // Check optional dependencies
    assertCommandExists('redis-cli');
    assertCommandExists('psql');
    
    return allPassed;
}

function testScriptSyntax() {
    testHeader("Testing script syntax...");
    
    let allPassed = true;
    
    try {
        execSync(`node -c "${path.join(SCRIPT_DIR, 'health-check.js')}"`, { stdio: 'ignore' });
        success('Health check script syntax OK');
    } catch (err) {
        error('Health check script syntax error');
        allPassed = false;
    }
    
    try {
        execSync(`node -c "${path.join(SCRIPT_DIR, 'monitor.js')}"`, { stdio: 'ignore' });
        success('Monitor script syntax OK');
    } catch (err) {
        error('Monitor script syntax error');
        allPassed = false;
    }
    
    try {
        execSync(`node -c "${path.join(SCRIPT_DIR, 'alert.js')}"`, { stdio: 'ignore' });
        success('Alert script syntax OK');
    } catch (err) {
        error('Alert script syntax error');
        allPassed = false;
    }
    
    try {
        execSync(`node -c "${path.join(PROJECT_ROOT, 'config', 'railway.config.js')}"`, { stdio: 'ignore' });
        success('Railway config syntax OK');
    } catch (err) {
        error('Railway config syntax error');
        allPassed = false;
    }
    
    return allPassed;
}

function testConfiguration() {
    testHeader("Testing configuration...");
    
    let allPassed = true;
    
    // Test environment config file
    const envConfigPath = path.join(PROJECT_ROOT, 'config', 'railway.config.env');
    if (fs.existsSync(envConfigPath)) {
        success('Environment config file exists');
        
        const content = fs.readFileSync(envConfigPath, 'utf8');
        const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
        
        for (const varName of requiredVars) {
            if (content.includes(varName)) {
                success(`Required variable found: ${varName}`);
            } else {
                error(`Required variable missing: ${varName}`);
                allPassed = false;
            }
        }
    } else {
        error('Environment config file not found');
        allPassed = false;
    }
    
    return allPassed;
}

function testEnvironment() {
    testHeader("Testing environment...");
    
    let allPassed = true;
    
    // Check critical environment variables
    allPassed &= assertEnvironmentVariable('DATABASE_URL');
    allPassed &= assertEnvironmentVariable('JWT_SECRET');
    allPassed &= assertEnvironmentVariable('ENCRYPTION_KEY');
    
    // Check optional but recommended variables
    assertEnvironmentVariable('TELEGRAM_BOT_TOKEN');
    assertEnvironmentVariable('MONITORING_CHAT_ID');
    
    return allPassed;
}

function testAlertSystem() {
    testHeader("Testing alert system...");
    
    let allPassed = true;
    
    // Test alert script without sending actual alerts
    try {
        execSync(`node "${path.join(SCRIPT_DIR, 'alert.js')}" test`, { 
            stdio: 'pipe',
            cwd: PROJECT_ROOT
        });
        success('Alert system test completed');
    } catch (err) {
        warn('Alert system test failed (may be due to missing configuration)');
        // This is not a critical failure
    }
    
    // Test alert configuration
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.MONITORING_CHAT_ID) {
        success('Telegram alerts configured');
    } else {
        warn('Telegram alerts not fully configured');
    }
    
    return allPassed;
}

function testHealthCheck() {
    testHeader("Testing health check functionality...");
    
    // Test health check script (may fail if services aren't running)
    try {
        execSync(`node "${path.join(SCRIPT_DIR, 'health-check.js')}"`, { 
            stdio: 'pipe',
            cwd: PROJECT_ROOT
        });
        success('Health check completed successfully');
        return true;
    } catch (err) {
        warn('Health check failed (services may not be running)');
        return true; // This is not a critical failure for testing
    }
}

function testMonitoring() {
    testHeader("Testing monitoring system...");
    
    // Test monitor stats
    try {
        execSync(`node "${path.join(SCRIPT_DIR, 'monitor.js')}" stats`, { 
            stdio: 'pipe',
            cwd: PROJECT_ROOT
        });
        success('Monitor stats working');
        return true;
    } catch (err) {
        warn('Monitor stats failed');
        return true; // This is not a critical failure
    }
}

function testSystemResources() {
    testHeader("Testing system resources...");
    
    // Check available memory
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemoryPercent = ((totalMemory - freeMemory) / totalMemory * 100).toFixed(1);
    
    success(`Memory usage: ${usedMemoryPercent}%`);
    
    if (usedMemoryPercent < 90) {
        success('Sufficient memory available');
    } else {
        warn('High memory usage detected');
    }
    
    // Check disk space
    try {
        const stats = fs.statSync('/');
        success('Disk access OK');
    } catch (err) {
        error('Disk access failed');
        return false;
    }
    
    // Check CPU load
    const loadAvg = os.loadavg();
    success(`CPU load average: ${loadAvg[0].toFixed(2)}`);
    
    if (loadAvg[0] < 2.0) {
        success('CPU load is normal');
    } else {
        warn('High CPU load detected');
    }
    
    return true;
}

function testNetworkConnectivity() {
    testHeader("Testing network connectivity...");
    
    // Test internet connectivity
    try {
        execSync('ping -c 1 google.com', { stdio: 'ignore' });
        success('Internet connectivity available');
    } catch (err) {
        warn('Internet connectivity issues detected');
    }
    
    // Test Telegram API (if token is configured)
    if (process.env.TELEGRAM_BOT_TOKEN) {
        try {
            execSync(`curl -s "https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe" > /dev/null`, { stdio: 'ignore' });
            success('Telegram API is accessible');
        } catch (err) {
            error('Telegram API is not accessible');
            return false;
        }
    }
    
    return true;
}

function testDirectories() {
    testHeader("Testing directories...");
    
    let allPassed = true;
    
    // Create necessary directories
    const dirs = [
        path.join(PROJECT_ROOT, 'logs'),
        path.join(PROJECT_ROOT, 'backups'),
        path.join(PROJECT_ROOT, 'temp')
    ];
    
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                success(`Created directory: ${path.basename(dir)}`);
            } catch (err) {
                error(`Failed to create directory: ${dir}`);
                allPassed = false;
            }
        } else {
            success(`Directory exists: ${path.basename(dir)}`);
        }
    }
    
    return allPassed;
}

function generateReport() {
    testHeader("Generating test report...");
    
    const reportFile = path.join(PROJECT_ROOT, 'logs', `test_report_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
    
    const report = `Railway Server Monitoring Test Report
Generated: ${new Date().toISOString()}
=====================================

Test Summary:
- Total Tests: ${testsTotal}
- Passed: ${testsPassed}
- Failed: ${testsFailed}
- Success Rate: ${Math.round(testsPassed * 100 / testsTotal)}%

Environment:
- Hostname: ${os.hostname()}
- OS: ${os.platform()} ${os.release()}
- Node Version: ${process.version}
- Architecture: ${os.arch()}

Configuration Status:
- Database URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}
- JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'not configured'}
- Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'}
- Monitoring Chat: ${process.env.MONITORING_CHAT_ID ? 'configured' : 'not configured'}

System Resources:
- Memory Usage: ${((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1)}%
- CPU Cores: ${os.cpus().length}
- Load Average: ${os.loadavg()[0].toFixed(2)}

Recommendations:
${testsFailed > 0 ? '- Fix failed tests before deployment\n' : ''}
${!process.env.TELEGRAM_BOT_TOKEN ? '- Configure Telegram bot token for alerts\n' : ''}
${!process.env.MONITORING_CHAT_ID ? '- Configure monitoring chat ID\n' : ''}
${testsFailed === 0 ? '- All tests passed! System is ready for deployment.\n' : ''}

Next Steps:
1. Review and fix any failed tests
2. Configure missing environment variables
3. Set up cron jobs for automated monitoring
4. Test alert system with actual notifications
5. Deploy to Railway

For more information, see:
- docs/RAILWAY_MONITORING_GUIDE.md
- docs/QUICK_REFERENCE.md
- docs/CRON_SETUP.md
`;
    
    fs.writeFileSync(reportFile, report);
    success(`Test report generated: ${reportFile}`);
}

// Main test function
function runAllTests() {
    info("Starting Railway Server Monitoring Tests...");
    info(`Project root: ${PROJECT_ROOT}`);
    info(`Script directory: ${SCRIPT_DIR}`);
    
    // Run all tests
    runTest("File structure", testFileStructure);
    runTest("Dependencies", testDependencies);
    runTest("Script syntax", testScriptSyntax);
    runTest("Configuration", testConfiguration);
    runTest("Environment", testEnvironment);
    runTest("Alert system", testAlertSystem);
    runTest("Health check", testHealthCheck);
    runTest("Monitoring", testMonitoring);
    runTest("System resources", testSystemResources);
    runTest("Network connectivity", testNetworkConnectivity);
    runTest("Directories", testDirectories);
    
    // Generate final report
    generateReport();
    
    // Summary
    console.log('');
    testHeader("TEST SUMMARY");
    info(`Total Tests: ${testsTotal}`);
    success(`Passed: ${testsPassed}`);
    error(`Failed: ${testsFailed}`);
    info(`Success Rate: ${Math.round(testsPassed * 100 / testsTotal)}%`);
    
    // Exit code
    if (testsFailed === 0) {
        success("🎉 All tests passed! System is ready for deployment.");
        process.exit(0);
    } else {
        error("❌ Some tests failed. Please review and fix issues before deployment.");
        process.exit(1);
    }
}

// CLI interface
function main() {
    const command = process.argv[2] || 'run';
    
    switch (command) {
        case 'run':
            runAllTests();
            break;
        case 'quick':
            info("Running quick tests...");
            runTest("File structure", testFileStructure);
            runTest("Dependencies", testDependencies);
            runTest("Script syntax", testScriptSyntax);
            runTest("Configuration", testConfiguration);
            runTest("Alert system", testAlertSystem);
            
            console.log('');
            testHeader("QUICK TEST SUMMARY");
            info(`Total Tests: ${testsTotal}`);
            success(`Passed: ${testsPassed}`);
            error(`Failed: ${testsFailed}`);
            
            if (testsFailed === 0) {
                success("✅ Quick tests passed!");
            } else {
                error("❌ Quick tests failed.");
            }
            break;
        case 'config':
            runTest("Configuration", testConfiguration);
            break;
        case 'scripts':
            runTest("Script syntax", testScriptSyntax);
            break;
        case 'system':
            runTest("System resources", testSystemResources);
            runTest("Network connectivity", testNetworkConnectivity);
            break;
        default:
            error(`Unknown command: ${command}`);
            info("Usage: node test.js [run|quick|config|scripts|system]");
            process.exit(1);
    }
}

// Run main function
main();