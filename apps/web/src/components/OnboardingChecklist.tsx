'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'framer-motion';
import { CheckCircle2, Circle, KeyRound, SlidersHorizontal, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePromptStore } from '@/store/promptStore';

type CredentialStatus = {
  hasOpenRouterKey: boolean;
  hasGoogleGeminiKey: boolean;
};

const DISMISS_KEY = 'pmpro_onboarding_dismissed_v1';

export function OnboardingChecklist() {
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'uz';
  const shouldReduceMotion = useReducedMotion();

  const { model, temperature, maxTokens, output, history } = usePromptStore();

  const [dismissed, setDismissed] = useState(false);
  const [creds, setCreds] = useState<CredentialStatus | null>(null);
  const [seenAdvancedSettings, setSeenAdvancedSettings] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    setSeenAdvancedSettings(localStorage.getItem('pmpro_seen_advanced_settings') === '1');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/credentials', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCreds({
          hasOpenRouterKey: Boolean(data?.hasOpenRouterKey),
          hasGoogleGeminiKey: Boolean(data?.hasGoogleGeminiKey),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCreds(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const requiredKeyOk = useMemo(() => {
    const isGoogle = String(model).startsWith('google/');
    if (!creds) return false;
    return isGoogle ? creds.hasGoogleGeminiKey : creds.hasOpenRouterKey;
  }, [creds, model]);

  const modelChosen = Boolean(model);
  const paramsAdjusted = Math.abs(Number(temperature) - 0.7) > 1e-6 || Number(maxTokens) !== 2000;
  const paramsDone = paramsAdjusted || seenAdvancedSettings;
  const hasGenerated = Boolean(output) || (history?.length ?? 0) > 0;

  const allDone = requiredKeyOk && modelChosen && paramsDone && hasGenerated;

  const openAdvancedSettings = () => {
    const section = document.getElementById('advanced-settings');
    section?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('advanced-settings-trigger')?.click();
    localStorage.setItem('pmpro_seen_advanced_settings', '1');
    setSeenAdvancedSettings(true);
  };

  const focusPromptInput = () => {
    const inputEl = document.getElementById('prompt-input') as HTMLTextAreaElement | null;
    inputEl?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'center' });
    inputEl?.focus();
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  if (dismissed || allDone) return null;

  const steps = [
    {
      key: 'credentials',
      done: requiredKeyOk,
      icon: KeyRound,
      label: t('stepCredentials'),
      action: (
        <Link href={`/${locale}/settings`}>
          <Button size="sm" variant="outline">
            {t('actionSettings')}
          </Button>
        </Link>
      ),
    },
    {
      key: 'model',
      done: modelChosen,
      icon: Sparkles,
      label: t('stepModel'),
      action: (
        <Button size="sm" variant="outline" onClick={openAdvancedSettings}>
          {t('actionAdvanced')}
        </Button>
      ),
    },
    {
      key: 'params',
      done: paramsDone,
      icon: SlidersHorizontal,
      label: t('stepParams'),
      action: (
        <Button size="sm" variant="outline" onClick={openAdvancedSettings}>
          {t('actionAdvanced')}
        </Button>
      ),
    },
    {
      key: 'generate',
      done: hasGenerated,
      icon: Circle,
      label: t('stepGenerate'),
      action: (
        <Button size="sm" variant="outline" onClick={focusPromptInput}>
          {tCommon('generate')}
        </Button>
      ),
    },
  ];

  return (
    <Card className="border-2 border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-r from-blue-50/40 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{t('title')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            {t('dismiss')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2">
                <div className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={step.done ? 'text-sm font-medium' : 'text-sm'}>{step.label}</span>
                </div>
                {!step.done && step.action}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
