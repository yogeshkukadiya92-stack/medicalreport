export const supportedCountries = [
  { code: "IN", currency: "INR", locale: "en-IN", name: "India", phoneCode: "+91", timeZone: "Asia/Kolkata" },
  { code: "US", currency: "USD", locale: "en-US", name: "United States", phoneCode: "+1", timeZone: "America/New_York" },
  { code: "CA", currency: "CAD", locale: "en-CA", name: "Canada", phoneCode: "+1", timeZone: "America/Toronto" },
  { code: "GB", currency: "GBP", locale: "en-GB", name: "United Kingdom", phoneCode: "+44", timeZone: "Europe/London" },
  { code: "AE", currency: "AED", locale: "en-AE", name: "United Arab Emirates", phoneCode: "+971", timeZone: "Asia/Dubai" },
  { code: "AU", currency: "AUD", locale: "en-AU", name: "Australia", phoneCode: "+61", timeZone: "Australia/Sydney" },
  { code: "SG", currency: "SGD", locale: "en-SG", name: "Singapore", phoneCode: "+65", timeZone: "Asia/Singapore" },
  { code: "DE", currency: "EUR", locale: "de-DE", name: "Germany", phoneCode: "+49", timeZone: "Europe/Berlin" },
] as const;

export const supportedTimeZones = Array.from(new Set(supportedCountries.map((country) => country.timeZone)));
export const supportedCurrencies = Array.from(new Set(supportedCountries.map((country) => country.currency)));
export const supportedLocales = Array.from(new Set(supportedCountries.map((country) => country.locale)));

export type MeasurementSystem = "metric" | "imperial";
export type DataRegion = "india" | "us" | "eu" | "asia-pacific";

export type RegionPreferences = {
  countryCode: string;
  currency: string;
  dataRegion: DataRegion;
  locale: string;
  measurementSystem: MeasurementSystem;
  timeZone: string;
};

export const defaultRegionPreferences: RegionPreferences = {
  countryCode: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "IN",
  currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "INR",
  dataRegion: (process.env.NEXT_PUBLIC_DATA_REGION as DataRegion) || "india",
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en-IN",
  measurementSystem: (process.env.NEXT_PUBLIC_MEASUREMENT_SYSTEM as MeasurementSystem) || "metric",
  timeZone: process.env.NEXT_PUBLIC_DEFAULT_TIME_ZONE || process.env.APP_TIME_ZONE || "Asia/Kolkata",
};

export function regionPreferences(input?: Partial<RegionPreferences> | null): RegionPreferences {
  return {
    countryCode: input?.countryCode || defaultRegionPreferences.countryCode,
    currency: input?.currency || defaultRegionPreferences.currency,
    dataRegion: input?.dataRegion || defaultRegionPreferences.dataRegion,
    locale: input?.locale || defaultRegionPreferences.locale,
    measurementSystem: input?.measurementSystem || defaultRegionPreferences.measurementSystem,
    timeZone: input?.timeZone || defaultRegionPreferences.timeZone,
  };
}

export function formatRegionalCurrency(value: number, preferences?: Partial<RegionPreferences> | null) {
  const config = regionPreferences(preferences);
  return new Intl.NumberFormat(config.locale, {
    currency: config.currency,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatRegionalDate(value: string | number | Date, preferences?: Partial<RegionPreferences> | null) {
  const config = regionPreferences(preferences);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(config.locale, {
    day: "2-digit",
    month: "short",
    timeZone: config.timeZone,
    year: "numeric",
  }).format(date);
}

export function formatRegionalDateTime(value: string | number | Date, preferences?: Partial<RegionPreferences> | null) {
  const config = regionPreferences(preferences);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(config.locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: config.timeZone,
    year: "numeric",
  }).format(date);
}
