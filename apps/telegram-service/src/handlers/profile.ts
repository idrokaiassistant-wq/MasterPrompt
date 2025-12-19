import { BotContext } from '../types';
import { config, captureException } from '@prompt-master-pro/utils';

// Helper for Markdown sanitization
function sanitizeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*\[`])/g, '\\$1');
}

export const profileHandler = async (ctx: BotContext) => {
    const userId = ctx.from?.id;
    try {
        const gatewayUrl = config.get('API_GATEWAY_URL');
        // Add a timeout to the fetch request to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        let response;
        try {
             response = await fetch(`${gatewayUrl}/api/user/profile/${userId}`, {
                signal: controller.signal
            });
        } catch (fetchError) {
             console.error('Profile fetch error:', fetchError);
             return ctx.reply('⚠️ Server bilan bog\'lanishda xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.');
        } finally {
            clearTimeout(timeoutId);
        }
        
        if (!response.ok) {
            console.error(`Profile fetch failed with status: ${response.status}`);
            return ctx.reply('❌ Profil ma\'lumotlarini olib bo\'lmadi.');
        }

        const user = await response.json();
        const subName = user.subscription ? user.subscription.name : 'Free';
        const expires = user.subExpiresAt ? new Date(user.subExpiresAt).toLocaleDateString() : '-';

        const profileMsg = `
👤 *Shaxsiy Kabinet*

🆔 ID: \`${user.telegramId}\`
👤 Ism: ${sanitizeMarkdown(user.firstName || 'Kiritilmagan')}
📞 Telefon: ${sanitizeMarkdown(user.phone || 'Kiritilmagan')}
💰 Balans: ${user.balance} UZS

💎 *Obuna:* ${subName}
📅 Tugash vaqti: ${expires}
        `;

        await ctx.reply(profileMsg, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💳 Obunani yangilash', callback_data: 'subscribe_menu' }],
                    [{ text: '✏️ Profilni tahrirlash', callback_data: 'edit_profile' }]
                ]
            }
        });

    } catch (error) {
        captureException(error as Error);
        console.error('Profile handler error:', error);
        ctx.reply('❌ Xatolik yuz berdi.');
    }
};
