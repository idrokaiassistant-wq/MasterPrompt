export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    timestamp: string
    version: string
    requestId?: string
  }
}

export interface PromptRequest {
  input: string
  model: string
  temperature?: number
  maxTokens?: number
  language?: string
  context?: string
}

export interface PromptResponse {
  id: string
  prompt: string
  response: string
  model: string
  tokensUsed: number
  processingTime: number
  createdAt: string
}

export interface User {
  id: string
  telegramId?: string
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  language: string
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  title: string
  description?: string
  content: string
  category?: string
  tags?: string[]
  isPublic: boolean
  usageCount: number
  authorId: string
  createdAt: string
  updatedAt: string
}

export interface Analytics {
  totalPrompts: number
  totalUsers: number
  totalTemplates: number
  averageResponseTime: number
  popularModels: Array<{
    model: string
    usage: number
    percentage: number
  }>
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
}