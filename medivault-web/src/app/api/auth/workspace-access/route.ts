import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, isBootstrapAdminUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { LabUser, WorkspaceAccess } from "@/lib/vault-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
  }

  if (isBootstrapAdminUserId(userId)) {
    return NextResponse.json({ workspaceAccess: ["lab", "nutrition", "body_composition"] satisfies WorkspaceAccess[] });
  }

  const db = await getMongoDb();
  const membership = await db.collection<LabUser>("labUsers").findOne(
    { userId },
    { projection: { _id: 0, workspaceAccess: 1 } },
  );
  const workspaceAccess = membership?.workspaceAccess ?? (membership ? ["lab"] : []);
  return NextResponse.json({ workspaceAccess });
}
