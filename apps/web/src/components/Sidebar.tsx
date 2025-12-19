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

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale || 'uz';
  const t = useTranslations('common');

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 border-r bg-background flex-col p-4">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname === fullHref || pathname?.startsWith(fullHref + '/');
          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

