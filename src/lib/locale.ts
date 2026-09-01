'use server';

import { LOCALE_COOKIE_NAME, Locale, defaultLocale, locales } from '@/i18n';
import { matchLocale } from '@/lib/accept-language';
import { cookies, headers } from 'next/headers';


/**
 * An explicit choice (the cookie set from the settings page) wins; otherwise the
 * browser's own preference is honoured, falling back to `defaultLocale`.
 */
export async function getUserLocale() {
    if (cookies().has(LOCALE_COOKIE_NAME)) {
        const locale = cookies().get(LOCALE_COOKIE_NAME)?.value;
        return locales.includes(locale as Locale) ? locale : defaultLocale;
    }

    return matchLocale(headers().get("accept-language"));
}

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persists an explicit language choice.
 *
 * `maxAge` matters: without it this is a session cookie, so the chosen language is
 * lost as soon as the browser closes and the user silently falls back to browser
 * detection.
 */
export async function setUserLocale(locale: Locale) {
  cookies().set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
  });
}