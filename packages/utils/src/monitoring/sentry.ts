import * as Sentry from '@sentry/node'
// import { ProfilingIntegration } from '@sentry/profiling-node'

const SENSITIVE_KEYS = ['password', 'token', 'key', 'secret', 'auth', 'authorization', 'cookie', 'session', 'credit_card', 'cc'];

function scrubSensitiveData(data: any): any {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(scrubSensitiveData);

  const scrubbed = { ...data };

  for (const key in scrubbed) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof scrubbed[key] === 'object') {
      scrubbed[key] = scrubSensitiveData(scrubbed[key]);
    }
  }
  return scrubbed;
}

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    
    // Profiling
    integrations: [
      // new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Prisma({
        client: 'prisma',
      }),
    ],
    
    // Railway Pro specific settings
    serverName: process.env.RAILWAY_SERVICE_NAME || 'prompt-master-pro',
    release: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out common non-critical errors
      if (event.exception) {
        const error = hint.originalException as Error
        if (error && error.message) {
          // Filter out Redis connection errors during startup
          if (error.message.includes('ECONNREFUSED') && error.message.includes('6379')) {
            return null
          }
          // Filter out health check noise
          if (error.message.includes('health check')) {
            return null
          }
        }
      }

      // Global scrubbing for all events
      if (event.request && event.request.headers) {
         event.request.headers = scrubSensitiveData(event.request.headers);
      }
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra);
      }
      
      return event
    },
    
    // Performance monitoring
    beforeSendTransaction(event) {
      // Filter out health check transactions
      if (event.transaction === 'GET /health') {
        return null
      }
      return event
    },
    
    // Custom context
    initialScope: {
      tags: {
        service: process.env.RAILWAY_SERVICE_NAME,
        region: process.env.RAILWAY_REGION,
        environment: process.env.RAILWAY_ENVIRONMENT,
      },
      user: {
        id: 'system',
        username: 'railway-pro',
      },
    },
  })
}

export function captureException(error: Error, context?: any) {
  const safeContext = context ? scrubSensitiveData(context) : undefined;
  Sentry.captureException(error, {
    extra: safeContext,
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any) {
  const safeContext = context ? scrubSensitiveData(context) : undefined;
  Sentry.captureMessage(message, {
      level: level,
      extra: safeContext
  })
}

export function setUser(user: any) {
  Sentry.setUser(user)
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb)
}
