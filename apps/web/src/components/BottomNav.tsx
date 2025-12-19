'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, FileText, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Sparkles, key: 'generate' },
  { href: '/templates', icon: FileText, key: 'templates' },
  { href: '/history', icon: History, key: 'history' },
  { href: '/settings', icon: Settings, key: 'settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale || 'uz';
  const t = useTranslations('common');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname === fullHref;
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


