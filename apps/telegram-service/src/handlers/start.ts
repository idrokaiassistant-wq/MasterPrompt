import { BotContext } from '../types';

export const startHandler = async (ctx: BotContext) => {
  // Use a fallback or environment variable, ensuring it's a valid URL for the Mini App
  // Directing to /new page in the mini app
  const webAppUrl = 'https://masterprompt-production.up.railway.app/uz/new'; 
  
  const welcomeMessage = `
🚀 *Master Prompt*

Professional prompt muhandislik platformasi

*Mavjud buyruqlar:*
• /new - Yangi prompt yaratish
• /profile - Shaxsiy kabinet
• /subscribe - Obuna bo'lish
• /history - Tarixni ko'rish  
• /templates - Andozalar
• /settings - Sozlamalar
• /help - Yordam

*Imkoniyatlar:*
✅ AI yordamida prompt yaratish
✅ Ko'p modellar (GPT-4, Claude, Gemini)
✅ Andozalar boshqaruvi
✅ Ko'p tilli qo'llab-quvvatlash
✅ Telegram Mini App

Prompt yaratish uchun quyidagi tugmani bosing:
  `;
  
  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '📝 Prompt Yaratish', web_app: { url: webAppUrl } }
      ]]
    }
  });
};
