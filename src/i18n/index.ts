import { useSyncExternalStore } from 'react';
import zh from './zh-CN.json';

export type Locale = 'en' | 'zh';
export const LOCALE_KEY = 'texas-holdem-language';
type Values = Record<string, string | number>;
const listeners = new Set<() => void>();

export function readStoredLocale(storage?: Pick<Storage, 'getItem'>): Locale {
  try {
    const target = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    return target?.getItem(LOCALE_KEY) === 'zh' ? 'zh' : 'en';
  } catch { return 'en'; }
}
let locale: Locale = readStoredLocale();
export const getLocale = () => locale;

export function translate(text: string | undefined, language: Locale = locale, values?: Values): string {
  if (!text) return '';
  const message = language === 'zh' ? (zh as Record<string, string>)[text] ?? text : text;
  return message.replace(/\{(\w+)\}/g, (token, key: string) => values && key in values ? String(values[key]) : token);
}

export function formatPlayerName(name: string, isBuiltIn: boolean, language: Locale = locale): string {
  // Multiplayer names are user content and must never be translated.
  if (!isBuiltIn || language === 'en') return name;
  if (name === 'You') return translate('You', language);
  return /^Bot \d+$/.test(name) ? name.replace('Bot ', '电脑 ') : name;
}

export function setLocale(next: Locale): void {
  if (next !== 'en' && next !== 'zh') return;
  locale = next;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.title = translate('Poker Trainer');
  }
  try { window.localStorage.setItem(LOCALE_KEY, next); } catch { /* Preference storage can be disabled. */ }
  listeners.forEach(listener => listener());
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function useI18n() {
  const language = useSyncExternalStore(subscribe, getLocale, getLocale);
  return {
    locale: language,
    t: (text: string | undefined, values?: Values) => translate(text, language, values),
    playerName: (name: string, isBuiltIn: boolean) => formatPlayerName(name, isBuiltIn, language),
    formatTime: (timestamp: number, options?: Intl.DateTimeFormatOptions) => new Date(timestamp).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', options),
    setLocale,
  };
}
