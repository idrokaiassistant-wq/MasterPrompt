import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fastifyRedis } from '@fastify/redis'
import { initializeSentry, captureException } from '@prompt-master-pro/utils'
import { userRoutes } from './routes/user'
import { subscriptionRoutes } from './routes/subscription'

// Initialize Sentry
initializeSentry()

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  }
})

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })

    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://promptmaster.pro', 'https://t.me'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    })

    // Redis configuration
    try {
      await fastify.register(fastifyRedis, {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD,
        // Don't crash on connection error
        closeClient: true
      })
      fastify.log.info('Redis registered')
    } catch (err) {
      fastify.log.warn('Failed to register Redis, proceeding without it:', err)
    }

    await fastify.register(rateLimit, {
      max: 1000,
      timeWindow: '1 minute',
      // Only use Redis if it's available and connected
      redis: fastify.redis,
      allowList: ['127.0.0.1'],
    })

    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'Master Prompt API',
          description: 'Professional prompt engineering platform API',
          version: '2.0.0',
        },
        host: process.env.NODE_ENV === 'production' ? 'api.promptmaster.pro' : 'localhost:3000',
        schemes: ['https', 'http'],
        consumes: ['application/json'],
        produces: ['application/json'],
      },
    })

    await fastify.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    })

    // Register Custom Routes (before proxy)
    await fastify.register(userRoutes, { prefix: '/api/user' })
    await fastify.register(subscriptionRoutes, { prefix: '/api' })
    
    // Add Template Routes (mock implementation for now or proxy if service exists)
    // For now, let's just add a simple mock route for templates to fix the bot error
    fastify.get('/api/templates', async (req, reply) => {
        return [
            { id: '1', title: 'Blog Post', description: 'Write a blog post about...' },
            { id: '2', title: 'Email', description: 'Professional email template...' },
            { id: '3', title: 'Code', description: 'Generate code for...' }
        ];
    });

    fastify.get('/api/templates/:id', async (req, reply) => {
        // @ts-ignore
        const { id } = req.params;
        return { 
            id, 
            title: 'Sample Template', 
            content: 'This is a sample template content.', 
            description: 'Description of the template.' 
        };
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      try {
        // Check Redis connection
        await fastify.redis.ping()
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: '2.0.0',
          services: {
            redis: 'connected',
            redisMemory: await fastify.redis.info('memory'),
          }
        }
      } catch (error: any) {
        fastify.log.error('Health check failed:', error)
        reply.status(503)
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
        }
      }
    })

    // Proxy configuration for microservices
    const services = {
      'prompt': {
        target: process.env.PROMPT_SERVICE_URL || 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
          '^/api/prompt': '',
        },
      },
      // 'user': { ... } // Removed since we handle it directly
      'telegram': {
        target: process.env.TELEGRAM_SERVICE_URL || 'http://localhost:3003',
        changeOrigin: true,
        pathRewrite: {
          '^/api/telegram': '',
        },
      },
      'analytics': {
        target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
        changeOrigin: true,
        pathRewrite: {
          '^/api/analytics': '',
        },
      },
    }

    // Register proxy middleware for each service
    Object.entries(services).forEach(([service, config]) => {
      fastify.register(async function (fastify) {
        fastify.all(`/${service}/*`, async (request, reply) => {
          // @ts-ignore
          const proxy = createProxyMiddleware({
            ...config,
            onError: (err, req, res) => {
              fastify.log.error(`Proxy error for ${service}:`, err)
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                error: 'Service unavailable',
                service,
                message: err.message,
              }))
            },
            onProxyReq: (proxyReq, req, res) => {
              // Add request ID for tracing
              const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random()}`
              proxyReq.setHeader('x-request-id', requestId as string)
              if (req.socket.remoteAddress) {
                  proxyReq.setHeader('x-forwarded-for', req.socket.remoteAddress)
                  proxyReq.setHeader('x-real-ip', req.socket.remoteAddress)
              }
            },
            onProxyRes: (proxyRes, req, res) => {
              // Add CORS headers
              if (req.headers.origin) {
                  proxyRes.headers['access-control-allow-origin'] = req.headers.origin
              } else {
                  proxyRes.headers['access-control-allow-origin'] = '*'
              }
              proxyRes.headers['access-control-allow-credentials'] = 'true'
            },
          })

          return new Promise<void>((resolve, reject) => {
            proxy(request.raw, reply.raw, (error) => {
              if (error) {
                reject(error)
              } else {
                resolve()
              }
            })
          })
        })
      })
    })

    // Global error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error('Global error:', error)
      captureException(error, {
        requestId: request.id,
        url: request.url,
        method: request.method,
      })
      
      reply.status(500).send({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        requestId: request.id,
        timestamp: new Date().toISOString(),
      })
    })

    const port = process.env.PORT ? parseInt(process.env.PORT) : 4000
    const host = process.env.HOST || '0.0.0.0'
    
    await fastify.listen({ port, host })
    fastify.log.info(`API Gateway running on ${host}:${port}`)
    fastify.log.info(`Swagger docs available at http://${host}:${port}/docs`)
  } catch (error) {
    fastify.log.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down gracefully...')
  await fastify.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  fastify.log.info('SIGINT received, shutting down gracefully...')
  await fastify.close()
  process.exit(0)
})

start()
