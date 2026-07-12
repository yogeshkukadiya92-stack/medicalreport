import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { addLabAuditLog, getLabContext } from "@/lib/lab-server";
import type { LabReport, LabReportValue } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ reportId: string }> };
type PdfAccent = "blue" | "burgundy" | "charcoal" | "teal";
type PdfSections = {
  accession?: boolean;
  doctor?: boolean;
  labAddress?: boolean;
  patientPhone?: boolean;
  referenceRanges?: boolean;
  resultNotes?: boolean;
  sampleCollectedAt?: boolean;
  statuses?: boolean;
  summary?: boolean;
};
type PdfInput = {
  accent?: PdfAccent;
  clinicalNotes?: string;
  customFields?: Array<{ label?: string; value?: string }>;
  customTitle?: string;
  footerText?: string;
  sections?: PdfSections;
  signatoryName?: string;
  signatoryRole?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const accents: Record<PdfAccent, RGB> = {
  blue: rgb(0.08, 0.32, 0.55),
  burgundy: rgb(0.48, 0.12, 0.2),
  charcoal: rgb(0.13, 0.17, 0.2),
  teal: rgb(0.04, 0.49, 0.43),
};

function cleanText(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function pdfText(value: unknown) {
  return cleanText(value, 2_000)
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  pdfText(text)
    .split(/\r?\n/)
    .forEach((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
        return;
      }
      let line = "";
      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          line = candidate;
          return;
        }
        if (line) lines.push(line);
        if (font.widthOfTextAtSize(word, size) <= maxWidth) {
          line = word;
          return;
        }
        let fragment = "";
        [...word].forEach((character) => {
          const next = `${fragment}${character}`;
          if (font.widthOfTextAtSize(next, size) > maxWidth && fragment) {
            lines.push(fragment);
            fragment = character;
          } else {
            fragment = next;
          }
        });
        line = fragment;
      });
      if (line) lines.push(line);
    });
  return lines;
}

function statusColor(status: LabReportValue["status"]) {
  if (status === "High" || status === "Low") return rgb(0.72, 0.19, 0.13);
  if (status === "Watch") return rgb(0.55, 0.39, 0);
  return rgb(0.03, 0.43, 0.33);
}

