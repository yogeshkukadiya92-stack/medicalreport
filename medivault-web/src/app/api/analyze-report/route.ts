import { NextRequest, NextResponse } from "next/server";
import { createWorker, OEM } from "tesseract.js";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import type { ReportMarker, ReportStatus } from "@/lib/vault-types";

export const maxDuration = 60;

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

const fallbackMarkers: ReportMarker[] = [
  { name: "Report", value: "Uploaded", range: "Needs review", status: "Watch" },
];

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

const bodyCompositionAliases: Array<[RegExp, string]> = [
  [/^height|stature/i, "Height"],
  [/^weight$|body weight|total weight/i, "Weight"],
  [/^bmi|body mass index/i, "BMI"],
  [/^pbf|percent body fat|body fat percentage|fat %|body fat %/i, "PBF"],
  [/^smm\b|skeletal muscle|skeletal muscle mass|muscle mass/i, "Skeletal Muscle Mass"],
  [/body fat mass|fat mass$/i, "Body Fat Mass"],
  [/total body water|^tbw\b/i, "Total Body Water"],
  [/protein/i, "Protein"],
  [/minerals?/i, "Minerals"],
  [/inbody score|body score|fitness score/i, "InBody Score"],
  [/basal metabolic rate|^bmr\b/i, "Basal Metabolic Rate"],
  [/waist[-\s]?hip|^whr\b/i, "Waist-Hip Ratio"],
  [/visceral fat level|visceral fat/i, "Visceral Fat Level"],
  [/obesity degree/i, "Obesity Degree"],
  [/target weight/i, "Target Weight"],
  [/weight control/i, "Weight Control"],
  [/fat control/i, "Fat Control"],
  [/muscle control/i, "Muscle Control"],
  [/right arm.*lean|ra.*lean/i, "Right Arm Lean"],
  [/left arm.*lean|la.*lean/i, "Left Arm Lean"],
  [/trunk.*lean|torso.*lean/i, "Trunk Lean"],
  [/right leg.*lean|rl.*lean/i, "Right Leg Lean"],
  [/left leg.*lean|ll.*lean/i, "Left Leg Lean"],
  [/right arm.*fat|ra.*fat/i, "Right Arm Fat"],
  [/left arm.*fat|la.*fat/i, "Left Arm Fat"],
  [/trunk.*fat|torso.*fat/i, "Trunk Fat"],
  [/right leg.*fat|rl.*fat/i, "Right Leg Fat"],
  [/left leg.*fat|ll.*fat/i, "Left Leg Fat"],
];

function getAiProvider() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
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

