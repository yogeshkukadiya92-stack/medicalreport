import { NextRequest, NextResponse } from "next/server";
import { POST as handleBodyCompositionImport } from "@/app/api/body-composition/telegram-import/route";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/body-composition/webhook-import",
    method: "POST",
    authentication: "Authorization: Bearer <N8N_IMPORT_TOKEN>",
    contentType: "multipart/form-data",
    requiredFields: ["sourceId", "clientName", "clientPhone", "file"],
    optionalFields: ["reportDate"],
    acceptedFiles: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMb: 12,
  });
}

export async function POST(request: NextRequest) {
  return handleBodyCompositionImport(request);
}
