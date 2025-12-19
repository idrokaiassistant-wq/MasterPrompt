import { Context } from 'telegraf'

export interface BotContext extends Context {
  session: {
    currentPrompt?: string
    currentModel?: string
    language?: string
    state?: 'waiting_prompt' | 'waiting_model' | 'idle'
  }
}
