import { createContext, ReactNode, useContext, useState } from 'react';
import { createInstance, TOptions } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ja } from './locales/ja';
import { ko } from './locales/ko';

export type Language = 'ko' | 'ja';
export type MessageKey = keyof typeof ko;
export type Translate = (key: MessageKey, options?: TOptions) => string;
export const LANGUAGE_KEY = 'stamprally:astra:language:v1';

export function createAstraI18n(language: Language = 'ko') {
  const instance = createInstance();
  void instance.init({
    resources: { ko: { translation: ko }, ja: { translation: ja } },
    lng: language,
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'ja'],
    initImmediate: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}

const defaultInstance = createAstraI18n();
export const translateKorean: Translate = (key, options) => defaultInstance.t(key, options);
const AstraI18nContext = createContext(defaultInstance);

function readLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'ja' ? 'ja' : 'ko';
  } catch {
    return 'ko';
  }
}

export function AstraLanguageProvider({ children }: { children: ReactNode }) {
  const [instance] = useState(() => createAstraI18n(readLanguage()));
  return <AstraI18nContext.Provider value={instance}>{children}</AstraI18nContext.Provider>;
}

export function useAstraTranslation() {
  const instance = useContext(AstraI18nContext);
  const { t, i18n } = useTranslation('translation', { i18n: instance });
  const language: Language = i18n.resolvedLanguage === 'ja' ? 'ja' : 'ko';
  return { t: t as Translate, i18n, language };
}
