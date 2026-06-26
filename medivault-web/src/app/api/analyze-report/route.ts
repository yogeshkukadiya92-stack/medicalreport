import { NextRequest, NextResponse } from "next/server";
import type { ReportMarker, ReportStatus } from "@/components/app-data-provider";

export const maxDuration = 45;

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

function getAiProvider() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  if (provider === "nvidia") {
    return {
      apiKey: process.env.NVIDIA_API_KEY,
      baseUrl: (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com").replace(/\/$/, ""),
      imageLimit: 1,
      keyName: "NVIDIA_API_KEY",
      model: process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct",
      providerName: "NVIDIA",
    };
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: "https://api.openai.com",
    imageLimit: 2,
    keyName: "OPENAI_API_KEY",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    providerName: "OpenAI",
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

function cleanMarker(marker: Partial<ReportMarker>): ReportMarker {
  const status = marker.status === "High" || marker.status === "Low" || marker.status === "Watch" ? marker.status : "Normal";
  return {
    name: String(marker.name || "Detected value").slice(0, 60),
    range: String(marker.range || "Reference range not detected").slice(0, 80),
    status,
    value: String(marker.value || "--").slice(0, 60),
  };
}

export async function POST(request: NextRequest) {
  const aiProvider = getAiProvider();
  const body = await request.json().catch(() => null) as {
    fileDataUrl?: string;
    fileDataUrls?: string[];
    fileName?: string;
    lab?: string;
    memberName?: string;
    mimeType?: string;
    originalMimeType?: string;
    title?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const title = body.title || body.fileName?.replace(/\.[^.]+$/, "") || "Medical Report";
  if (!aiProvider.apiKey) {
    return NextResponse.json(
      fallbackAnalysis(title, `${aiProvider.providerName} API key is not configured yet. Add ${aiProvider.keyName} in Railway Variables to enable live AI analysis.`),
      { status: 200 },
    );
  }

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

  const prompt = [
    imageUrls.length > 1
      ? "Analyze these medical report page images for a personal health vault."
      : "Analyze this medical report page image for a personal health vault.",
    "Return only JSON with: title, category, summary, markers.",
    "markers must be an array of {name,value,range,status}; status must be Normal, High, Low, or Watch.",
    "Keep summary short, doctor-ready, and avoid diagnosis. Mention that a doctor should review abnormal results.",
    `Patient/member: ${body.memberName || "Family member"}`,
    `Uploaded title: ${title}`,
    `Lab/doctor: ${body.lab || "Unknown"}`,
    `Original file type: ${body.originalMimeType || body.mimeType || "Unknown"}`,
  ].join("\n");

  let openAiResponse: Response;
  try {
    openAiResponse = await fetch(`${aiProvider.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiProvider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiProvider.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageUrls.map((url) => ({ type: "image_url", image_url: { url, detail: "high" } })),
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
    });
  } catch {
    return NextResponse.json(
      fallbackAnalysis(title, `${aiProvider.providerName} service connection failed. Confirm ${aiProvider.keyName} is set on Railway and redeploy the app.`),
      { status: 200 },
    );
  }

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const friendlyError = errorText.includes("model")
      ? `AI model is not available for this key. Check ${aiProvider.providerName} model setting in Railway Variables.`
      : errorText.includes("Incorrect API key") || errorText.includes("invalid_api_key")
        ? `${aiProvider.providerName} API key is invalid. Update ${aiProvider.keyName} in Railway Variables and redeploy.`
        : `AI analysis could not finish: ${errorText.slice(0, 180)}`;
    return NextResponse.json(
      fallbackAnalysis(title, friendlyError),
      { status: 200 },
    );
  }

  const completion = await openAiResponse.json();
  const content = completion?.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content || "{}") as Partial<AnalysisResponse>;
  const markers = Array.isArray(parsed.markers) ? parsed.markers.slice(0, 8).map(cleanMarker) : fallbackMarkers;
  const abnormal = markers.filter((marker) => marker.status !== "Normal").length;

  return NextResponse.json({
    abnormal,
    aiConfidence: markers.length ? 88 : 60,
    category: String(parsed.category || "General").slice(0, 40),
    markers,
    parameters: Math.max(markers.length, 1),
    status: abnormal ? "Needs review" : "Reviewed",
    summary: String(parsed.summary || "Report analyzed. Review values with your doctor.").slice(0, 280),
    title: String(parsed.title || title).slice(0, 80),
  } satisfies AnalysisResponse);
}
