"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = "en" | "gu" | "hi";

const messages = {
  en: {
    analytics: "Trends", family: "Family", home: "Home", privacy: "Privacy",
    reports: "Timeline", upload: "Book", language: "Language",
  },
  gu: {
    analytics: "ટ્રેન્ડ્સ", family: "પરિવાર", home: "હોમ", privacy: "ગોપનીયતા",
    reports: "રિપોર્ટ્સ", upload: "બુક", language: "ભાષા",
  },
  hi: {
    analytics: "ट्रेंड्स", family: "परिवार", home: "होम", privacy: "गोपनीयता",
    reports: "रिपोर्ट्स", upload: "बुक", language: "भाषा",
  },
} as const;

type MessageKey = keyof typeof messages.en;
type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("medivault_language");
    if (stored === "gu" || stored === "hi" || stored === "en") setLanguageState(stored);
  }, []);

  function setLanguage(next: AppLanguage) {
    setLanguageState(next);
    window.localStorage.setItem("medivault_language", next);
    document.documentElement.lang = next;
  }

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: MessageKey) => messages[language][key],
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="inline-flex items-center gap-2 text-[10px] font-black">
      {!compact ? <span>{t("language")}</span> : null}
      <select
        aria-label={t("language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="h-8 rounded-md border border-[#d7e4e0] bg-white px-2 text-[10px] font-black text-[#173a34]"
      >
        <option value="en">EN</option>
        <option value="gu">ગુજરાતી</option>
        <option value="hi">हिन्दी</option>
      </select>
    </label>
  );
}
