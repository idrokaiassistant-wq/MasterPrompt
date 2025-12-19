'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function HelpSheet() {
  const params = useParams();
  const locale = (params?.locale as string) || 'uz';
  const t = useTranslations('help');
  const tCommon = useTranslations('common');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" aria-label={t('button')}>
          <CircleHelp className="h-4 w-4" />
          <span className="hidden sm:inline">{t('button')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('subtitle')}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 text-sm">
          <div className="space-y-2">
            <h3 className="font-semibold">{t('step1Title')}</h3>
            <p className="text-muted-foreground">{t('step1Body')}</p>
            <Link href={`/${locale}/settings`} className="inline-block text-blue-600 hover:underline">
              {tCommon('settings')}
            </Link>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>{t('step1Bullet1')}</li>
              <li>{t('step1Bullet2')}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t('step2Title')}</h3>
            <p className="text-muted-foreground">{t('step2Body')}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t('step3Title')}</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>
                {t('step3Bullet1')}
              </li>
              <li>
                {t('step3Bullet2')}
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t('step4Title')}</h3>
            <p className="text-muted-foreground">{t('step4Body')}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
