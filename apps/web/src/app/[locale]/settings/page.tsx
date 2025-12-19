'use client';

import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePromptStore } from '@/store/promptStore';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MODELS, getModelConfig } from '@/config/models';
import type { Model } from '@/store/promptStore';

export default function SettingsPage() {
  const t = useTranslations('settingsPage');
  const tCommon = useTranslations('common');
  const tAdvanced = useTranslations('advancedSettings');
  const {
    language,
    model,
    temperature,
    maxTokens,
    setModel,
    setTemperature,
    setMaxTokens,
  } = usePromptStore();

  const [openRouterKey, setOpenRouterKey] = useState('');
  const [googleGeminiKey, setGoogleGeminiKey] = useState('');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [showGoogleGeminiKey, setShowGoogleGeminiKey] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<{
    hasOpenRouterKey: boolean;
    hasGoogleGeminiKey: boolean;
    sources: { openRouter: 'cookie' | 'env' | 'none'; googleGemini: 'cookie' | 'env' | 'none' };
  } | null>(null);
  const [legacyKeysDetected, setLegacyKeysDetected] = useState<{
    openRouterKey: string | null;
    googleGeminiKey: string | null;
  } | null>(null);

  const refreshCredentialStatus = async () => {
    try {
      const res = await fetch('/api/credentials', { cache: 'no-store' });
      const data = await res.json();
      setCredentialStatus(data);
    } catch {
      setCredentialStatus(null);
    }
  };

  useEffect(() => {
    refreshCredentialStatus();

    const legacyOpenRouterKey = localStorage.getItem('openrouter_api_key');
    const legacyGoogleGeminiKey = localStorage.getItem('google_gemini_api_key');
    if (legacyOpenRouterKey || legacyGoogleGeminiKey) {
      setLegacyKeysDetected({
        openRouterKey: legacyOpenRouterKey,
        googleGeminiKey: legacyGoogleGeminiKey,
      });
    }
  }, []);

  const saveCredentials = async (payload: Record<string, string>) => {
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || tCommon('error'));
    await refreshCredentialStatus();
    return data;
  };

  const handleSaveOpenRouter = async () => {
    const trimmed = openRouterKey.trim();
    if (!trimmed) {
      toast.error(t('enterOpenrouter'));
      return;
    }
    try {
      await saveCredentials({ openRouterKey: trimmed });
      localStorage.removeItem('openrouter_api_key');
      setOpenRouterKey('');
      toast.success(t('savedOpenrouter'));
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  const handleClearOpenRouter = async () => {
    try {
      await saveCredentials({ openRouterKey: '' });
      toast.success(t('clearedOpenrouter'));
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  const handleSaveGoogleGemini = async () => {
    const trimmed = googleGeminiKey.trim();
    if (!trimmed) {
      toast.error(t('enterGemini'));
      return;
    }
    try {
      await saveCredentials({ googleGeminiKey: trimmed });
      localStorage.removeItem('google_gemini_api_key');
      setGoogleGeminiKey('');
      toast.success(t('savedGemini'));
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  const handleClearGoogleGemini = async () => {
    try {
      await saveCredentials({ googleGeminiKey: '' });
      toast.success(t('clearedGemini'));
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  const handleMigrateLegacyKeys = async () => {
    if (!legacyKeysDetected) return;
    const payload: Record<string, string> = {};
    if (legacyKeysDetected.openRouterKey) payload.openRouterKey = legacyKeysDetected.openRouterKey;
    if (legacyKeysDetected.googleGeminiKey) payload.googleGeminiKey = legacyKeysDetected.googleGeminiKey;

    try {
      await saveCredentials(payload);
      localStorage.removeItem('openrouter_api_key');
      localStorage.removeItem('google_gemini_api_key');
      setLegacyKeysDetected(null);
      toast.success(t('migrated'));
    } catch (error: any) {
      toast.error(error.message || tCommon('error'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {legacyKeysDetected && (
            <Card className="border-2 border-amber-300 dark:border-amber-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚠️</span>
                  {t('securityWarningTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('securityWarningDescription')}
                </p>
                <Button onClick={handleMigrateLegacyKeys} className="w-full">
                  {t('migrateLegacy')}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔑</span>
                {t('openrouterTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentialStatus && (
                <p className="text-xs text-muted-foreground">
                  {t('statusLabel')}:{' '}
                  {credentialStatus.sources.openRouter === 'cookie'
                    ? t('statusSecure')
                    : credentialStatus.sources.openRouter === 'env'
                      ? t('statusEnv')
                      : t('statusMissing')}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="openRouterKey">OpenRouter API Key</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('openrouterDescription')}
                </p>
                <div className="flex gap-2">
                  <Input
                    id="openRouterKey"
                    type={showOpenRouterKey ? 'text' : 'password'}
                    value={openRouterKey}
                    onChange={(e) => setOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  >
                    {showOpenRouterKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {t('openrouterLink')}
                  </a>
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveOpenRouter} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {tCommon('save')}
                </Button>
                <Button onClick={handleClearOpenRouter} variant="outline">
                  {t('clear')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🤖</span>
                {t('geminiTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentialStatus && (
                <p className="text-xs text-muted-foreground">
                  {t('statusLabel')}:{' '}
                  {credentialStatus.sources.googleGemini === 'cookie'
                    ? t('statusSecure')
                    : credentialStatus.sources.googleGemini === 'env'
                      ? t('statusEnv')
                      : t('statusMissing')}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="googleGeminiKey">Google Gemini API Key</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('geminiDescription')}
                </p>
                <div className="flex gap-2">
                  <Input
                    id="googleGeminiKey"
                    type={showGoogleGeminiKey ? 'text' : 'password'}
                    value={googleGeminiKey}
                    onChange={(e) => setGoogleGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowGoogleGeminiKey(!showGoogleGeminiKey)}
                  >
                    {showGoogleGeminiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {t('geminiLink')}
                  </a>
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveGoogleGemini} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {tCommon('save')}
                </Button>
                <Button onClick={handleClearGoogleGemini} variant="outline">
                  {t('clear')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                {t('advancedTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{tAdvanced('model')}</Label>
                <Select
                  value={model}
                  onValueChange={(value) => setModel(value as Model)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tAdvanced('selectModel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => {
                      const config = getModelConfig(m.value);
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <SelectItem key={m.value} value={m.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{m.label}</span>
                            {config.badge && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full text-white ${config.badgeColor}`}
                              >
                                {config.badge}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {tAdvanced(getModelConfig(model)?.descriptionKey || 'geminiFlash25')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>{tAdvanced('temperature')}</Label>
                  <span className="text-sm font-medium">{temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([val]) => setTemperature(val)}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  {tAdvanced('temperatureDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="maxTokens">{tAdvanced('maxTokens')}</Label>
                </div>
                <Input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  min={100}
                  max={8000}
                  step={100}
                />
                <p className="text-xs text-muted-foreground">
                  {tAdvanced('maxTokensDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{tAdvanced('language')}</Label>
                <p className="text-sm text-muted-foreground uppercase">{language}</p>
                <p className="text-xs text-muted-foreground">
                  {tAdvanced('languageDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}