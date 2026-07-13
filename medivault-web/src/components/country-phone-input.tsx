"use client";

const COUNTRY_CODES = [
  { code: "+91", label: "India", maxDigits: 10 },
  { code: "+1", label: "US/CA", maxDigits: 10 },
  { code: "+44", label: "UK", maxDigits: 11 },
  { code: "+971", label: "UAE", maxDigits: 9 },
  { code: "+61", label: "AU", maxDigits: 9 },
];

function hasEmailText(value: string) {
  return /[a-z@]/i.test(value);
}

export function localPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  const matchedCountry = COUNTRY_CODES.find((country) => digits.startsWith(country.code.slice(1)) && digits.length > country.code.length - 1);
  if (matchedCountry) return digits.slice(matchedCountry.code.length - 1);
  if (digits.startsWith("91") && digits.length > 10) return digits.slice(2);
  return digits;
}

function parsePhone(value: string) {
  if (hasEmailText(value)) return { countryCode: "+91", localNumber: value };
  const digits = value.replace(/\D/g, "");
  const matchedCountry = COUNTRY_CODES.find((country) => digits.startsWith(country.code.slice(1)) && digits.length > country.code.length - 1);
  if (matchedCountry) {
    return {
      countryCode: matchedCountry.code,
      localNumber: digits.slice(matchedCountry.code.length - 1).slice(0, matchedCountry.maxDigits),
    };
  }
  const indiaLocal = digits.startsWith("91") && digits.length > 10 ? digits.slice(2) : digits;
  return { countryCode: "+91", localNumber: indiaLocal.slice(0, 10) };
}

type CountryPhoneInputProps = {
  allowEmail?: boolean;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  selectClassName?: string;
  size?: "sm" | "md";
  value: string;
};

export function CountryPhoneInput({
  allowEmail = false,
  autoComplete = "tel",
  className = "",
  inputClassName = "",
  label,
  onChange,
  placeholder = "Mobile number",
  required,
  selectClassName = "",
  size = "md",
  value,
}: CountryPhoneInputProps) {
  const parsed = parsePhone(value);
  const activeCountry = COUNTRY_CODES.find((country) => country.code === parsed.countryCode) ?? COUNTRY_CODES[0];
  const heightClass = size === "sm" ? "h-9 text-[11px]" : "h-12 text-[14px]";
  const baseFieldClass = `${heightClass} rounded-lg border border-[#dce9e5] bg-white px-3 font-bold text-[#162523] outline-none focus:border-[#0a7d6e]`;

  function updateCountry(countryCode: string) {
    if (allowEmail && hasEmailText(parsed.localNumber)) return;
    onChange(`${countryCode}${localPhoneDigits(parsed.localNumber)}`);
  }

  function updateLocalNumber(nextValue: string) {
    if (allowEmail && hasEmailText(nextValue)) {
      onChange(nextValue.trim());
      return;
    }
    const digits = nextValue.replace(/\D/g, "").slice(0, activeCountry.maxDigits);
    onChange(digits ? `${activeCountry.code}${digits}` : "");
  }

  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-2 block text-[12px] font-bold text-[#52605d]">{label}</span> : null}
      <div className="grid grid-cols-[104px_1fr] gap-2">
        <select
          value={parsed.countryCode}
          onChange={(event) => updateCountry(event.target.value)}
          className={`${baseFieldClass} ${selectClassName}`}
          aria-label={label ? `${label} country code` : "Country code"}
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label} {country.code}
            </option>
          ))}
        </select>
        <input
          type={allowEmail ? "text" : "tel"}
          value={parsed.localNumber}
          onChange={(event) => updateLocalNumber(event.target.value)}
          placeholder={allowEmail ? `${placeholder} or admin email` : placeholder}
          inputMode={allowEmail ? "text" : "tel"}
          autoComplete={autoComplete}
          required={required}
          className={`${baseFieldClass} ${inputClassName}`}
        />
      </div>
    </label>
  );
}
