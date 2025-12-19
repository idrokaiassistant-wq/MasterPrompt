import { BotContext } from '../types';

export const subscribeHandler = async (ctx: BotContext) => {
    const subMsg = `
💎 *Obuna Paketlari*

Master Prompt imkoniyatlaridan to'liq foydalanish uchun obuna bo'ling!

1️⃣ *Pro Oy* - 50,000 UZS
• Cheksiz promptlar
• GPT-4 va Claude modellari
• Tezkor javoblar

2️⃣ *Pro Yil* - 500,000 UZS
• Barcha Pro imkoniyatlari
• 2 oy bepul!

To'lov turini tanlang:
    `;
    
    await ctx.reply(subMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Click', callback_data: 'pay_click' }, { text: 'Payme', callback_data: 'pay_payme' }]
            ]
        }
    });
};
