'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePromptStore, Model } from '@/store/promptStore';
import { MODELS } from '@/config/models';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Brain } from 'lucide-react';

export function AdvancedSettings() {
  const t = useTranslations('advancedSettings');
  const { model, setModel, temperature, setTemperature, maxTokens, setMaxTokens } = usePromptStore();
  const shouldReduceMotion = useReducedMotion();

  const selectedModel = MODELS.find(m => m.value === model);

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      onValueChange={(value) => {
        if (value) localStorage.setItem('pmpro_seen_advanced_settings', '1');
      }}
    >
      <AccordionItem value="settings" className="border-none">
        <AccordionTrigger id="advanced-settings-trigger" className="hover:no-underline px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-2">
            <motion.div
              animate={shouldReduceMotion ? undefined : { rotate: [0, 360] }}
              transition={shouldReduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('title')}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-6 px-2">
          {/* Model Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="model" className="text-sm font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {t('model')}
              </label>
              {selectedModel?.isFree && (
                shouldReduceMotion ? (
                  <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold">
                    FREE
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold"
                  >
                    FREE
                  </motion.div>
                )
              )}
            </div>

            <Select value={model} onValueChange={(value) => setModel(value as Model)}>
              <SelectTrigger id="model" className="w-full h-auto min-h-[60px] border-2 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
              <SelectValue>
                  {selectedModel ? (
                    <div className="flex items-center gap-3 py-1">
                      <div className={`p-2 rounded-lg ${selectedModel.badgeColor} bg-opacity-10`}>
                        <selectedModel.icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{selectedModel.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${selectedModel.badgeColor}`}>
                            {selectedModel.badge}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{t(`modelDescriptions.${selectedModel.descriptionKey}`)}</span>
                      </div>
                    </div>
                  ) : (
                    t('modelPlaceholder')
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[400px] z-50 border-2 bg-white dark:bg-gray-950">
                {/* Free Models */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b bg-white dark:bg-gray-950">
                  {t('freeModels')}
                </div>
                {MODELS.filter(m => m.isFree).map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    className="cursor-pointer bg-white dark:bg-gray-950 hover:bg-blue-50 dark:hover:bg-blue-950 my-1 rounded-lg h-auto min-h-[60px]"
                  >
                    <div className="flex items-center gap-3 py-2">
                      <div className={`p-2 rounded-lg ${m.badgeColor} bg-opacity-10`}>
                        <m.icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{m.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{t(`modelDescriptions.${m.descriptionKey}`)}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}

                {/* Premium Models */}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-t mt-2 bg-white dark:bg-gray-950">
                  {t('premiumModels')}
                </div>
                {MODELS.filter(m => !m.isFree).map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    className="cursor-pointer bg-white dark:bg-gray-950 hover:bg-purple-50 dark:hover:bg-purple-950 my-1 rounded-lg h-auto min-h-[60px]"
                  >
                    <div className="flex items-center gap-3 py-2">
                      <div className={`p-2 rounded-lg ${m.badgeColor} bg-opacity-10`}>
                        <m.icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{m.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{t(`modelDescriptions.${m.descriptionKey}`)}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="temperature" className="text-sm font-semibold">
                {t('temperature')}
              </label>
              <span className="text-xs text-muted-foreground">{Number(temperature).toFixed(1)}</span>
            </div>
            <input
              id="temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="maxTokens" className="text-sm font-semibold">
                {t('maxTokens')}
              </label>
              <span className="text-xs text-muted-foreground">{maxTokens}</span>
            </div>
            <Input
              id="maxTokens"
              type="number"
              min={1}
              max={8192}
              step={1}
              value={maxTokens}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value || '0', 10);
                if (!Number.isFinite(next)) return;
                setMaxTokens(Math.min(Math.max(next, 1), 8192));
              }}
            />
          </div>

        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
