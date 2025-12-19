import { BotContext } from '../types';

export const settingsHandler = async (ctx: BotContext) => {
    await ctx.reply('⚙️ *Sozlamalar*\n\nTanlang:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Til', callback_data: 'settings_language' }],
          [{ text: '🤖 Asosiy Model', callback_data: 'settings_model' }],
          [{ text: '🔔 Xabarnomalar', callback_data: 'settings_notifications' }],
          [{ text: '❓ Yordam', callback_data: 'settings_help' }]
        ]
      }
    });
};

export const languageSettingsHandler = async (ctx: BotContext) => {
    await ctx.reply('🌐 *Select Language:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇺🇿 Uzbek', callback_data: 'lang_uz' },
            { text: '🇺🇸 English', callback_data: 'lang_en' }
          ],
          [
            { text: '🇷🇺 Russian', callback_data: 'lang_ru' },
            { text: '🇹🇷 Turkish', callback_data: 'lang_tr' }
          ]
        ]
      }
    });
};

export const languageSelectionHandler = async (ctx: BotContext) => {
    if (!ctx.match) return;
    // @ts-ignore
    const language = ctx.match[1];
    ctx.session.language = language;
    
    const messages = {
      uz: '🇺🇿 Til o‘zbekcha ga o‘zgartirildi',
      en: '🇺🇸 Language changed to English',
      ru: '🇷🇺 Язык изменен на русский',
      tr: '🇹🇷 Dil türkçe olarak değiştirildi'
    };
    
    // @ts-ignore
    await ctx.answerCbQuery(messages[language as keyof typeof messages]);
};
