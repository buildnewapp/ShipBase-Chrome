import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "@/assets/locales/en.json";
import zh from "@/assets/locales/zh.json";

type Locale = "en" | "zh";

type Messages = Record<Locale, Record<string, string>>;

const STORAGE_KEY = "popup.locale";

const messages: Messages = { en, zh } as Messages;

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof messages["en"]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readLocale(): Locale {
  const fromStorage = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
  if (fromStorage === "en" || fromStorage === "zh") return fromStorage;
  // 默认英文
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  useEffect(() => {
    // 初始化时同步本地缓存
    setLocaleState(readLocale());
  }, []);

  const t = useCallback(
    (key: keyof typeof messages["en"]) => {
      const table = messages[locale] ?? messages.en;
      return table[key] ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export type { Locale };
