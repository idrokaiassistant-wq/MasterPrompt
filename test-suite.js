
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';
const LOG_FILE = path.join(process.cwd(), 'comprehensive_test_log.txt');

// Helper to log messages
function log(type, module, message, details = '') {
  const timestamp = new Date().toISOString();
  const logEntry = `
--------------------------------------------------
[${timestamp}] [${type}] [${module}]
Message: ${message}
Details: ${details}
--------------------------------------------------
`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry);
}

// Helper to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  // Clear previous log
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
  }
  
  log('INFO', 'System', 'Starting comprehensive test suite...');

  // 1. Health Check with Retry
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      log('INFO', 'HealthCheck', `Attempt ${i+1}: Checking base URL...`);
      const res = await fetch(`${BASE_URL}/en`);
      if (res.ok) {
        log('SUCCESS', 'HealthCheck', 'Base URL is accessible', `Status: ${res.status}`);
        serverReady = true;
        break;
      } else {
        const text = await res.text();
        log('WARNING', 'HealthCheck', 'Base URL returned error', `Status: ${res.status} ${res.statusText}\nBody: ${text.substring(0, 500)}`);
      }
    } catch (error) {
      log('WARNING', 'HealthCheck', `Attempt ${i+1} failed`, error.message);
      await delay(2000);
    }
  }

  if (!serverReady) {
    log('CRITICAL', 'HealthCheck', 'Failed to connect to server after multiple attempts (Continuing tests...)');
    // return; 
  }

  // 2. Test API: /api/generate
  try {
    log('INFO', 'API:Generate', 'Testing generate endpoint...');
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        input: 'Say hello in English',
        temperature: 0.7,
        maxTokens: 100,
        language: 'en'
      })
    });
    
    const data = await res.json();
    if (res.ok && data.output) {
      log('SUCCESS', 'API:Generate', 'Generation successful', `Output: ${data.output.substring(0, 50)}...`);
    } else {
      log('ERROR', 'API:Generate', 'Generation failed', `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log('ERROR', 'API:Generate', 'Request failed', error.message);
  }

  // 3. Test API: /api/improve-text
  try {
    log('INFO', 'API:ImproveText', 'Testing improve-text endpoint...');
    const res = await fetch(`${BASE_URL}/api/improve-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'hello worl how are u',
        language: 'en'
      })
    });
    
    const data = await res.json();
    if (res.ok && data.output) {
      log('SUCCESS', 'API:ImproveText', 'Improvement successful', `Output: ${data.output.substring(0, 50)}...`);
    } else {
      log('ERROR', 'API:ImproveText', 'Improvement failed', `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log('ERROR', 'API:ImproveText', 'Request failed', error.message);
  }

   // 4. Test API: /api/test-prompt
   try {
    log('INFO', 'API:TestPrompt', 'Testing test-prompt endpoint...');
    const res = await fetch(`${BASE_URL}/api/test-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'You are a helpful assistant',
        input: 'Hi',
        model: 'google/gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 100
      })
    });
    
    const data = await res.json();
    if (res.ok && data.output) {
      log('SUCCESS', 'API:TestPrompt', 'Test Prompt successful', `Output: ${data.output.substring(0, 50)}...`);
    } else {
      log('ERROR', 'API:TestPrompt', 'Test Prompt failed', `Status: ${res.status}, Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    log('ERROR', 'API:TestPrompt', 'Request failed', error.message);
  }

  log('INFO', 'System', 'Test suite completed.');
}

runTests();
