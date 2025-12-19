import { BotContext } from '../types';

export const newPromptHandler = async (ctx: BotContext) => {
    const webAppUrl = 'https://masterprompt-production.up.railway.app/uz/new';
    
    await ctx.reply(
        '📝 *Yangi Prompt Yaratish*\n\nPrompt yaratish uchun quyidagi tugmani bosing:',
        { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '📝 Prompt Yaratish', web_app: { url: webAppUrl } }
                ]]
            }
        }
    );
};
