/**
 * Railway Server Configuration
 * Optimized for Railway Pro deployment
 */

const config = {
  // Environment detection
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isRailway: process.env.RAILWAY_ENVIRONMENT === 'production',
  
  // Service Configuration
  services: {
    web: {
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
      name: 'web'
    },
    apiGateway: {
      port: process.env.API_GATEWAY_PORT || 4000,
      host: process.env.API_GATEWAY_HOST || '0.0.0.0',
      name: 'api-gateway'
    },
    telegram: {
      port: process.env.TELEGRAM_PORT || 3003,
      host: '0.0.0.0',
      name: 'telegram-service'
    },
    prompt: {
      port: process.env.PROMPT_PORT || 3001,
      host: '0.0.0.0',
      name: 'prompt-service'
    },
    user: {
      port: process.env.USER_PORT || 3002,
      host: '0.0.0.0',
      name: 'user-service'
    },
    analytics: {
      port: process.env.ANALYTICS_PORT || 3004,
      host: '0.0.0.0',
      name: 'analytics-service'
    }
  },
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000
    },
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    retryDelayOnFailover: 100,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3
  },
  
  // ClickHouse Configuration
  clickhouse: {
    url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: process.env.CLICKHOUSE_PORT || 8123,
    database: 'default',
    username: 'default',
    password: ''
  },
  
  // Telegram Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
    miniAppUrl: process.env.TELEGRAM_MINI_APP_URL,
    port: process.env.TELEGRAM_PORT || 3003
  },
  
  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
    }
  },
  
  // AI Model Configuration
  aiModels: {
    openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY
    },
    googleGemini: {
      apiKey: process.env.GOOGLE_GEMINI_API_KEY
    },
    openAI: {
      apiKey: process.env.OPENAI_API_KEY
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY
    }
  },
  
  // Monitoring Configuration
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development'
    },
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'json',
    healthCheck: {
      interval: 5 * 60 * 1000, // 5 minutes
      timeout: 5000,
      thresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        responseTime: 2000
      }
    }
  },
  
  // Railway-Specific Configuration
  railway: {
    environment: process.env.RAILWAY_ENVIRONMENT,
    serviceId: process.env.RAILWAY_SERVICE_ID,
    projectId: process.env.RAILWAY_PROJECT_ID,
    serviceName: process.env.RAILWAY_SERVICE_NAME,
    region: process.env.RAILWAY_REGION,
    gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA,
    gitBranch: process.env.RAILWAY_GIT_BRANCH,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID
  },
  
  // Performance Configuration
  performance: {
    maxWorkerThreads: parseInt(process.env.MAX_WORKER_THREADS) || 32,
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
    connectionPoolSize: parseInt(process.env.CONNECTION_POOL_SIZE) || 100,
    queryTimeoutMs: parseInt(process.env.QUERY_TIMEOUT_MS) || 30000
  },
  
  // Compliance Configuration
  compliance: {
    auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 2555,
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 2555,
    encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'AES-256-GCM'
  },
  
  // Multi-region Configuration
  regions: {
    primary: process.env.PRIMARY_REGION || 'us-east-1',
    secondary: process.env.SECONDARY_REGION || 'eu-west-1',
    tertiary: process.env.TERTIARY_REGION || 'ap-southeast-1'
  }
};

// Validation functions
function validateConfig() {
  const errors = [];
  
  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate encryption key length
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    errors.push('ENCRYPTION_KEY must be exactly 32 characters long');
  }
  
  return errors;
}

// Helper functions
function getServiceUrl(serviceName) {
  const service = config.services[serviceName];
  if (!service) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  
  if (config.isRailway && config.railway.serviceName === service.name) {
    return `http://localhost:${service.port}`;
  }
  
  return `http://${service.host}:${service.port}`;
}

function getDatabaseUrl() {
  return config.database.url;
}

function getRedisUrl() {
  return config.redis.url || `redis://${config.redis.host}:${config.redis.port}`;
}

function isProduction() {
  return config.isProduction;
}

function isRailway() {
  return config.isRailway;
}

module.exports = {
  config,
  validateConfig,
  getServiceUrl,
  getDatabaseUrl,
  getRedisUrl,
  isProduction,
  isRailway
};