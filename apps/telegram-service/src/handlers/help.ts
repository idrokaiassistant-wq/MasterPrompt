import { BotContext } from '../types';

// Helper for Markdown sanitization
function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*\[`])/g, '\\$1');
}

export const helpHandler = async (ctx: BotContext) => {
    const helpMessage = `
❓ *Yordam va Ko'rsatmalar*

*Asosiy buyruqlar:*
• /start - Botni ishga tushirish
• /new - Yangi prompt yaratish
• /profile - Shaxsiy kabinet
• /subscribe - Obuna bo'lish
• /history - Tarixni ko'rish
• /templates - Andozalar
• /settings - Sozlamalar

*Prompt Yaratish:*
1. /new buyrug'ini bosing yoki "Prompt Yaratish" tugmasini tanlang
2. Mini App ochiladi
3. Maqsadingizni tasvirlab bering va modelni tanlang
4. Tayyor promptni oling

*Maslahatlar:*
• Tasvirlashda aniq bo'ling
• Qo'shimcha imkoniyatlar uchun veb-ilovadan foydalaning
• Ko'p ishlatiladigan promptlarni andoza sifatida saqlang

*Qo'llab-quvvatlash:*
Muammolar bo'lsa, @support\\_username bilan bog'laning
    `;
    
    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
};