function fallbackAnalysis(title: string, reason: string): AnalysisResponse {
  return {
    abnormal: 1,
    aiConfidence: 0,
    category: "General",
    markers: fallbackMarkers,
    parameters: 1,
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
    const afterLabel = line.slice(match.index + match[0].length);
    let values = afterLabel.match(/[+-]?\s*\d+(?:[.,]\d+)?/g) ?? [];
    if (metric.name === "Weight" && /target weight/i.test(afterLabel) && lines[index + 1]) {
      values = lines[index + 1].match(/[+-]?\s*\d+(?:[.,]\d+)?/g) ?? [];
    } else if (!values.length && metric.nextLineWhenEmpty && lines[index + 1]) {
      values = lines[index + 1].match(/[+-]?\s*\d+(?:[.,]\d+)?/g) ?? [];
    }
    let selected = metric.nextLineWhenEmpty && afterLabel.match(/\d/) === null && metric.nextLineIndex !== undefined
      ? values[metric.nextLineIndex]
      : metric.pick === "last" ? values.at(-1) : values[0];
    if (metric.joinTrailingDecimal && values.length >= 2) {
      const integer = values.at(-2)?.replace(/\s/g, "");
      const decimal = values.at(-1)?.replace(/\s/g, "");
      if (integer && decimal && /^\d{1,2}$/.test(integer) && /^\d$/.test(decimal)) selected = `${integer}.${decimal}`;
    }
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

  const worker = await createWorker("eng", OEM.LSTM_ONLY, { cachePath: "/tmp/tesseract" });
  try {
    const pages: string[] = [];
    for (const dataUrl of imageUrls.slice(0, 2)) {
      const encoded = dataUrl.split(",", 2)[1];
      if (!encoded) continue;
      const result = await worker.recognize(Buffer.from(encoded, "base64"));
      pages.push(result.data.text);
    }
    const lines = pages.join("\n").split(/\r?\n/).map((line) => line.replace(/[|_]/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    const markers = bodyOcrMetrics.flatMap((metric) => {
      const value = numberAfterLabel(lines, metric);
      if (!value) return [];
      return [{
        name: metric.name,
        range: metric.range || "Manual review",
        status: markerStatus(value, metric.range),
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
      status: abnormal ? "Needs review" : "Reviewed",
      summary: `${normalized.length} body-composition values extracted with OCR. Review every value before verification.`,
      title: title || "BMI & Body Composition",
    };
  } catch {
    return fallbackAnalysis(title, `${failureReason} OCR processing also failed. Try a clearer JPG/PNG or configure the vision API.`);
  } finally {
    await worker.terminate();
  }
}

function cleanMarker(marker: Partial<ReportMarker>): ReportMarker {
  const status = marker.status === "High" || marker.status === "Low" || marker.status === "Watch" ? marker.status : "Normal";
  return {
    name: String(marker.name || "Detected value").slice(0, 60),
    range: String(marker.range || "Reference range not detected").slice(0, 80),
    status,
    value: String(marker.value || "--").slice(0, 60),
  };
}

function canonicalBodyCompositionName(name: string) {
  const cleanName = name.trim();
  const alias = bodyCompositionAliases.find(([pattern]) => pattern.test(cleanName));
  return alias?.[1] ?? cleanName;
}

function normalizeBodyCompositionMarkers(markers: ReportMarker[]) {
  const seen = new Set<string>();
  const normalized = markers
    .map((marker) => ({
      ...marker,
      name: canonicalBodyCompositionName(marker.name),
    }))
    .filter((marker) => {
      const key = marker.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

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

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to analyze reports." }, { status: 401 });
  }

  const aiProvider = getAiProvider();
  const body = await request.json().catch(() => null) as {
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
  const imageUrls = (Array.isArray(body.fileDataUrls) && body.fileDataUrls.length ? body.fileDataUrls : body.fileDataUrl ? [body.fileDataUrl] : [])
    .filter((url) => typeof url === "string" && url.startsWith("data:image/"))
    .slice(0, aiProvider.imageLimit);
  const isImage = Boolean(body.mimeType?.startsWith("image/") && imageUrls.length);
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

  const isBodyComposition = body.reportKind === "body_composition" || /body composition|bmi|body scan|inbody|smart scale/i.test(`${title} ${body.lab || ""}`);
  if (!aiProvider.apiKey) {
    const reason = `${aiProvider.providerName} API key is not configured.`;
    return NextResponse.json(
      isBodyComposition
        ? await bodyCompositionOcrAnalysis(title, imageUrls, reason)
        : fallbackAnalysis(title, `${reason} Add ${aiProvider.keyName} in Railway Variables to enable live AI analysis.`),
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
    temperature: 0.1,
  };

  try {
    openAiResponse = await fetch(`${aiProvider.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiProvider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
    });
  } catch {
    return NextResponse.json(
      isBodyComposition
        ? await bodyCompositionOcrAnalysis(title, imageUrls, `${aiProvider.providerName} service connection failed.`)
        : fallbackAnalysis(title, `${aiProvider.providerName} service connection failed. Confirm ${aiProvider.keyName} is set on Railway and redeploy the app.`),
      { status: 200 },
    );
  }

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const friendlyError = aiProvider.providerName === "Ollama" && /model|not found/i.test(errorText)
      ? `Ollama model is not installed. Run "ollama pull ${aiProvider.model}" on the Ollama host.`
      : errorText.includes("model")
        ? `AI model is not available for this key. Check ${aiProvider.providerName} model setting in Railway Variables.`
      : errorText.includes("Incorrect API key") || errorText.includes("invalid_api_key")
        ? `${aiProvider.providerName} API key is invalid. Update ${aiProvider.keyName} in Railway Variables and redeploy.`
        : `AI analysis could not finish (${openAiResponse.status}): ${errorText.slice(0, 180)}`;
    return NextResponse.json(
      isBodyComposition
        ? await bodyCompositionOcrAnalysis(title, imageUrls, friendlyError)
        : fallbackAnalysis(title, friendlyError),
      { status: 200 },
    );
  }

  const completion = await openAiResponse.json();
  const content = completion?.choices?.[0]?.message?.content;
  const parsed = extractJsonObject(content || "{}") as Partial<AnalysisResponse>;
  const rawMarkers = Array.isArray(parsed.markers) ? parsed.markers.slice(0, isBodyComposition ? 48 : 8).map(cleanMarker) : fallbackMarkers;
  const markers = isBodyComposition ? normalizeBodyCompositionMarkers(rawMarkers).slice(0, 40) : rawMarkers;
  const abnormal = markers.filter((marker) => marker.status !== "Normal").length;

  return NextResponse.json({
    abnormal,
    aiConfidence: markers.length ? 88 : 60,
    category: String(parsed.category || (isBodyComposition ? "Body Composition" : "General")).slice(0, 40),
    markers,
    parameters: Math.max(markers.length, 1),
    status: abnormal ? "Needs review" : "Reviewed",
    summary: String(parsed.summary || "Report analyzed. Review values with your doctor.").slice(0, 280),
    title: String(parsed.title || title).slice(0, 80),
  } satisfies AnalysisResponse);
}
