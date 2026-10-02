import { useEffect } from 'react';
import { useI18n } from '../i18n';

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useI18n();
  useEffect(() => { setLocale(locale); }, [locale, setLocale]);
  return (
    <div role="group" aria-label={t('Language')} className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex rounded-lg border border-gray-600 bg-gray-900 text-xs text-white shadow-lg overflow-hidden">
      <button type="button" lang="zh-CN" aria-label={t('Switch to Chinese')} aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')} className={`px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 focus-visible:-outline-offset-2 ${locale === 'zh' ? 'bg-yellow-600 text-black' : 'hover:bg-gray-700'}`}>中文</button>
      <button type="button" lang="en" aria-label={t('Switch to English')} aria-pressed={locale === 'en'} onClick={() => setLocale('en')} className={`px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 focus-visible:-outline-offset-2 ${locale === 'en' ? 'bg-yellow-600 text-black' : 'hover:bg-gray-700'}`}>English</button>
    </div>
  );
}
