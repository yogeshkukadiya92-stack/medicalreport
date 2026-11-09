import type { AppReport } from "./types";

export function numericReading(label: string) {
  const text = label.trim();
  const prefix = text.match(/^-?[\d.,]+/)?.[0];
  if (prefix?.includes(",") && !/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(prefix)) return null;
  const normalized = text.replace(/,/g, "");
  const match = normalized.match(/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
  if (!match) return null;
  const value = Number(match[0]);
  if (!Number.isFinite(value)) return null;
  const unit = normalized.slice(match[0].length).trim();
  if (unit && !/^[a-zA-Zµμ%°×]/.test(unit)) return null;
  return { value, unit, unitKey: unit.toLowerCase().replace(/[µμ]/g, "u").replace(/\s+/g, "") };
}

export function buildReportTrends(reports: ReadonlyArray<Pick<AppReport, "date" | "markers">>) {
  const groups = new Map<string, { key: string; name: string; unit: string; points: { date: string; status: string; value: number; valueLabel: string }[] }>();
  for (const report of reports) for (const marker of report.markers) {
    const reading = numericReading(marker.value);
    if (!reading) continue;
    const key = JSON.stringify([marker.name.trim().toLowerCase(), reading.unitKey]);
    const group = groups.get(key) ?? { key, name: marker.name.trim(), unit: reading.unit, points: [] };
    group.points.push({ date: report.date, status: marker.status, value: reading.value, valueLabel: marker.value });
    groups.set(key, group);
  }
  return [...groups.values()].map(group => ({ ...group, points: group.points.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)) }))
    .sort((a, b) => b.points.length - a.points.length || a.name.localeCompare(b.name));
}
