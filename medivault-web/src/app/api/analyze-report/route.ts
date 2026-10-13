import { GridFSBucket, ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { renderReportPdf } from "@/lib/report-pages";
import { NextRequest, NextResponse } from "next/server";
import { recognizeReportPages } from "@/lib/report-ocr";
import { isBodyCompositionReport } from "@/lib/report-kind";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import {
  canonicalBodyMetricName,
  isPlausibleBodyMetric,
  normalizeBodyMarkers,
} from "@/lib/body-metric-registry";
import type { ReportMarker, ReportStatus } from "@/lib/vault-types";

export const maxDuration = 60;

const aiRequestTimeoutMs = 25_000;

type AnalysisResponse = {
  abnormal: number;
  aiConfidence: number;
  category: string;
  markers: ReportMarker[];
  parameters: number;
  status: ReportStatus;
  summary: string;
  title: string;
};

const bodyCompositionOrder = [
  "Height",
  "Weight",
  "BMI",
  "PBF",
  "Skeletal Muscle Mass",
  "Body Fat Mass",
  "Total Body Water",
  "Protein",
  "Minerals",
  "InBody Score",
  "Basal Metabolic Rate",
  "Waist-Hip Ratio",
  "Visceral Fat Level",
  "Obesity Degree",
  "Target Weight",
  "Weight Control",
  "Fat Control",
  "Muscle Control",
  "Right Arm Lean",
  "Left Arm Lean",
  "Trunk Lean",
  "Right Leg Lean",
  "Left Leg Lean",
  "Right Arm Fat",
  "Left Arm Fat",
  "Trunk Fat",
  "Right Leg Fat",
  "Left Leg Fat",
];

const requiredBodyCompositionNames = [
  "Height",
  "Weight",
  "BMI",
  "PBF",
  "Skeletal Muscle Mass",
  "Body Fat Mass",
  "Total Body Water",
  "Protein",
  "Minerals",
  "InBody Score",
  "Basal Metabolic Rate",
  "Waist-Hip Ratio",
  "Visceral Fat Level",
  "Obesity Degree",
  "Target Weight",
  "Weight Control",
  "Fat Control",
  "Muscle Control",
].join(", ");

function getAiProvider() {
  const provider = (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY ? "gemini" : "openai")).toLowerCase();

  if (provider === "gemini") {
    return {
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      imageLimit: 4,
      keyName: "GEMINI_API_KEY",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      providerName: "Gemini",
      supportsJsonMode: true,
    };
  }

  if (provider === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    return {
      apiKey: process.env.OLLAMA_API_KEY || "ollama",
      baseUrl: baseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, ""),
      imageLimit: 2,
      keyName: "OLLAMA_BASE_URL",
      model: process.env.OLLAMA_MODEL || "qwen3-vl:8b",
      providerName: "Ollama",
      supportsJsonMode: true,
    };
  }

  if (provider === "nvidia") {
    return {
      apiKey: process.env.NVIDIA_API_KEY,
      baseUrl: (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com").replace(/\/$/, ""),
      imageLimit: 1,
      keyName: "NVIDIA_API_KEY",
      model: process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct",
      providerName: "NVIDIA",
      supportsJsonMode: false,
    };
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: "https://api.openai.com",
    imageLimit: 2,
    keyName: "OPENAI_API_KEY",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    providerName: "OpenAI",
    supportsJsonMode: true,
  };
}

export async function GET() {
  const aiProvider = getAiProvider();
  return NextResponse.json({
    configured: Boolean(aiProvider.apiKey),
    extractionVersion: 5,
    visionTimeoutSeconds: aiRequestTimeoutMs / 1_000,
    ocrTimeoutSeconds: 18,
    keyName: aiProvider.keyName,
    model: aiProvider.model,
    provider: aiProvider.providerName,
    status: aiProvider.apiKey ? "ready" : "missing_key",
  });
}

function fallbackAnalysis(title: string, reason: string): AnalysisResponse {
  return {
    abnormal: 0,
    aiConfidence: 0,
    category: "General",
    markers: [],
    parameters: 0,
    status: "Watch",
    summary: reason,
    title: title || "Medical Report",
  };
}

