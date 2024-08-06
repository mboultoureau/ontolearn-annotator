'use server';

import { LOCALE_COOKIE_NAME, Locale, defaultLocale, locales } from '@/i18n';
import { cookies, headers } from 'next/headers';


export async function getUserLocale() {
    if (cookies().has(LOCALE_COOKIE_NAME)) {
        return cookies().get(LOCALE_COOKIE_NAME)?.value;
    }

    const acceptedLanguages = headers().get("accept-language")?.split(",");
    const userLocale = acceptedLanguages?.find((lang) => locales.includes(lang as Locale)) ?? defaultLocale;

    return userLocale;
}

export async function setUserLocale(locale: Locale) {
  cookies().set(LOCALE_COOKIE_NAME, locale);
}