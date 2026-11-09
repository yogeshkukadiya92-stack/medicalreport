import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import path from "node:path";

export async function renderReportPdf(buffer: Buffer, pageLimit: number): Promise<string[]> {
  // PDF.js needs these graphics primitives when rendering under Node.
  Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loading = getDocument({
    data: new Uint8Array(buffer),
    // Minimal production containers have no operating-system fonts. Resolve
    // standard PDF fonts from the assets bundled with PDF.js instead.
    standardFontDataUrl: path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts/"),
    useSystemFonts: false,
    disableFontFace: true,
    isEvalSupported: false,
  });
  const document = await loading.promise;
  try {
    if (document.numPages > pageLimit) throw new Error(`This PDF has ${document.numPages} pages. Upload at most ${pageLimit} pages at a time so every page is analyzed.`);
    const images: string[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const base = page.getViewport({ scale: 1 });
      if (!base.width || !base.height) throw new Error("The PDF has an unreadable page.");
      const viewport = page.getViewport({ scale: Math.min(2.5, 1800 / Math.max(base.width, base.height)) });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvasContext: canvas.getContext("2d") as unknown as CanvasRenderingContext2D, viewport }).promise;
      images.push(`data:image/jpeg;base64,${canvas.toBuffer("image/jpeg").toString("base64")}`);
      page.cleanup();
    }
    return images;
  } finally { await document.destroy(); }
}
