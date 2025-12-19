'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { PromptInput } from '@/components/PromptInput';
import { AdvancedSettings } from '@/components/AdvancedSettings';
import { OnboardingChecklist } from '@/components/OnboardingChecklist';
import { OutputCard } from '@/components/OutputCard';
import { OutputSkeleton } from '@/components/OutputSkeleton';
import { TipsSection } from '@/components/TipsSection';
import { BottomNav } from '@/components/BottomNav';
import { usePromptStore } from '@/store/promptStore';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';

export default function HomePage() {
  const t = useTranslations('common');
  const tHome = useTranslations('home');
  const shouldReduceMotion = useReducedMotion();
  const {
    input,
    output,
    model,
    temperature,
    maxTokens,
    language,
    isLoading,
    setIsLoading,
    setOutput,
    addToHistory,
  } = usePromptStore();

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error(tHome('promptRequired'));
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      // 1. Avval promptni yaxshilaymiz (agar u juda qisqa bo'lmasa)
      let optimizedInput = input;
      
      // Faqat qisqa va o'rta uzunlikdagi promptlarni avtomatik yaxshilaymiz
      // Juda uzun promptlar allaqachon yaxshi yozilgan bo'lishi mumkin
      if (input.length < 1000) {
        try {
          const improveResponse = await fetch('/api/improve-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input, language }),
          });
          
          if (improveResponse.ok) {
            const improveData = await improveResponse.json();
            if (improveData.output) {
              optimizedInput = improveData.output;
              // Foydalanuvchiga bildirish
              toast.success(t('promptOptimized')); 
            }
          }
        } catch (err) {
          console.warn('Auto-improve failed, using original input', err);
        }
      }

      // 2. Keyin yaxshilangan prompt asosida natija olamiz
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: optimizedInput, // Yaxshilangan promptni yuboramiz
          model,
          temperature,
          maxTokens,
          language,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('error'));
      }

      const data = await response.json();
      setOutput(data.output);

      addToHistory({
        input: optimizedInput, // Tarixga ham yaxshilanganini saqlaymiz
        output: data.output,
        model,
        language,
      });

      toast.success(tHome('generateSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('error'));
      console.error('Generate error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main 
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 md:ml-64 container mx-auto px-4 py-8 pb-24 md:pb-8 min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out scroll-smooth focus:outline-none"
        >
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 relative">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6 sm:pt-8">
                <div className="space-y-6">
                  <OnboardingChecklist />
                  <PromptInput />
                  {/* SummaryBar removed as it is now in TopBar */}
                  <div id="advanced-settings">
                    <AdvancedSettings />
                  </div>
                </div>
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                  className="mt-8"
                >
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !input.trim()}
                    className="w-full h-12 md:h-14 text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group rounded-xl"
                    size="lg"
                  >
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 motion-reduce:transition-none" />

                    {isLoading ? (
                      <>
                        {shouldReduceMotion ? (
                          <Sparkles className="mr-2 h-5 w-5" />
                        ) : (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="mr-2 h-5 w-5" />
                          </motion.div>
                        )}
                        <span className="font-semibold">{t('loading')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        <span className="font-semibold">{t('generate')}</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {output && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2 }}
            >
              <OutputCard />
            </motion.div>
          )}
          {isLoading && !output && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.1 }}
            >
              <OutputSkeleton />
            </motion.div>
          )}

          <TipsSection />
        </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
