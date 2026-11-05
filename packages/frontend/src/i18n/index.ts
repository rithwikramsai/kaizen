import { createContext, useContext, useState, useCallback } from 'react'
import en from './locales/en.json'
import hi from './locales/hi.json'
import te from './locales/te.json'
import ta from './locales/ta.json'
import kn from './locales/kn.json'
import mr from './locales/mr.json'
import bn from './locales/bn.json'

export type LangCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'mr' | 'bn'

export const LANGUAGES: { code: LangCode; label: string; native: string }[] = [
  { code: 'en', label: 'English',    native: 'English'    },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी'       },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు'     },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்'      },
  { code: 'kn', label: 'Kannada',    native: 'ಕನ್ನಡ'      },
  { code: 'mr', label: 'Marathi',    native: 'मराठी'      },
  { code: 'bn', label: 'Bengali',    native: 'বাংলা'      },
]

const LOCALES: Record<LangCode, Record<string, string>> = { en, hi, te, ta, kn, mr, bn }

const STORAGE_KEY = 'kaizen_lang'

export type TranslationKey = keyof typeof en

// ─── Global fallback (used outside React tree) ────────────────────────────────
let _activeLang: LangCode = (localStorage.getItem(STORAGE_KEY) as LangCode) || 'en'

export function t(key: TranslationKey): string {
  return (LOCALES[_activeLang]?.[key] ?? LOCALES.en[key]) as string
}

// ─── React context ────────────────────────────────────────────────────────────
import { createElement, type ReactNode } from 'react'

interface I18nCtx {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: (key: TranslationKey) => string
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const I18nContext = createContext<I18nCtx>(null!)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(
    (localStorage.getItem(STORAGE_KEY) as LangCode) || 'en'
  )

  const setLang = useCallback((l: LangCode) => {
    _activeLang = l
    localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }, [])

  const translate = useCallback(
    (key: TranslationKey) => (LOCALES[lang]?.[key] ?? LOCALES.en[key]) as string,
    [lang]
  )

  return createElement(I18nContext.Provider, { value: { lang, setLang, t: translate } }, children)
}

export function useI18n() {
  return useContext(I18nContext)
}
