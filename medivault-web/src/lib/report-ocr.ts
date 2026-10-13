import englishData from "@tesseract.js-data/eng";
import { createWorker, OEM } from "tesseract.js";

type OcrWorker = Pick<Awaited<ReturnType<typeof createWorker>>, "recognize" | "terminate">;

// Bound initialization and recognition together, including a stalled worker.
export async function recognizeReportPages(
  images: Buffer[],
  timeoutMs = 18_000,
  factory: () => Promise<OcrWorker> = () => {
    return createWorker("eng", OEM.LSTM_ONLY, { langPath: englishData.langPath, cacheMethod: "none" });
  },
): Promise<string[]> {
  let worker: OcrWorker | undefined;
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work = (async () => {
    worker = await factory();
    if (expired) {
      void worker.terminate().catch(() => undefined);
      throw new Error("OCR timed out. Retry extraction with a clear report photo.");
    }
    const pages: string[] = [];
    for (const image of images) {
      const result = await worker.recognize(image);
      if (expired) break;
      pages.push(result.data.text);
    }
    return pages;
  })();
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error("OCR timed out. Original report is retained; retry extraction."));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    // Cleanup must never delay the HTTP response.
    void worker?.terminate().catch(() => undefined);
  }
}