function safeFileName(report: LabReport) {
  const base = `${report.clientName}-${report.reportType}-${report.reportDate}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "lab-report"}.pdf`;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { reportId } = await params;
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const report = await context.db.collection<LabReport>("labReports").findOne(
    { id: reportId, labId: context.lab.id },
    { projection: { _id: 0 } },
  );
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as PdfInput;
  const accent = accents[body.accent && body.accent in accents ? body.accent : "teal"];
  const sections: Required<PdfSections> = {
    accession: body.sections?.accession !== false,
    doctor: body.sections?.doctor !== false,
    labAddress: body.sections?.labAddress !== false,
    patientPhone: body.sections?.patientPhone !== false,
    referenceRanges: body.sections?.referenceRanges !== false,
    resultNotes: body.sections?.resultNotes !== false,
    sampleCollectedAt: body.sections?.sampleCollectedAt !== false,
    statuses: body.sections?.statuses !== false,
    summary: body.sections?.summary !== false,
  };
  const customFields = (Array.isArray(body.customFields) ? body.customFields : [])
    .slice(0, 12)
    .map((field) => ({ label: cleanText(field?.label, 60), value: cleanText(field?.value, 240) }))
    .filter((field) => field.label && field.value);

  const pdf = await PDFDocument.create();
  pdf.setTitle(cleanText(body.customTitle, 140) || report.title);
  pdf.setAuthor(context.lab.name);
  pdf.setSubject(`${report.reportType} report for ${report.clientName}`);
  pdf.setCreator("MediVault Lab PDF Studio");
  pdf.setCreationDate(new Date());

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.38, 0.44, 0.43);
  const ink = rgb(0.08, 0.13, 0.15);
  const border = rgb(0.86, 0.9, 0.89);
  const surface = rgb(0.96, 0.98, 0.97);
  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const pages: PDFPage[] = [page];

  const addPage = (continued = false) => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN;
    if (continued) {
      page.drawText(pdfText(context.lab.name), { x: MARGIN, y, size: 11, font: bold, color: accent });
      page.drawText("Lab report - continued", { x: PAGE_WIDTH - MARGIN - 112, y, size: 8, font: regular, color: muted });
      y -= 24;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: border });
      y -= 18;
    }
  };
  const ensureSpace = (height: number) => {
    if (y - height < 58) addPage(true);
  };
  const drawWrapped = (text: string, options: { color?: RGB; font?: PDFFont; maxWidth?: number; size?: number; x?: number }) => {
    const selectedFont = options.font ?? regular;
    const size = options.size ?? 9;
    const lineHeight = size * 1.35;
    const lines = wrapText(text, selectedFont, size, options.maxWidth ?? PAGE_WIDTH - MARGIN * 2);
    ensureSpace(Math.max(lineHeight, lines.length * lineHeight));
    lines.forEach((line) => {
      page.drawText(line, { x: options.x ?? MARGIN, y, size, font: selectedFont, color: options.color ?? ink });
      y -= lineHeight;
    });
    return lines.length * lineHeight;
  };
  const drawMeta = (label: string, value: string, x: number, width: number) => {
    page.drawText(pdfText(label).toUpperCase(), { x, y, size: 6.8, font: bold, color: muted });
    const lines = wrapText(value || "--", bold, 9.2, width);
    lines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, { x, y: y - 13 - index * 11, size: 9.2, font: bold, color: ink });
    });
  };

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: accent });
  page.drawText(pdfText(context.lab.name), { x: MARGIN, y, size: 18, font: bold, color: accent });
  y -= 15;
  if (sections.labAddress && context.lab.address) drawWrapped(context.lab.address, { size: 7.8, color: muted, maxWidth: 320 });
  const labContact = [context.lab.phone, report.labReportId].filter(Boolean).join("  |  ");
  if (labContact) drawWrapped(labContact, { size: 7.8, color: muted, maxWidth: 360 });
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1.5, color: accent });
  y -= 28;

  const title = cleanText(body.customTitle, 140) || report.title;
  drawWrapped(title, { size: 18, font: bold, color: ink, maxWidth: 430 });
  drawWrapped(`${report.reportType}  |  Report date: ${report.reportDate}`, { size: 8.5, color: muted });
  y -= 14;

  page.drawRectangle({ x: MARGIN, y: y - 70, width: PAGE_WIDTH - MARGIN * 2, height: 78, color: surface, borderColor: border, borderWidth: 1 });
  const columnWidth = (PAGE_WIDTH - MARGIN * 2 - 36) / 3;
  drawMeta("Patient", report.clientName, MARGIN + 12, columnWidth);
  drawMeta("Report ID", report.labReportId, MARGIN + 24 + columnWidth, columnWidth);
  drawMeta("Report date", report.reportDate, MARGIN + 36 + columnWidth * 2, columnWidth);
  y -= 38;
  drawMeta("Phone", sections.patientPhone ? report.clientPhone : "Hidden", MARGIN + 12, columnWidth);
  drawMeta("Doctor", sections.doctor ? report.doctorName || "--" : "Hidden", MARGIN + 24 + columnWidth, columnWidth);
  drawMeta("Accession", sections.accession ? report.accessionNumber || "--" : "Hidden", MARGIN + 36 + columnWidth * 2, columnWidth);
  y -= 52;

  const secondaryFields = [
    ...(sections.sampleCollectedAt && report.sampleCollectedAt ? [{ label: "Sample collected", value: report.sampleCollectedAt }] : []),
    ...customFields,
  ];
  if (secondaryFields.length) {
    ensureSpace(secondaryFields.length * 28 + 34);
    page.drawText("ADDITIONAL DETAILS", { x: MARGIN, y, size: 7.5, font: bold, color: accent });
    y -= 14;
    secondaryFields.forEach((field) => {
      const labelWidth = 112;
      page.drawText(pdfText(field.label), { x: MARGIN, y, size: 8, font: bold, color: muted });
      const valueLines = wrapText(field.value, regular, 8.5, PAGE_WIDTH - MARGIN * 2 - labelWidth);
      valueLines.slice(0, 3).forEach((line, index) => page.drawText(line, { x: MARGIN + labelWidth, y: y - index * 11, size: 8.5, font: regular, color: ink }));
      y -= Math.max(20, valueLines.slice(0, 3).length * 11 + 4);
      page.drawLine({ start: { x: MARGIN, y: y + 7 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 7 }, thickness: 0.5, color: border });
    });
    y -= 8;
  }

  const testWidth = 168;
  const resultWidth = 108;
  const rangeWidth = sections.referenceRanges ? 115 : 0;
  const statusWidth = sections.statuses ? 76 : 0;
  const tableWidth = testWidth + resultWidth + rangeWidth + statusWidth;
  const drawTableHeader = () => {
    ensureSpace(34);
    page.drawRectangle({ x: MARGIN, y: y - 22, width: tableWidth, height: 26, color: accent });
    let x = MARGIN + 8;
    const columns: Array<[string, number]> = [
      ["TEST", testWidth],
      ["RESULT", resultWidth],
      ...(sections.referenceRanges ? [["REFERENCE", rangeWidth] as [string, number]] : []),
      ...(sections.statuses ? [["STATUS", statusWidth] as [string, number]] : []),
    ];
    columns.forEach(([label, width]) => {
      page.drawText(label, { x, y: y - 12, size: 7, font: bold, color: rgb(1, 1, 1) });
      x += width;
    });
    y -= 30;
  };

  page.drawText("RESULTS", { x: MARGIN, y, size: 8, font: bold, color: accent });
  y -= 15;
  drawTableHeader();
  report.values.forEach((value, index) => {
    const nameLines = wrapText(value.name, bold, 8.3, testWidth - 14);
    const resultLines = wrapText(`${value.value} ${value.unit}`.trim(), bold, 8.3, resultWidth - 14);
    const rangeLines = sections.referenceRanges ? wrapText(value.referenceRange || "--", regular, 8, rangeWidth - 14) : [];
    const noteLines = sections.resultNotes && value.notes ? wrapText(value.notes, regular, 7.2, testWidth - 14) : [];
    const rowHeight = Math.max(30, Math.max(nameLines.length + noteLines.length, resultLines.length, rangeLines.length, 1) * 11 + 10);
    if (y - rowHeight < 58) {
      addPage(true);
      drawTableHeader();
    }
    if (index % 2 === 0) page.drawRectangle({ x: MARGIN, y: y - rowHeight + 4, width: tableWidth, height: rowHeight, color: surface });
    let x = MARGIN + 8;
    nameLines.forEach((line, lineIndex) => page.drawText(line, { x, y: y - 8 - lineIndex * 11, size: 8.3, font: bold, color: ink }));
    noteLines.forEach((line, lineIndex) => page.drawText(line, { x, y: y - 8 - (nameLines.length + lineIndex) * 10.5, size: 7.2, font: regular, color: muted }));
    x += testWidth;
    resultLines.forEach((line, lineIndex) => page.drawText(line, { x, y: y - 8 - lineIndex * 11, size: 8.3, font: bold, color: ink }));
    x += resultWidth;
    if (sections.referenceRanges) {
      rangeLines.forEach((line, lineIndex) => page.drawText(line, { x, y: y - 8 - lineIndex * 11, size: 8, font: regular, color: muted }));
      x += rangeWidth;
    }
    if (sections.statuses) page.drawText(pdfText(value.status), { x, y: y - 8, size: 8, font: bold, color: statusColor(value.status) });
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: MARGIN + tableWidth, y: y + 4 }, thickness: 0.5, color: border });
  });
  y -= 16;

  if (sections.summary && report.summary) {
    ensureSpace(76);
    page.drawText("REPORT SUMMARY", { x: MARGIN, y, size: 7.5, font: bold, color: accent });
    y -= 14;
    drawWrapped(report.summary, { size: 8.5, color: ink });
    y -= 10;
  }
  const clinicalNotes = cleanText(body.clinicalNotes, 1_500);
  if (clinicalNotes) {
    ensureSpace(76);
    page.drawText("CLINICAL NOTES", { x: MARGIN, y, size: 7.5, font: bold, color: accent });
    y -= 14;
    drawWrapped(clinicalNotes, { size: 8.5, color: ink });
    y -= 12;
  }

  const signatoryName = cleanText(body.signatoryName, 100);
  const signatoryRole = cleanText(body.signatoryRole, 100);
  if (signatoryName || signatoryRole) {
    ensureSpace(76);
    const signatureX = PAGE_WIDTH - MARGIN - 190;
    page.drawLine({ start: { x: signatureX, y: y - 26 }, end: { x: PAGE_WIDTH - MARGIN, y: y - 26 }, thickness: 0.8, color: muted });
    page.drawText(pdfText(signatoryName || "Authorized signatory"), { x: signatureX, y: y - 40, size: 9, font: bold, color: ink });
    page.drawText(pdfText(signatoryRole || "Authorized signatory"), { x: signatureX, y: y - 53, size: 7.5, font: regular, color: muted });
  }

  const footerText = cleanText(body.footerText, 300) || "This report should be interpreted by a qualified healthcare professional.";
  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_WIDTH - MARGIN, y: 42 }, thickness: 0.6, color: border });
    const footerLines = wrapText(footerText, regular, 6.8, PAGE_WIDTH - MARGIN * 2 - 65);
    footerLines.slice(0, 2).forEach((line, lineIndex) => pdfPage.drawText(line, { x: MARGIN, y: 29 - lineIndex * 8, size: 6.8, font: regular, color: muted }));
    pdfPage.drawText(`Page ${index + 1} of ${pages.length}`, { x: PAGE_WIDTH - MARGIN - 52, y: 29, size: 6.8, font: bold, color: muted });
  });

  const bytes = await pdf.save();
  await addLabAuditLog(context.db, {
    action: "update",
    actorUserId: context.userId,
    labId: context.lab.id,
    labReportId: report.id,
    note: "Customized PDF generated from report history.",
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${safeFileName(report)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