type OcrMetric = {
  joinTrailingDecimal?: boolean;
  name: string;
  nextLineIndex?: number;
  nextLineWhenEmpty?: boolean;
  pattern: RegExp;
  pick?: "first" | "last";
  range: string;
  transform?: (value: number) => number;
  unit: string;
};

const bodyOcrMetrics: OcrMetric[] = [
  { name: "Height", nextLineIndex: 1, nextLineWhenEmpty: true, pattern: /\bheight\b/i, range: "> 0", unit: "cm" },
  { name: "Total Body Water", pattern: /total body water|\btbw\b/i, range: "> 0", unit: "L" },
  { name: "Protein", pattern: /\bprotein\b/i, range: "> 0", unit: "kg" },
  { name: "Minerals", pattern: /\bminerals?\b/i, range: "> 0", unit: "kg" },
  { name: "Body Fat Mass", pattern: /body fat mass/i, range: "7.5-14.9", unit: "kg" },
  { name: "Weight", pattern: /sum of the above.*?\bweight\b/i, range: "> 0", unit: "kg" },
  { name: "Skeletal Muscle Mass", pattern: /skeletal muscle mass|\bsmm\b/i, pick: "last", range: "> 0", unit: "kg" },
  { name: "BMI", pattern: /body mass index/i, range: "18.5-24.9", unit: "kg/m2" },
  { name: "PBF", pattern: /percent body fat/i, joinTrailingDecimal: true, pick: "last", range: "10-25", unit: "%" },
  { name: "InBody Score", pattern: /inbody score|body score/i, range: "70-100", unit: "score" },
  { name: "Target Weight", pattern: /target weight/i, range: "> 0", unit: "kg" },
  { name: "Weight Control", pattern: /weight control/i, range: "", unit: "kg" },
  { name: "Fat Control", pattern: /fat control/i, range: "", unit: "kg" },
  { name: "Muscle Control", pattern: /muscle control/i, range: "", unit: "kg" },
  { name: "Basal Metabolic Rate", pattern: /basal\s+\S*(?:rate|rete)|\bbmr\b/i, range: "> 0", transform: (value) => value > 0 && value < 100 ? value * 100 : value, unit: "kcal" },
  { name: "Waist-Hip Ratio", pattern: /waist\s*-?\s*hip\s*ratio|\bwhr\b/i, range: "0.80-0.90", unit: "ratio" },
  { name: "Visceral Fat Level", pattern: /visceral fat level|visceral fat/i, range: "1-9", unit: "level" },
  { name: "Obesity Degree", pattern: /obesity degree/i, range: "90-110", unit: "%" },
];

function markerStatus(value: string, range: string): ReportMarker["status"] {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || !range) return "Watch";
  const numbers = range.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (range.trim().startsWith(">")) return numericValue > (numbers[0] ?? 0) ? "Normal" : "Low";
  if (numbers.length < 2) return "Watch";
  if (numericValue < numbers[0]) return "Low";
  if (numericValue > numbers[1]) return "High";
  return "Normal";
}

function numberAfterLabel(lines: string[], metric: OcrMetric) {
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
    if (metric.joinTrailingDecimal && !selected?.match(/\d[.,]\d/)) continue;
    if (!selected) continue;
    const cleanValue = selected.replace(/\s/g, "").replace(",", ".");
    const numericValue = Number(cleanValue);
    if (!Number.isFinite(numericValue)) continue;
    const transformed = metric.transform ? metric.transform(numericValue) : numericValue;
    return Number.isInteger(transformed) ? String(transformed) : String(Number(transformed.toFixed(2)));
  }
  return "";
}

