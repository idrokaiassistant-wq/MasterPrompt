import { BotContext } from '../types';
import { config, captureException } from '@prompt-master-pro/utils';

function sanitizeMarkdown(text: string): string {
    if (!text) return '';
    return text.replace(/([_*\[`])/g, '\\$1');
}

export const historyHandler = async (ctx: BotContext) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    
    try {
        const gatewayUrl = config.get('API_GATEWAY_URL');
        const apiKey = config.getSecret('INTERNAL_API_KEY');
        
        // Timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let response;
        try {
             response = await fetch(`${gatewayUrl}/api/user/${userId}/history`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                signal: controller.signal
            });
        } catch (fetchError) {
             console.error('History fetch error:', fetchError);
             return ctx.reply('⚠️ Server bilan bog\'lanishda xatolik yuz berdi.');
        } finally {
            clearTimeout(timeoutId);
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        
        const history = await response.json();
        
        if (history.length === 0) {
            await ctx.reply('📭 Tarix bo\'sh.');
            return;
        }
        
        const historyMessage = history.slice(0, 10).map((item: any, index: number) => 
            `${index + 1}. ${sanitizeMarkdown((item.prompt || '').substring(0, 50))}...`
        ).join('\n');
        
        await ctx.reply(`📋 *So'nggi Promptlar:*\n\n${historyMessage}`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: 'Barchasini ko\'rish', callback_data: 'history_all' },
                    { text: 'Tarixni tozalash', callback_data: 'history_clear' }
                ]]
            }
        });
        
    } catch (error) {
        captureException(error as Error);
        console.error('History handler error:', error);
        await ctx.reply('❌ Tarixni yuklashda xatolik yuz berdi.');
    }
};
