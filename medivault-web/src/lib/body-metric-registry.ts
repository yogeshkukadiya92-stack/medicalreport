import type { ReportMarker } from "@/lib/vault-types";

type MetricDefinition = {
  aliases: RegExp[];
  name: string;
  unit: string;
};

const metricDefinitions: MetricDefinition[] = [
  { aliases: [/^height$/, /^stature$/], name: "Height", unit: "cm" },
  { aliases: [/^weight$/, /^body weight$/, /^total weight$/], name: "Weight", unit: "kg" },
  { aliases: [/^bmi$/, /^body mass index$/], name: "BMI", unit: "kg/m2" },
  { aliases: [/^pbf$/, /^percent body fat$/, /^body fat percentage$/, /^body fat %$/, /^fat %$/], name: "PBF", unit: "%" },
  { aliases: [/^smm$/, /^skeletal muscle$/, /^skeletal muscle mass$/, /^muscle mass$/], name: "Skeletal Muscle Mass", unit: "kg" },
  { aliases: [/^body fat mass$/, /^fat mass$/], name: "Body Fat Mass", unit: "kg" },
  { aliases: [/^total body water$/, /^tbw$/], name: "Total Body Water", unit: "L" },
  { aliases: [/^protein$/], name: "Protein", unit: "kg" },
  { aliases: [/^minerals?$/], name: "Minerals", unit: "kg" },
  { aliases: [/^inbody score$/, /^body score$/, /^fitness score$/], name: "InBody Score", unit: "score" },
  { aliases: [/^basal metabolic rate$/, /^bmr$/], name: "Basal Metabolic Rate", unit: "kcal" },
  { aliases: [/^waist[- ]?hip ratio$/, /^whr$/], name: "Waist-Hip Ratio", unit: "ratio" },
  { aliases: [/^visceral fat level$/, /^visceral fat$/], name: "Visceral Fat Level", unit: "level" },
  { aliases: [/^obesity degree$/], name: "Obesity Degree", unit: "%" },
  { aliases: [/^target weight$/], name: "Target Weight", unit: "kg" },
  { aliases: [/^weight control$/], name: "Weight Control", unit: "kg" },
  { aliases: [/^fat control$/], name: "Fat Control", unit: "kg" },
  { aliases: [/^muscle control$/], name: "Muscle Control", unit: "kg" },
];

export function bodyMetricKey(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function bodyMetricDefinition(name: string) {
  const clean = name.trim().toLowerCase().replace(/\s+/g, " ");
  return metricDefinitions.find((definition) => definition.aliases.some((alias) => alias.test(clean))) ?? null;
}

export function canonicalBodyMetricName(name: string) {
  return bodyMetricDefinition(name)?.name ?? name.trim();
}

export function canonicalBodyMetricUnit(name: string, fallback = "") {
  return bodyMetricDefinition(name)?.unit ?? cleanUnit(fallback);
}

export function cleanUnit(unit: string) {
  const compact = unit.trim().replace(/^\((.*)\)$/, "$1").replace(/\s+/g, "");
  const withoutDuplicates = compact.replace(/^(kg|cm|kcal|score|level|ratio|L)\1$/i, "$1");
  if (/^kg\/m(?:2|²)$/i.test(withoutDuplicates)) return "kg/m2";
  if (/^points?$/i.test(withoutDuplicates)) return "score";
  return withoutDuplicates;
}

export function splitBodyMetricValue(raw: string) {
  const match = raw.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*(.*)$/);
  return match
    ? { number: Number(match[1].replace(",", ".")), unit: cleanUnit(match[2]) }
    : { number: null, unit: "" };
}

function cleanReferenceRange(range: string) {
  const clean = range.trim();
  const arrayRange = clean.match(/^\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]$/);
  return arrayRange ? `${arrayRange[1]}-${arrayRange[2]}` : clean;
}

export function normalizeBodyMarker(marker: ReportMarker): ReportMarker {
  const name = canonicalBodyMetricName(marker.name);
  const parsed = splitBodyMetricValue(marker.value);
  if (parsed.number === null || !Number.isFinite(parsed.number)) {
    return { ...marker, name, range: cleanReferenceRange(marker.range) };
  }
  const unit = canonicalBodyMetricUnit(name, parsed.unit);
  return {
    ...marker,
    name,
    range: cleanReferenceRange(marker.range),
    value: `${parsed.number}${unit ? ` ${unit}` : ""}`,
  };
}

export function normalizeBodyMarkers(markers: ReportMarker[]) {
  const seen = new Set<string>();
  return markers.map(normalizeBodyMarker).filter((marker) => {
    const key = bodyMetricKey(marker.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isPlausibleBodyMetric(marker: ReportMarker, markers: ReportMarker[]) {
  const metric = bodyMetricDefinition(marker.name);
  const value = splitBodyMetricValue(marker.value).number;
  if (!metric || value === null) return true;

  const limits: Record<string, [number, number]> = {
    "Basal Metabolic Rate": [500, 5000],
    BMI: [8, 80],
    "Body Fat Mass": [0.5, 250],
    Height: [80, 250],
    "InBody Score": [0, 100],
    PBF: [1, 75],
    "Skeletal Muscle Mass": [2, 120],
    "Total Body Water": [5, 150],
    Weight: [15, 400],
  };
  const limit = limits[metric.name];
  if (limit && (value < limit[0] || value > limit[1])) return false;

  if (metric.name === "Skeletal Muscle Mass") {
    const weightMarker = markers.find((item) => canonicalBodyMetricName(item.name) === "Weight");
    const weight = weightMarker ? splitBodyMetricValue(weightMarker.value).number : null;
    if (weight && (value >= weight * 0.8 || Math.abs(value - weight) < 0.01)) return false;
  }
  return true;
}
