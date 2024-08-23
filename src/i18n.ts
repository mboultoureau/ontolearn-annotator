import deepmerge from 'deepmerge';
import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from './lib/locale';

export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const locales: string[] = ['en', 'fr', 'ja'];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  const locale = await getUserLocale();
  const userMessages = (await import(`@/messages/${locale}.json`)).default;
  const defaultMessages = (await import(`@/messages/en.json`)).default;
  const messages = deepmerge(defaultMessages, userMessages);

  return {
    locale,
    messages: messages
  };
});