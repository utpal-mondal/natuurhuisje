import type { Locale } from './config';

const dictionaries = {
  en: () => import('./dictionaries/en/calendar.json').then((module) => module.default),
  nl: () => import('./dictionaries/nl/calendar.json').then((module) => module.default),
  de: () => import('./dictionaries/de/calendar.json').then((module) => module.default),
  fr: () => import('./dictionaries/fr/calendar.json').then((module) => module.default),
};

export const getCalendarDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};
