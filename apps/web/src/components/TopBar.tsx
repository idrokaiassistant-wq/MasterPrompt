'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun, Globe, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpSheet } from '@/components/HelpSheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePromptStore } from '@/store/promptStore';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { getModelConfig } from '@/config/models';
import { useReducedMotion } from 'framer-motion';

const languages = [
  { code: 'en', label: 'ENG', flag: '🇬🇧' },
  { code: 'uz', label: 'UZB', flag: '🇺🇿' },
  { code: 'ru', label: 'RUS', flag: '🇷🇺' },
  { code: 'tr', label: 'TUR', flag: '🇹🇷' },
];

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('topBar');
  const tSummary = useTranslations('summary');
  const { language, setLanguage, model, temperature, maxTokens } = usePromptStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const shouldReduceMotion = useReducedMotion();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);
    const currentLocale = params.locale || 'uz';
    const newPath = pathname.replace(`/${currentLocale}`, `/${lang}`);
    router.push(newPath || `/${lang}`);
  };

  const currentLanguage = languages.find((l) => l.code === language);
  const modelLabel = getModelConfig(model)?.label || model;

  const openAdvancedSettings = () => {
    const section = document.getElementById('advanced-settings');
    section?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('advanced-settings-trigger')?.click();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent whitespace-nowrap">
            {t('title')}
          </h1>
        </div>

        {/* Center: Model Summary (Hidden on very small screens, visible on md+) */}
        <div className="hidden lg:flex items-center absolute left-1/2 transform -translate-x-1/2 gap-3 text-sm border px-4 py-1.5 rounded-full bg-muted/40 backdrop-blur-sm shadow-sm hover:bg-muted/60 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{tSummary('model')}:</span>
            <span className="font-semibold">{modelLabel}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{tSummary('temperature')}:</span>
            <span className="font-semibold">{Number(temperature).toFixed(1)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{tSummary('maxTokens')}:</span>
            <span className="font-semibold">{maxTokens}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            onClick={openAdvancedSettings}
            className="h-6 w-6 rounded-full hover:bg-accent"
            title={tSummary('edit')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile Summary (Compact) */}
        <div className="lg:hidden hidden md:flex items-center gap-2 text-xs border px-3 py-1 rounded-full bg-muted/40 mx-4">
           <span className="font-medium truncate max-w-[120px]">{modelLabel}</span>
           <Button
            variant="ghost"
            size="icon"
            onClick={openAdvancedSettings}
            className="h-5 w-5"
            title={tSummary('edit')}
          >
            <SlidersHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <HelpSheet />
          
          {/* Settings Trigger for Mobile (if not shown in center) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={openAdvancedSettings}
            className="md:hidden h-9 w-9"
            title={tSummary('edit')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLanguage?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={language === lang.code ? 'bg-accent' : ''}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="gap-2"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">{t('themeToggle')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
