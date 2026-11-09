export type MedicalSource = { title: string; url: string };

export const labResultsSource: MedicalSource = {
  title: "MedlinePlus (NIH/NLM): Understanding lab results",
  url: "https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/",
};

export const bmiSource: MedicalSource = {
  title: "CDC: BMI and its limitations",
  url: "https://www.cdc.gov/bmi/about/index.html",
};

export function medicalSourcesForReport(report: { title: string; category: string; markers: { name: string }[] }) {
  const text = [report.title, report.category, ...report.markers.map(marker => marker.name)].join(" ");
  return /\bbmi\b|body composition|inbody/i.test(text) ? [labResultsSource, bmiSource] : [labResultsSource];
}
