import * as dotenv from 'dotenv'
import path from 'path'
import express from 'express'
import { Telegraf, session } from 'telegraf'
import { config, captureException, captureMessage } from '@prompt-master-pro/utils'
import { BotContext } from './types'
import { startHandler } from './handlers/start'
import { newPromptHandler } from './handlers/newPrompt'
import { profileHandler } from './handlers/profile'
import { subscribeHandler } from './handlers/subscribe'
import { historyHandler } from './handlers/history'
import { templatesHandler, templateSelectionHandler } from './handlers/templates'
import { settingsHandler, languageSettingsHandler, languageSelectionHandler } from './handlers/settings'
import { helpHandler } from './handlers/help'

// Load environment variables
dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

// Simple in-memory rate limiter
const rateLimitMap = new Map<number, { count: number, expiresAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 min
const RATE_LIMIT_MAX = 20; // 20 requests per min

class TelegramBot {
  private bot: Telegraf<BotContext>
  
  constructor(token: string) {
    this.bot = new Telegraf<BotContext>(token)
    
    this.setupMiddleware()
    this.setupCommands()
    this.setupActions()
    this.setupErrorHandling()
  }
  
  private setupMiddleware() {
    // Session management
    this.bot.use(session())

    // Rate Limiting
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      if (userId) {
        const now = Date.now();
        let limit = rateLimitMap.get(userId);
        if (!limit || now > limit.expiresAt) {
          limit = { count: 0, expiresAt: now + RATE_LIMIT_WINDOW };
        }
        limit.count++;
        rateLimitMap.set(userId, limit);
        if (limit.count > RATE_LIMIT_MAX) {
          console.warn(`Rate limit exceeded for user ${userId}`);
          return;
        }
      }
      await next();
    });

    // Language detection middleware
    this.bot.use(async (ctx, next) => {
      // Initialize session if it doesn't exist
      if (!ctx.session) {
        ctx.session = {
          language: 'uz',
          state: 'idle'
        }
      }
      
      if (!ctx.session.language) {
        ctx.session.language = ctx.from?.language_code || 'uz'
      }
      await next()
    })
    
    // Analytics middleware
    this.bot.use(async (ctx, next) => {
      const startTime = Date.now()
      
      try {
        await next()
        
        // Log successful interaction
        captureMessage('Telegram interaction', 'info', {
          userId: ctx.from?.id,
          username: ctx.from?.username,
          command: ctx.message?.text,
          responseTime: Date.now() - startTime,
        })
      } catch (error) {
        captureException(error as Error, {
          userId: ctx.from?.id,
          username: ctx.from?.username,
          // Safely access text property if it exists on message
          command: undefined,
        })
        throw error
      }
    })
  }
  
  private setupCommands() {
    this.bot.command('start', startHandler)
    this.bot.command('new', newPromptHandler)
    this.bot.command('profile', profileHandler)
    this.bot.command('subscribe', subscribeHandler)
    this.bot.command('history', historyHandler)
    this.bot.command('templates', templatesHandler)
    this.bot.command('settings', settingsHandler)
    this.bot.command('help', helpHandler)
  }
  
  private setupActions() {
    this.bot.action(/^template_(.+)$/, templateSelectionHandler)
    this.bot.action('settings_language', languageSettingsHandler)
    this.bot.action(/^lang_(.+)$/, languageSelectionHandler)
  }
  
  private setupErrorHandling() {
    // Bot error handler
    this.bot.catch(async (error, ctx) => {
      captureException(error as Error, {
        userId: ctx.from?.id,
        username: ctx.from?.username,
        update: ctx.update,
      })
      
      console.error('Telegram bot error:', error)
      
      try {
        await ctx.reply('❌ An error occurred. Please try again later.')
      } catch (replyError) {
        console.error('Failed to send error message:', replyError)
      }
    })
  }
  
  // Start bot with webhook
  async start() {
    const webhookUrl = config.get('TELEGRAM_WEBHOOK_URL', '');
    const isPlaceholder = webhookUrl && webhookUrl.includes('your-domain.com')
    
    if (webhookUrl && !isPlaceholder) {
      // Production: Use webhook
      console.log('Setting webhook:', webhookUrl)
      await this.bot.telegram.setWebhook(webhookUrl)
      
      // Start webhook server using Express
      const app = express();
      const port = process.env.PORT ? parseInt(process.env.PORT) : config.getNumber('TELEGRAM_PORT', 3003);
      
      // Health check endpoint
      app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', service: 'telegram-service' });
      });

      // Also support /api/health just in case
      app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok', service: 'telegram-service' });
      });

      // Webhook handler
      const webhookPath = new URL(webhookUrl).pathname;
      app.use(this.bot.webhookCallback(webhookPath));
      
      app.listen(port, () => {
        console.log(`Telegram bot webhook server started on port ${port}`);
        console.log(`Webhook path: ${webhookPath}`);
      });

    } else {
      // Development: Use polling
      if (isPlaceholder) {
        console.log('TELEGRAM_WEBHOOK_URL is a placeholder, switching to polling mode.')
        // Clear webhook to ensure polling works
        await this.bot.telegram.deleteWebhook()
      }
      
      this.bot.launch()
      console.log('Telegram bot started with polling')
    }
  }
  
  // Stop bot
  async stop() {
    await this.bot.stop()
    console.log('Telegram bot stopped')
  }
}

export default TelegramBot

// Start the bot if this file is run directly
if (require.main === module) {
  console.log('Starting Telegram Bot Service...')
  
  try {
      const token = config.getSecret('TELEGRAM_BOT_TOKEN')
      
      const bot = new TelegramBot(token)
      
      const stopBot = async () => {
        console.log('Stopping bot...')
        await bot.stop()
        process.exit(0)
      }

      process.once('SIGINT', stopBot)
      process.once('SIGTERM', stopBot)

      bot.start().catch((error) => {
        console.error('Failed to start bot:', error)
        process.exit(1)
      })
  } catch (err) {
      console.error('Configuration Error:', err);
      process.exit(1);
  }
}
