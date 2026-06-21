export const locales = ["en", "vi", "ja"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  ja: "日本語",
};

export const localeShortLabels: Record<Locale, string> = {
  en: "EN",
  vi: "VI",
  ja: "JA",
};

const localePrefixPattern = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function normalizePathname(pathname: string): string {
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
}

export function getLocaleFromPathname(pathname: string): Locale {
  const normalized = normalizePathname(pathname);
  const match = normalized.match(localePrefixPattern);
  if (match && isLocale(match[1])) {
    return match[1];
  }
  return defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = normalizePathname(pathname);
  const stripped = normalized.replace(localePrefixPattern, "");
  return stripped === "" ? "/" : stripped;
}

export function localizePath(pathname: string, locale: Locale): string {
  const basePath = stripLocalePrefix(pathname);
  if (locale === defaultLocale) {
    return basePath;
  }
  return basePath === "/" ? `/${locale}` : `/${locale}${basePath}`;
}

export function toLanguageTag(locale: Locale): string {
  switch (locale) {
    case "vi":
      return "vi-VN";
    case "ja":
      return "ja-JP";
    default:
      return "en-US";
  }
}
