import { BotContext } from '../types';
import { config, captureException } from '@prompt-master-pro/utils';

function sanitizeMarkdown(text: string): string {
    if (!text) return '';
    return text.replace(/([_*\[`])/g, '\\$1');
}

export const templatesHandler = async (ctx: BotContext) => {
    try {
        const gatewayUrl = config.get('API_GATEWAY_URL');
        const apiKey = config.getSecret('INTERNAL_API_KEY');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let response;
        try {
            response = await fetch(`${gatewayUrl}/api/templates`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                signal: controller.signal
            });
        } catch (fetchError) {
             console.error('Templates fetch error:', fetchError);
             return ctx.reply('⚠️ Server bilan bog\'lanishda xatolik yuz berdi.');
        } finally {
            clearTimeout(timeoutId);
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch templates');
        }
        
        const templates = await response.json();
        
        if (templates.length === 0) {
            await ctx.reply('📭 Andozalar mavjud emas.');
            return;
        }
        
        const templatesMessage = templates.slice(0, 5).map((template: any, index: number) => 
            `${index + 1}. *${sanitizeMarkdown(template.title)}*\n${sanitizeMarkdown(template.description || 'No description')}`
        ).join('\n\n');
        
        await ctx.reply(`📋 *Mavjud Andozalar:*\n\n${templatesMessage}`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    templates.slice(0, 5).map((template: any) => ({
                        text: template.title,
                        callback_data: `template_${template.id}`
                    })),
                    [{ text: 'Barchasini ko\'rish', callback_data: 'templates_all' }]
                ]
            }
        });
        
    } catch (error) {
        captureException(error as Error);
        console.error('Templates handler error:', error);
        await ctx.reply('❌ Andozalarni yuklashda xatolik yuz berdi.');
    }
};

export const templateSelectionHandler = async (ctx: BotContext) => {
    if (!ctx.match) return;
    // @ts-ignore
    const templateId = ctx.match[1];
    
    try {
        const gatewayUrl = config.get('API_GATEWAY_URL');
        const apiKey = config.getSecret('INTERNAL_API_KEY');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let response;
        try {
            response = await fetch(`${gatewayUrl}/api/templates/${templateId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                signal: controller.signal
            });
        } catch (fetchError) {
             console.error('Template detail fetch error:', fetchError);
             return ctx.answerCbQuery('⚠️ Server bilan bog\'lanishda xatolik yuz berdi.');
        } finally {
            clearTimeout(timeoutId);
        }
        
        if (!response.ok) {
            throw new Error('Template not found');
        }
        
        const template = await response.json();
        
        await ctx.reply(
            `📋 *Template: ${sanitizeMarkdown(template.title)}*\n\n${sanitizeMarkdown(template.content)}`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Use Template', callback_data: `use_template_${templateId}` },
                        { text: '🔖 Save', callback_data: `save_template_${templateId}` }
                    ]]
                }
            }
        );
        
    } catch (error) {
        captureException(error as Error);
        await ctx.answerCbQuery('❌ Template not found');
    }
};
