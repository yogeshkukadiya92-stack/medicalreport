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
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const body = await request.json().catch(() => null) as {
    fileDataUrl?: string;
    fileName?: string;
    lab?: string;
    memberName?: string;
    mimeType?: string;
    title?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const title = body.title || body.fileName?.replace(/\.[^.]+$/, "") || "Medical Report";
  if (!apiKey) {
    return NextResponse.json(
      fallbackAnalysis(title, "OpenAI API key is not configured yet. Add OPENAI_API_KEY in Railway Variables to enable live AI analysis."),
      { status: 200 },
    );
  }

  const isImage = Boolean(body.mimeType?.startsWith("image/") && body.fileDataUrl);
  if (!isImage) {
    return NextResponse.json(
      fallbackAnalysis(title, "PDF upload is saved. Image-based AI extraction is live; PDF text extraction needs a PDF parser service before reliable value extraction."),
      { status: 200 },
    );
  }

  if (body.fileDataUrl && body.fileDataUrl.length > 5_500_000) {
    return NextResponse.json(
      fallbackAnalysis(title, "Image is too large for AI analysis. Crop the report area or upload a clearer screenshot under 4 MB."),
      { status: 200 },
    );
  }

  const prompt = [
    "Analyze this medical report image for a personal health vault.",
    "Return only JSON with: title, category, summary, markers.",
    "markers must be an array of {name,value,range,status}; status must be Normal, High, Low, or Watch.",
    "Keep summary short, doctor-ready, and avoid diagnosis. Mention that a doctor should review abnormal results.",
    `Patient/member: ${body.memberName || "Family member"}`,
    `Uploaded title: ${title}`,
    `Lab/doctor: ${body.lab || "Unknown"}`,
  ].join("\n");

  let openAiResponse: Response;
  try {
    openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: body.fileDataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
    });
  } catch {
    return NextResponse.json(
      fallbackAnalysis(title, "AI service connection failed. Confirm OPENAI_API_KEY is set on Railway and redeploy the app."),
      { status: 200 },
    );
  }

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const friendlyError = errorText.includes("model")
      ? "AI model is not available for this key. Set OPENAI_MODEL=gpt-4o-mini or remove OPENAI_MODEL from Railway Variables."
      : errorText.includes("Incorrect API key") || errorText.includes("invalid_api_key")
        ? "OpenAI API key is invalid. Update OPENAI_API_KEY in Railway Variables and redeploy."
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
