import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { defaultLocale, locales, type Locale } from '../src/i18n/locales';

export default getRequestConfig(async ({ requestLocale }) => {
  console.log('--- i18n/request.ts executed (ROOT) ---');
  const locale = (await requestLocale) ?? defaultLocale;
  console.log('--- locale:', locale);
  if (!locales.includes(locale as Locale)) notFound();
  return {
    locale,
    messages: (await import(`../src/messages/${locale}.json`)).default,
  };
});
