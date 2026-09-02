import { Locale, defaultLocale, locales } from "@/i18n";

/**
 * Picks the best supported locale out of an `Accept-Language` header.
 *
 * Browsers do not send bare language codes: a French Chrome sends
 * `fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7`. So entries cannot be compared to our
 * locale list directly — each one has to be stripped of its quality value, and a
 * region-qualified tag has to fall back to its primary subtag (`fr-FR` -> `fr`).
 *
 * Entries are considered in quality order, highest first, and ties keep the order
 * the browser sent them in.
 */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const candidates = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";");
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const parsed = quality ? Number.parseFloat(quality.slice(2)) : 1;

      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isNaN(parsed) ? 0 : parsed,
      };
    })
    // `q=0` means "explicitly not acceptable", and `*` carries no information
    // about which of our locales to pick.
    .filter(({ tag, quality }) => tag !== "" && tag !== "*" && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of candidates) {
    if (locales.includes(tag)) {
      return tag as Locale;
    }

    const primarySubtag = tag.split("-")[0];
    if (locales.includes(primarySubtag)) {
      return primarySubtag as Locale;
    }
  }

  return defaultLocale;
}
