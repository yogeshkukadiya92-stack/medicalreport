type OcrMetric = {
  joinTrailingDecimal?: boolean;
  name: string;
  nextLineIndex?: number;
  nextLineWhenEmpty?: boolean;
  pattern: RegExp;
  pick?: "first" | "last";
  range: string;
  unit: string;
};

export const bodyOcrMetrics: OcrMetric[] = [
  { name: "Height", nextLineIndex: 1, nextLineWhenEmpty: true, pattern: /\bheight\b/i, range: "> 0", unit: "cm" },
  { name: "Total Body Water", pattern: /total body water|\btbw\b/i, range: "> 0", unit: "L" },
  { name: "Protein", pattern: /\bprotein\b/i, range: "> 0", unit: "kg" },
  { name: "Minerals", pattern: /\bminerals?\b/i, range: "> 0", unit: "kg" },
  { name: "Body Fat Mass", pattern: /body fat mass/i, range: "7.5-14.9", unit: "kg" },
  { name: "Weight", pattern: /sum of the above.*?\bweight\b|^(?:body\s+|total\s+)?weight\b(?!\s*control)/i, range: "> 0", unit: "kg" },
  { name: "Skeletal Muscle Mass", pattern: /skeletal muscle mass|\bsmm\b/i, pick: "last", range: "> 0", unit: "kg" },
  { name: "BMI", pattern: /body mass index|\bbmi\b/i, range: "18.5-24.9", unit: "kg/m2" },
  { name: "PBF", pattern: /percent body fat|\bpbf\b/i, joinTrailingDecimal: true, pick: "last", range: "10-25", unit: "%" },
  { name: "InBody Score", pattern: /inbody score|body score/i, range: "70-100", unit: "score" },
  { name: "Target Weight", pattern: /target weight/i, range: "> 0", unit: "kg" },
  { name: "Weight Control", pattern: /weight control/i, range: "", unit: "kg" },
  { name: "Fat Control", pattern: /fat control/i, range: "", unit: "kg" },
  { name: "Muscle Control", pattern: /muscle control/i, range: "", unit: "kg" },
  { name: "Basal Metabolic Rate", pattern: /basal\s+\S*(?:rate|rete)|\bbmr\b/i, range: "> 0", unit: "kcal" },
  { name: "Waist-Hip Ratio", pattern: /waist\s*-?\s*hip\s*ratio|\bwhr\b/i, range: "0.80-0.90", unit: "ratio" },
  { name: "Visceral Fat Level", pattern: /visceral fat level|visceral fat/i, range: "1-9", unit: "level" },
  { name: "Obesity Degree", pattern: /obesity degree/i, range: "90-110", unit: "%" },
];

export function numberAfterLabel(lines: string[], metric: OcrMetric) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(metric.pattern);
    if (!match || match.index === undefined) continue;
    // OCR can read the unit '(kg)' as '9)'; it is not a measurement.
    const afterLabel = line.slice(match.index + match[0].length).replace(/^\s*[([]?[^\s)]+\)\s*/, "");
    let values = afterLabel.match(/[+-]?\s*\d+(?:[.,]\d+)?/g) ?? [];
    if (metric.name === "Weight" && /target weight/i.test(afterLabel) && lines[index + 1]) {
      values = lines[index + 1].match(/[+-]?\s*\d+(?:[.,]\d+)?/g) ?? [];
    } else if (!values.length && metric.nextLineWhenEmpty && lines[index + 1]) {
      values = lines[index + 1].match(/[+-]?\s*\d+(?:[.,]\d+)?/g) ?? [];
    }
    let selected = metric.nextLineWhenEmpty && afterLabel.match(/\d/) === null && metric.nextLineIndex !== undefined
      ? values[metric.nextLineIndex]
      : metric.pick === "last" ? values.at(-1) : values[0];
    // Do not reconstruct missing decimal digits from unrelated chart labels.
    if (metric.joinTrailingDecimal && !selected?.match(/\d[.,]\d/) && !afterLabel.includes("%")) continue;
    if (!selected) continue;
    const cleanValue = selected.replace(/\s/g, "").replace(",", ".");
    const numericValue = Number(cleanValue);
    if (!Number.isFinite(numericValue)) continue;
    return Number.isInteger(numericValue) ? String(numericValue) : String(Number(numericValue.toFixed(2)));
  }
  return "";
}

