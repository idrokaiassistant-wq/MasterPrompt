export const locales = ['uz', 'en', 'ru', 'tr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'uz';
