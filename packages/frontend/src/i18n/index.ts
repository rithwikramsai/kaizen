// i18n scaffold — static lookup, no external package required.
// To migrate to react-i18next: install react-i18next + i18next, initialise an
// i18next instance here, export the provider, and replace t() calls with
// useTranslation() inside components.

import en from './locales/en.json'

type TranslationKey = keyof typeof en

export function t(key: TranslationKey): string {
  return en[key]
}
