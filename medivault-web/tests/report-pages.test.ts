import { createCanvas, loadImage } from "@napi-rs/canvas";
import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { renderReportPdf } from "../src/lib/report-pages";

test("a laboratory PDF renders as readable image input", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage([595, 842]).drawText("Hemoglobin 13.5 g/dL   Reference 12-16", { x: 40, y: 750, font, size: 18 });
  const pages = await renderReportPdf(Buffer.from(await pdf.save()), 2);
  assert.equal(pages.length, 1);
  assert.match(pages[0], /^data:image\/jpeg;base64,/);
  const image = await loadImage(Buffer.from(pages[0].split(",")[1], "base64"));
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d"); context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height).data;
  let darkPixels = 0;
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100) darkPixels++;
  assert.ok(darkPixels > 300, "PDF text must render, not a blank page");
});

test("extra PDF pages are rejected instead of silently dropping measurements", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage(); pdf.addPage();
  await assert.rejects(renderReportPdf(Buffer.from(await pdf.save()), 1), /2 pages/);
});
