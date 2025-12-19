'use client';

import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Copy } from 'lucide-react';
import { usePromptStore } from '@/store/promptStore';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import { useEffect, useMemo, useState } from 'react';

export default function HistoryPage() {
  const t = useTranslations('historyPage');
  const tOutput = useTranslations('output');
  const { history, deleteHistoryItem, clearHistory, setInput, setOutput } =
    usePromptStore();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale || 'uz';
  const shouldReduceMotion = useReducedMotion();
  const pageSize = 10;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [query, setQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [history.length, query, modelFilter, languageFilter]);

  const availableModels = useMemo(
    () => Array.from(new Set(history.map((h) => h.model))).sort(),
    [history]
  );
  const availableLanguages = useMemo(
    () => Array.from(new Set(history.map((h) => h.language))).sort(),
    [history]
  );

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((item) => {
      if (modelFilter !== 'all' && item.model !== modelFilter) return false;
      if (languageFilter !== 'all' && item.language !== languageFilter) return false;
      if (!q) return true;
      const haystack = `${item.input}\n${item.output}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [history, query, modelFilter, languageFilter]);

  const hasActiveFilters = query.trim() !== '' || modelFilter !== 'all' || languageFilter !== 'all';

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      toast.success(tOutput('copySuccess'));
    } catch {
      toast.error(tOutput('copyError'));
    }
  };

  const handleUse = (input: string, output: string) => {
    setInput(input);
    setOutput(output);
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              {history.length > 0 && (
                <Button variant="outline" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('clearAll')}
                </Button>
              )}
            </div>

            {history.length > 0 && (
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <SelectValue placeholder={t('filterModel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allModels')}</SelectItem>
                      {availableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder={t('filterLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allLanguages')}</SelectItem>
                      {availableLanguages.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setModelFilter('all');
                        setLanguageFilter('all');
                      }}
                    >
                      {t('resetFilters')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {t('empty')}
              </CardContent>
            </Card>
          ) : filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                {t('noResults')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistory.slice(0, visibleCount).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { delay: Math.min(index * 0.05, 0.3) }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {new Date(item.createdAt).toLocaleString(String(locale))}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUse(item.input, item.output)}
                          >
                            {t('use')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(item.output)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHistoryItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-1">{t('inputLabel')}:</p>
                        <p className="text-sm text-muted-foreground">
                          {item.input.substring(0, 100)}
                          {item.input.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">{t('outputLabel')}:</p>
                        <p className="text-sm text-muted-foreground">
                          {item.output.substring(0, 200)}
                          {item.output.length > 200 ? '...' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{t('modelLabel')}: {item.model}</span>
                        <span>•</span>
                        <span>{t('languageLabel')}: {item.language}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {filteredHistory.length > visibleCount && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setVisibleCount((c) => Math.min(c + pageSize, filteredHistory.length))
                  }
                  className="w-full"
                >
                  {t('loadMore')} ({Math.min(visibleCount, filteredHistory.length)}/{filteredHistory.length})
                </Button>
              )}
            </div>
          )}
        </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
