'use client';

import { useTranslations } from 'next-intl';
import { Copy, Check, Sparkles, FileText, Hash, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { usePromptStore } from '@/store/promptStore';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/utils';

export function OutputCard() {
  const t = useTranslations('output');
  const { output, setOutput } = usePromptStore();
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleCopy = async () => {
    try {
      await copyToClipboard(output);
      setCopied(true);
      toast.success(t('copySuccess'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('copyError'));
    }
  };

  const handleDelete = () => {
    setOutput('');
  };

  if (!output) return null;

  const wordCount = output.trim().split(/\s+/).length;
  const charCount = output.length;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      {/* Gradient glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-violet-500 to-pink-500 rounded-2xl blur-lg opacity-20 animate-pulse motion-reduce:animate-none" />

      <Card className="relative border-2 border-primary/20 shadow-2xl overflow-hidden bg-background/50 backdrop-blur-sm">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />

        <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 via-secondary/30 to-background">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={shouldReduceMotion ? false : { rotate: 0 }}
                animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                transition={shouldReduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-lg"
              >
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-violet-500 to-pink-500 bg-clip-text text-transparent">
                  {t('title')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                {shouldReduceMotion ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      "w-full sm:w-auto transition-all duration-200 font-medium",
                      copied
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-none"
                        : "bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-600 text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('copied')}!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        {t('copy')}
                      </>
                    )}
                  </Button>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={copied ? 'check' : 'copy'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleCopy}
                        className={cn(
                          "w-full sm:w-auto transition-all duration-200 font-medium",
                          copied
                            ? "bg-green-600 hover:bg-green-700 text-white shadow-none"
                            : "bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-600 text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        )}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t('copied')}!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('copy')}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white h-[40px] rounded-md px-4 delete-btn danger-btn"
                aria-label="O'chirish"
                role="button"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                O'chirish
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-muted-foreground">{t('words')}:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{wordCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Hash className="h-4 w-4" />
              </div>
              <span className="text-muted-foreground">{t('characters')}:</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{charCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="relative group">
            {/* Content container with gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity blur" />

            <div className="relative rounded-xl bg-gray-50 dark:bg-gray-900/80 p-6 overflow-x-auto border border-gray-200 dark:border-gray-800 shadow-inner">
              {shouldReduceMotion ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 m-0">
                    {output}
                  </pre>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="prose prose-sm max-w-none dark:prose-invert"
                >
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 m-0">
                    {output}
                  </pre>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom info */}
          {shouldReduceMotion ? (
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/30 border border-primary/10">
              <p className="text-xs text-center text-muted-foreground">💡 {t('tip')}</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/30 border border-primary/10"
            >
              <p className="text-xs text-center text-muted-foreground">
                💡 {t('tip')}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
