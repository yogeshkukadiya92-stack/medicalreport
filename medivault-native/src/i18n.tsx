import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "gu" | "hi";
const copy = {
  en: { home: "Home", reports: "Reports", trends: "Trends", family: "Family", privacy: "Privacy", upload: "Add report" },
  gu: { home: "હોમ", reports: "રિપોર્ટ્સ", trends: "ટ્રેન્ડ્સ", family: "પરિવાર", privacy: "ગોપનીયતા", upload: "રિપોર્ટ ઉમેરો" },
  hi: { home: "होम", reports: "रिपोर्ट्स", trends: "ट्रेंड्स", family: "परिवार", privacy: "गोपनीयता", upload: "रिपोर्ट जोड़ें" },
} as const;
type CopyKey = keyof typeof copy.en;

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
  t: (key: CopyKey) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => { AsyncStorage.getItem("medivault_language").then((value) => {
    if (value === "en" || value === "gu" || value === "hi") setLanguageState(value);
  }); }, []);
  const value = useMemo(() => ({
    language,
    setLanguage: (next: Language) => {
      setLanguageState(next);
      AsyncStorage.setItem("medivault_language", next);
    },
    t: (key: CopyKey) => copy[language][key],
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is missing.");
  return context;
}
