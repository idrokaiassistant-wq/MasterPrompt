import Redis from 'ioredis'

// Redis configuration optimized for Railway Pro (8GB RAM)
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  
  // Connection pool settings
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableOfflineQueue: true,
  
  // Performance optimization for 32 vCPU
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // Cluster support for multi-region
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  
  // Memory optimization
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  
  // TLS for Railway Pro
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
}

class RedisManager {
  private client: Redis
  private subscriber: Redis
  private publisher: Redis
  
  constructor() {
    this.client = new Redis(redisConfig)
    this.subscriber = new Redis(redisConfig)
    this.publisher = new Redis(redisConfig)
    
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    this.client.on('error', (error) => {
      console.error('Redis client error:', error)
    })
    
    this.client.on('connect', () => {
      console.log('Redis client connected')
    })
    
    this.client.on('ready', () => {
      console.log('Redis client ready')
    })
  }
  
  // Cache strategies optimized for Railway Pro
  
  // Session cache (24h TTL)
  async setSession(sessionId: string, data: any, ttl: number = 86400) {
    const key = `session:${sessionId}`
    await this.client.setex(key, ttl, JSON.stringify(data))
  }
  
  async getSession(sessionId: string) {
    const key = `session:${sessionId}`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }
  
  async deleteSession(sessionId: string) {
    const key = `session:${sessionId}`
    await this.client.del(key)
  }
  
  // AI response cache (7d TTL)
  async setAIResponse(promptHash: string, response: any, ttl: number = 604800) {
    const key = `ai:response:${promptHash}`
    await this.client.setex(key, ttl, JSON.stringify(response))
  }
  
  async getAIResponse(promptHash: string) {
    const key = `ai:response:${promptHash}`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }
  
  // User data cache (1h TTL)
  async setUserData(userId: string, data: any, ttl: number = 3600) {
    const key = `user:data:${userId}`
    await this.client.setex(key, ttl, JSON.stringify(data))
  }
  
  async getUserData(userId: string) {
    const key = `user:data:${userId}`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }
  
  // Template cache (30d TTL)
  async setTemplate(templateId: string, template: any, ttl: number = 2592000) {
    const key = `template:${templateId}`
    await this.client.setex(key, ttl, JSON.stringify(template))
  }
  
  async getTemplate(templateId: string) {
    const key = `template:${templateId}`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }
  
  // Analytics cache (1h TTL)
  async setAnalytics(metric: string, data: any, ttl: number = 3600) {
    const key = `analytics:${metric}`
    await this.client.setex(key, ttl, JSON.stringify(data))
  }
  
  async getAnalytics(metric: string) {
    const key = `analytics:${metric}`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }
  
  // Rate limiting with sliding window
  async checkRateLimit(key: string, limit: number, windowMs: number) {
    const windowKey = `rate:${key}:${Math.floor(Date.now() / windowMs)}`
    const current = await this.client.incr(windowKey)
    
    if (current === 1) {
      await this.client.expire(windowKey, Math.ceil(windowMs / 1000))
    }
    
    return {
      allowed: current <= limit,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt: Date.now() + windowMs
    }
  }
  
  // Pub/Sub for real-time features
  async publish(channel: string, message: any) {
    await this.publisher.publish(channel, JSON.stringify(message))
  }
  
  async subscribe(channel: string, callback: (message: any) => void) {
    await this.subscriber.subscribe(channel)
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(JSON.parse(message))
      }
    })
  }
  
  // Health check
  async healthCheck() {
    try {
      const ping = await this.client.ping()
      const info = await this.client.info()
      
      return {
        status: 'healthy',
        ping,
        memory: await this.client.info('memory'),
        stats: await this.client.info('stats'),
        uptime: await this.client.info('server')
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message
      }
    }
  }
  
  // Cleanup
  async disconnect() {
    await this.client.disconnect()
    await this.subscriber.disconnect()
    await this.publisher.disconnect()
  }
}

// Singleton instance
let redisManager: RedisManager | null = null

export function getRedisManager(): RedisManager {
  if (!redisManager) {
    redisManager = new RedisManager()
  }
  return redisManager
}

export default RedisManager