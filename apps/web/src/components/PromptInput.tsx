'use client';

import { useTranslations } from 'next-intl';
import { Type, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { usePromptStore } from '@/store/promptStore';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { VoiceInput } from './VoiceInput';
import { cn } from '@/lib/utils';

export function PromptInput() {
  const t = useTranslations('promptInput');
  const { input, setInput, clearInput, language } = usePromptStore();
  const [isImproving, setIsImproving] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleClear = () => {
    clearInput();
    setIsInvalid(false);
    toast.success(t('clear'));
  };

  const handleImprove = async () => {
    if (!input.trim()) {
      setIsInvalid(true);
      toast.error(t('improveError'));
      return;
    }

    setIsImproving(true);
    setIsInvalid(false);

    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          language,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('improveError'));
      }

      const data = await response.json();
      setInput(data.output);
      toast.success(t('improveSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('improveError'));
      console.error('Improve error:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const wordCount = input.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-4">
      <div className="relative group">
        {/* Gradient border effect - optimized */}
        <div className={cn(
          "absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl transition-all duration-300 blur opacity-0 group-hover:opacity-30",
          isInvalid && "opacity-100 from-red-500 to-red-600 group-hover:opacity-100"
        )} />

        <div className="relative">
          <Textarea
            id="prompt-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (e.target.value.trim()) setIsInvalid(false);
            }}
            placeholder={t('placeholder')}
            className={cn(
              "min-h-[200px] resize-none pr-14 text-base border-2 rounded-xl transition-all duration-200",
              "bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900",
              "focus-visible:ring-2 focus-visible:ring-offset-0",
              isInvalid 
                ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 placeholder:text-red-400/50" 
                : "border-gray-200 dark:border-gray-700 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            )}
          />

          <div className="absolute bottom-3 right-3">
            <VoiceInput onListeningChange={setIsVoiceListening} />
          </div>
        </div>
      </div>

      {/* Action buttons and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {input.length > 0 ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 w-full sm:w-auto"
          >
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="flex-1 sm:flex-none"
            >
              <Button
                onClick={handleImprove}
                disabled={isImproving || isVoiceListening}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all"
                size="sm"
                title={t('improveTooltip')}
              >
                {isImproving ? (
                  <>
                    {shouldReduceMotion ? (
                      <Wand2 className="mr-2 h-4 w-4" />
                    ) : (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                      </motion.div>
                    )}
                    {t('improving')}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t('improve')}
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            >
              <Button
                onClick={handleClear}
                disabled={isImproving || isVoiceListening}
                variant="outline"
                size="sm"
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('clear')}
              </Button>
            </motion.div>
          </motion.div>
        ) : <div />}

        {/* Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
              <Type className="h-3.5 w-3.5" />
              <span className="font-medium">{wordCount}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-medium">{input.length}</span>
            </div>
          </div>
          
          {input.length > 0 && (shouldReduceMotion ? (
            <div className="text-xs text-muted-foreground hidden sm:block">✨ {t('ready')}</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-muted-foreground hidden sm:block"
            >
              ✨ {t('ready')}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