async function bodyCompositionOcrAnalysis(title: string, imageUrls: string[], failureReason: string): Promise<AnalysisResponse> {
  if (!imageUrls.length) return fallbackAnalysis(title, failureReason);

  try {
    const images = imageUrls.slice(0, 2).flatMap((dataUrl) => {
      const encoded = dataUrl.split(",", 2)[1];
      return encoded ? [Buffer.from(encoded, "base64")] : [];
    });
    const pages = await recognizeReportPages(images);
    const lines = pages.join("\n").split(/\r?\n/).map((line) => line.replace(/[|_]/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    const markers = bodyOcrMetrics.flatMap((metric) => {
      const value = numberAfterLabel(lines, metric);
      if (!value) return [];
      return [{
        name: metric.name,
        range: "Confirm reference range in original",
        status: "Watch",
        value: `${value} ${metric.unit}`.trim(),
      } satisfies ReportMarker];
    });

    if (markers.length < 3) {
      return fallbackAnalysis(title, `${failureReason} OCR could not confidently detect enough structured values. Upload a clear, straight scan.`);
    }
    const normalized = normalizeBodyCompositionMarkers(markers);
    const abnormal = normalized.filter((marker) => marker.status !== "Normal").length;
    return {
      abnormal,
      aiConfidence: 68,
      category: "Body Composition",
      markers: normalized,
      parameters: normalized.length,
      status: "Needs review",
      summary: `${normalized.length} body-composition values extracted with OCR. Review every value before verification.`,
      title: title || "BMI & Body Composition",
    };
  } catch {
    return fallbackAnalysis(title, `${failureReason} OCR processing also failed. Try a clearer JPG/PNG or configure the vision API.`);
  }
}

function cleanMarker(marker: Partial<ReportMarker>): ReportMarker {
  const status = marker.status === "High" || marker.status === "Low" || marker.status === "Normal" ? marker.status : "Watch";
  return {
    name: String(marker.name || "Detected value").slice(0, 60),
    range: String(marker.range || "Reference range not detected").slice(0, 80),
    status,
    value: String(marker.value || "--").slice(0, 60),
  };
}

function canonicalBodyCompositionName(name: string) {
  return canonicalBodyMetricName(name);
}

function normalizeBodyCompositionMarkers(markers: ReportMarker[]) {
  const canonical = normalizeBodyMarkers(markers.map((marker) => ({ ...marker, name: canonicalBodyCompositionName(marker.name) })));
  const normalized = canonical.filter((marker) => isPlausibleBodyMetric(marker, canonical));

  return normalized.sort((left, right) => {
    const leftIndex = bodyCompositionOrder.indexOf(left.name);
    const rightIndex = bodyCompositionOrder.indexOf(right.name);
    if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return {};
  }
  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

function completionText(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to analyze reports." }, { status: 401 });
  }

  const aiProvider = getAiProvider();
  const body = await request.json().catch(() => null) as {
    fileId?: string;
    fileDataUrl?: string;
    fileDataUrls?: string[];
    fileName?: string;
    lab?: string;
    memberName?: string;
    mimeType?: string;
    originalMimeType?: string;
    reportKind?: string;
    title?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const title = body.title || body.fileName?.replace(/\.[^.]+$/, "") || "Medical Report";
  let imageUrls = (Array.isArray(body.fileDataUrls) && body.fileDataUrls.length ? body.fileDataUrls : body.fileDataUrl ? [body.fileDataUrl] : [])
    .filter((url) => typeof url === "string" && url.startsWith("data:image/"))
    .slice(0, aiProvider.imageLimit);
  if (body.fileId) {
    if (!ObjectId.isValid(body.fileId)) return NextResponse.json({ error: "Invalid report file." }, { status: 400 });
    const db = await getMongoDb();
    const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
    const id = new ObjectId(body.fileId);
    const file = await bucket.find({ _id: id, "metadata.userId": userId }).next();
    if (!file) return NextResponse.json({ error: "Report file not found for this account." }, { status: 404 });
    if (file.length > 20 * 1024 * 1024) return NextResponse.json({ error: "Report exceeds the 20 MB limit." }, { status: 413 });
    const chunks: Buffer[] = [];
    for await (const chunk of bucket.openDownloadStream(id)) chunks.push(Buffer.from(chunk));
    const buffer = Buffer.concat(chunks);
    try {
      imageUrls = file.contentType === "application/pdf"
        ? await renderReportPdf(buffer, aiProvider.imageLimit)
        : file.contentType?.startsWith("image/") ? [`data:${file.contentType};base64,${buffer.toString("base64")}`] : [];
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "PDF pages could not be read. Upload a readable report photo." }, { status: 422 });
    }
  }
  const isImage = Boolean(
    imageUrls.length &&
    (imageUrls[0].startsWith("data:image/") ||
      body.mimeType?.startsWith("image/") ||
      body.fileName?.match(/\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i))
  );
  if (!isImage) {
    return NextResponse.json(
      fallbackAnalysis(title, "This file could not be prepared for AI analysis. Upload a JPG, PNG, or readable PDF."),
      { status: 200 },
    );
  }

  if (imageUrls.some((url) => url.length > 5_500_000)) {
    return NextResponse.json(
      fallbackAnalysis(title, "File page is too large for AI analysis. Crop the report area or upload a clearer screenshot under 4 MB."),
      { status: 200 },
    );
  }

  const isBodyComposition = isBodyCompositionReport({ ...body, title });
  // Known InBody files can be read locally without waiting for the vision API.
  const bodyOcrResult = isBodyComposition
    ? await bodyCompositionOcrAnalysis(title, imageUrls, "Local extraction could not finish.")
    : null;
  if (bodyOcrResult?.parameters) return NextResponse.json(bodyOcrResult);
  if (!aiProvider.apiKey) {
    const reason = `${aiProvider.providerName} API key is not configured.`;
    return NextResponse.json(
      isBodyComposition
        ? { ...bodyOcrResult!, summary: `${reason} ${bodyOcrResult!.summary}` }
        : fallbackAnalysis(title, `${reason} Set ${aiProvider.keyName} (or GEMINI_API_KEY) in server environment variables and redeploy the app.`),
      { status: 200 },
    );
  }

  const prompt = [
    imageUrls.length > 1
      ? "Analyze these medical report page images for a personal health vault."
      : "Analyze this medical report page image for a personal health vault.",
    isBodyComposition
      ? "This is a BMI/body composition report or machine/photo reading, often an InBody-style printout. Extract visible values exactly. Do not only store the photo. Return structured markers for every visible current body-composition value."
      : "Prioritize clinical lab values and biomarkers visible in the report.",
    "Return only JSON with: title, category, summary, markers.",
    "Extract all visible measured parameters, including qualitative results. Keep units in value and the printed reference interval in range. Never invent values, use upload placeholders, or treat patient identifiers as measurements. Mark uncertain or unreadable results Watch; omit values that cannot be read.",
    "markers must be an array of {name,value,range,status}; status must be Normal, High, Low, or Watch.",
    "For body composition values, keep consistent marker names so history graphs work across uploads. Put units in value when visible, for example \"67.7 kg\", \"22.8 %\", or \"1499 kcal\".",
    isBodyComposition ? `Required body-composition marker names when visible: ${requiredBodyCompositionNames}. Also extract segmental lean/fat values when visible, for example Right Arm Lean, Left Arm Lean, Trunk Lean, Right Leg Lean, Left Leg Lean, Right Arm Fat, Left Arm Fat, Trunk Fat, Right Leg Fat, Left Leg Fat.` : "",
    isBodyComposition ? "If the photo includes a body composition history table, extract the current/latest result from the main report and ignore old history rows unless there is no main current value." : "",
    "Keep summary short, doctor-ready, and avoid diagnosis. Mention that a doctor should review abnormal results.",
    `Patient/member: ${body.memberName || "Family member"}`,
    `Uploaded title: ${title}`,
    `Lab/doctor: ${body.lab || "Unknown"}`,
    `Original file type: ${body.originalMimeType || body.mimeType || "Unknown"}`,
    "JSON shape: {\"title\":\"...\",\"category\":\"...\",\"summary\":\"...\",\"markers\":[{\"name\":\"Vitamin D\",\"value\":\"18 ng/mL\",\"range\":\"30-100 ng/mL\",\"status\":\"Low\"}]}",
  ].join("\n");

  let openAiResponse: Response;
  const imageContent = imageUrls.map((url) => ({
    type: "image_url",
    image_url: aiProvider.providerName === "OpenAI" ? { url, detail: "high" } : { url },
  }));
  const requestPayload = {
    model: aiProvider.model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...imageContent,
        ],
      },
    ],
    ...(aiProvider.supportsJsonMode ? { response_format: { type: "json_object" } } : {}),
    max_tokens: 4_000,
    temperature: 0.1,
  };

  try {
    openAiResponse = await fetch(`${aiProvider.baseUrl}${aiProvider.providerName === "Gemini" ? "" : "/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiProvider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(aiRequestTimeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    const failureReason = timedOut
      ? `${aiProvider.providerName} analysis exceeded ${Math.round(aiRequestTimeoutMs / 1_000)} seconds.`
      : `${aiProvider.providerName} service connection failed.`;
    return NextResponse.json(
      isBodyComposition
        ? { ...bodyOcrResult!, summary: `${failureReason} ${bodyOcrResult!.summary}` }
        : fallbackAnalysis(title, `${failureReason} Original report is saved. Retry extraction from the report details.`),
      { status: 200 },
    );
  }

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const friendlyError = aiProvider.providerName === "Ollama" && /model|not found/i.test(errorText)
      ? `Ollama model is not installed. Run "ollama pull ${aiProvider.model}" on the Ollama host.`
      : errorText.includes("insufficient_quota") || errorText.includes("quota")
        ? `${aiProvider.providerName} quota exceeded. Your account has $0 balance (add credit at platform.openai.com/settings/billing or set GEMINI_API_KEY for free AI).`
      : errorText.includes("model")
        ? `AI model "${aiProvider.model}" is not available for this key. Check ${aiProvider.providerName} model setting.`
      : errorText.includes("Incorrect API key") || errorText.includes("invalid_api_key")
        ? `${aiProvider.providerName} API key is invalid. Update ${aiProvider.keyName} in deployment variables and redeploy.`
        : `AI analysis could not finish (${openAiResponse.status}): ${errorText.slice(0, 180)}`;
    return NextResponse.json(
      isBodyComposition
        ? { ...bodyOcrResult!, summary: `${friendlyError} ${bodyOcrResult!.summary}` }
        : fallbackAnalysis(title, friendlyError),
      { status: 200 },
    );
  }

  const completion = await openAiResponse.json();
  const content = completionText(completion?.choices?.[0]?.message?.content);
  let parsed: Partial<AnalysisResponse> = {};
  try {
    parsed = extractJsonObject(content || "{}") as Partial<AnalysisResponse>;
  } catch {
    parsed = {};
  }
  const rawMarkers = Array.isArray(parsed.markers)
    ? parsed.markers.slice(0, 80).map(cleanMarker).filter((marker) => !/^(uploaded|pending|processing|--|n\/a)$/i.test(marker.value.trim()))
    : [];
  const markers = isBodyComposition ? normalizeBodyCompositionMarkers(rawMarkers).slice(0, 40) : rawMarkers;

  if (isBodyComposition && markers.length < 3) {
    return NextResponse.json(
      { ...bodyOcrResult!, summary: `${aiProvider.providerName} did not return enough structured body-composition values. ${bodyOcrResult!.summary}` },
      { status: 200 },
    );
  }

  if (!markers.length) {
    return NextResponse.json(
      fallbackAnalysis(title, `${aiProvider.providerName} could not detect structured report values. Try a clearer, straight image.`),
      { status: 200 },
    );
  }

  const abnormal = markers.filter((marker) => marker.status !== "Normal").length;

  return NextResponse.json({
    abnormal,
    aiConfidence: markers.length ? 88 : 60,
    category: String(parsed.category || (isBodyComposition ? "Body Composition" : "General")).slice(0, 40),
    markers,
    parameters: markers.length,
    status: abnormal ? "Needs review" : "Reviewed",
    summary: String(parsed.summary || "Report analyzed. Review values with your doctor.").slice(0, 280),
    title: String(parsed.title || title).slice(0, 80),
  } satisfies AnalysisResponse);
}
