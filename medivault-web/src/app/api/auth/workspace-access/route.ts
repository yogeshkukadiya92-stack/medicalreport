import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isBootstrapAdminUser } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { LabUser, WorkspaceAccess } from "@/lib/vault-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }
  const userId = user.id;
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
  }

  if (isBootstrapAdminUser(user)) {
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
