export function isBodyCompositionReport(input: { reportKind?: string; title?: string; fileName?: string; lab?: string }) {
  return input.reportKind === "body_composition" || /body composition|bmi|body scan|inbody|smart scale/i.test(
    [input.title, input.fileName, input.lab].filter(Boolean).join(" "),
  );
}
