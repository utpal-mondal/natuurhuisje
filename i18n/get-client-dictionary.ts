import type { Locale } from '@/i18n/config';

// Client-compatible dictionary function (no server-only)
const dictionaries = {
  en: async () => {
    const main = await import('@/i18n/dictionaries/en.json').then(module => module.default);
    const booking = await import('@/i18n/dictionaries/en/booking.json').then(module => module.default);
    return { ...main, ...booking };
  },
  nl: async () => {
    const main = await import('@/i18n/dictionaries/nl.json').then(module => module.default);
    const booking = await import('@/i18n/dictionaries/nl/booking.json').then(module => module.default);
    return { ...main, ...booking };
  },
  de: async () => {
    const main = await import('@/i18n/dictionaries/de.json').then(module => module.default);
    const booking = await import('@/i18n/dictionaries/de/booking.json').then(module => module.default);
    return { ...main, ...booking };
  },
  fr: async () => {
    const main = await import('@/i18n/dictionaries/fr.json').then(module => module.default);
    const booking = await import('@/i18n/dictionaries/fr/booking.json').then(module => module.default);
    return { ...main, ...booking };
  },
};

export async function getDictionary(locale: Locale) {
  try {
    const dictionary = await dictionaries[locale]();
    return dictionary;
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    // Fallback to English
    return dictionaries.en();
  }
}
